#!/usr/bin/env bash
set -euo pipefail
umask 022
export LC_ALL=C TZ=UTC
python3 - <<'PY'
import json, hashlib
from pathlib import Path
record = json.loads(Path('/inputs/input-record.json').read_text())
assert record['sources'] == json.loads(Path('/opt/machmo/sources.json').read_text()), 'source pins mismatch'
for name in ('ngspice.tar', 'wrapper.tar'):
    data = Path('/inputs',name).read_bytes()
    assert len(data) == record['artifacts'][name]['bytes']
    assert hashlib.sha256(data).hexdigest() == record['artifacts'][name]['sha256'], name + ' hash mismatch'
PY
mkdir -p /work/ngspice /work/wrapper /output
if [ ! -d /work/original ]; then
tar -xf /inputs/ngspice.tar -C /work/ngspice
tar -xf /inputs/wrapper.tar -C /work/wrapper
cp -a /work/ngspice /work/original
fi
cd /work/ngspice
# Patches derived from the pinned upstream EEcircuit build recipe. Keep originals
# alongside a unified patch; never mutate the read-only input archives.
python3 - <<'PY'
from pathlib import Path
p = Path('/work/wrapper/Docker/hicum2_patch.sh')
p.write_bytes(p.read_bytes().replace(b'\r\n', b'\n'))
PY
bash -e /work/wrapper/Docker/hicum2_patch.sh
python3 - <<'PY'
from pathlib import Path
p = Path('configure.ac')
s = p.read_text().replace('-Wno-unused-but-set-variable', '-Wno-unused-const-variable').replace('AC_CHECK_FUNCS([time getrusage])', 'AC_CHECK_FUNCS([time])')
p.write_text(s)
p = Path('src/frontend/control.c')
s = p.read_text()
needle = '#include "ngspice/ngspice.h"'
assert s.count(needle) == 1
if 'EM_ASYNC_JS(void, eesim_sleep_hack' not in s:
    s = s.replace(needle, '#include <emscripten.h>\nEM_ASYNC_JS(void, eesim_sleep_hack, (), {\n if (Module["handleThings"]) await new Promise((resolve) => { Module["handleThings"](); });\n});\n' + needle)
needle = 'freewl = wlist = getcommand(string);'
assert s.count(needle) == 1
if 'eesim_sleep_hack();' not in s:
    s = s.replace(needle, 'eesim_sleep_hack();\n        ' + needle)
p.write_text(s)
# The JS command callback is an interactive virtual terminal even in Node.
# Emscripten custom stdin devices otherwise report !isatty and ngspice tries
# to consume stdin as a complete circuit before entering its command loop.
p = Path('src/main.c')
s = p.read_text()
s = s.replace('istty = (bool) isatty(fileno(stdin));', 'istty = TRUE; /* Mach Mo WASM command callback, 2026-11-17 */')
p.write_text(s)
# Model families with extra distribution terms are outside the web build profile.
import re
models = {'bsim4':'get_bsim4_info', 'hisim2':'get_hsm2_info', 'hisimhv1':'get_hsmhv_info', 'hisimhv2':'get_hsmhv2_info'}
for name, symbol in models.items():
    p = Path('src/Makefile.am')
    p.write_text(''.join(l for l in p.read_text().splitlines(True) if f'spicelib/devices/{name}/' not in l))
    p = Path('src/spicelib/devices/Makefile.am')
    p.write_text(''.join(l for l in p.read_text().splitlines(True) if not re.match(r'^\s*' + name + r'\s*(?:\\)?\s*$', l)))
    p = Path('src/spicelib/devices/dev.c')
    text = ''.join(l for l in p.read_text().splitlines(True) if f'#include "{name}/' not in l and symbol not in l)
    text = text.replace('"' + name + '", ', '')
    p.write_text(text)
PY
: > /output/source.patch
for file in configure.ac src/frontend/control.c src/main.c src/Makefile.am src/spicelib/devices/Makefile.am src/spicelib/devices/dev.c tests/Makefile.am; do
  diff -u "/work/original/$file" "/work/ngspice/$file" >> /output/source.patch || test "$?" -eq 1
done
cp /work/wrapper/Docker/pre.js /output/pre.js
cat >> /output/pre.js <<'JS'
// Mạch Mở 2026-11-17: use the same command callback in Node and browsers.
// Emscripten's default Node stdin is synchronous and would block the event loop.
var machmoInput = [];
Module["stdin"] = function() {
  if (!machmoInput.length) {
    machmoInput = Array.from((Module["getInput"] ? Module["getInput"]() : " ") + "\n", function(c) { return c.charCodeAt(0); });
  }
  return machmoInput.shift();
};
JS
emcc --version > /output/toolchain.txt
dpkg-query -W > /output/build-packages.tsv
./autogen.sh > /output/autogen.log 2>&1
mkdir -p release
cd release
emconfigure ../configure --disable-debug --disable-openmp --disable-xspice --disable-osdi --disable-cider --disable-klu --disable-oldapps --without-x --with-readline=no --with-editline=no --with-fftw3=no > /output/configure.log 2>&1
cp config.log /output/config.log
cp src/include/ngspice/config.h /output/config.h
python3 - <<'PY'
from pathlib import Path
p = Path('src/Makefile')
s = p.read_text()
needle = '$(ngspice_LDADD) $(LIBS)'
assert s.count(needle) == 1, s.count(needle)
flags = ' -O2 -s ASYNCIFY=1 -s ASYNCIFY_ADVISE=0 -s ASYNCIFY_IGNORE_INDIRECT=0 -s ENVIRONMENT="web,worker,node" -s ALLOW_MEMORY_GROWTH=1 -s MODULARIZE=1 -s EXPORT_ES6=1 -s EXPORTED_RUNTIME_METHODS=["FS","Asyncify","callMain"] --pre-js /output/pre.js -Wl,-Map=/output/spice.map -o spice.mjs'
p.write_text(s.replace(needle, needle + flags))
PY
emmake make -j2 > /output/make.log 2>&1
cp src/spice.mjs src/spice.wasm /output/
cp ../COPYING /output/ngspice-COPYING.txt
# Source material is packaged with the patch, compiler records and link map.
cp /inputs/ngspice.tar /output/ngspice-source.tar
cp /inputs/wrapper.tar /output/wrapper-source.tar
cp /inputs/input-record.json /output/input-record.json
tar -czf /output/relink-build.tar.gz --exclude='*.log' -C /work/ngspice release
mkdir -p /output/toolchain-notices
find /emsdk/upstream/emscripten -maxdepth 6 -type f \( -iname '*license*' -o -name 'COPYRIGHT' \) -print > /output/toolchain-notice-paths.txt
tar -czf /output/toolchain-notices.tar.gz -T /output/toolchain-notice-paths.txt
sha256sum /output/spice.mjs /output/spice.wasm /output/source.patch /output/pre.js > /output/SHA256SUMS
echo 'Candidate JS/WASM built; distribution gate remains pending review.'
