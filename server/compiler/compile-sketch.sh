#!/bin/sh
set -eu

case "${1:-}" in
    arduino:avr:uno|arduino:avr:nano:cpu=atmega328|arduino:avr:mega:cpu=atmega2560) ;;
    *) exit 64 ;;
esac

mkdir -p /work/sketch /work/build /work/out
cat > /work/sketch/sketch.ino
if arduino-cli compile --fqbn "$1" --no-color --build-path /work/build --output-dir /work/out /work/sketch > /work/compile.log 2>&1; then
    cat /work/out/sketch.ino.hex
else
    head -c 12000 /work/compile.log >&2
    exit 2
fi
