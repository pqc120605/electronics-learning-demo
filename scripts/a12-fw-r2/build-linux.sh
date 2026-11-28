#!/usr/bin/env bash
set -euo pipefail

stage=/r2
qemu=/qemu-source
qemu_build=/qemu-build-pinned-meson
sources=$stage/build-sources
out=$stage/runtime
avr_archive=$stage/avr-mcsim.tar.gz

test "$(git -C "$qemu" rev-parse HEAD)" = a8c6e6bd8c4dc4f95aee87c30e3b3093512ae7b5
printf '%s  %s\n' 92c5326b926c7021fdb1ae1b571743720d0edc9a55f3eb47c447b34c3f7abc11 "$avr_archive" | sha256sum -c
if git -C "$qemu" apply --check "$sources/qemu-s2.patch" >/dev/null 2>&1; then
    git -C "$qemu" apply "$sources/qemu-s2.patch"
else
    git -C "$qemu" apply --reverse --check "$sources/qemu-s2.patch"
fi

ninja -C "$qemu_build" -j4 qemu-system-xtensa
work=$(mktemp -d /tmp/avr-mcsim-a12.XXXXXXXX)
trap 'rm -rf -- "$work"' EXIT
tar -xzf "$avr_archive" --strip-components=1 -C "$work"
cd "$work"
patch -p1 < "$sources/avr-mcsim.patch"
gcc -std=gnu11 -O2 -DNO_DYNLD -I. \
    "$sources/nano-runner.c" octsx/system.c avr0dev/mega4809.c \
    avr0per/{adc,clkctrl,port,rstctrl,slpctrl,syscfg,tca,tcb,twi,usart,wdt}.c \
    octbx/{avr_mcu,avr_cpu,avr_pin,cpuint,hooks,log,sched,twi_bus}.c \
    -lm -o "$work/nano-runner"

install -d "$out"
install -m 755 "$qemu_build/qemu-system-xtensa" "$out/qemu-system-xtensa"
install -m 755 "$work/nano-runner" "$out/nano-runner"
