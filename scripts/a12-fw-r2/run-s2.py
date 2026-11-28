"""Drive the two lesson pins on the locked Xtensa machine via a private QMP pipe."""

import json
import pathlib
import selectors
import subprocess
import sys
import tempfile
import time


class Machine:
    def __init__(self, executable, rom_dir, elf, trace=None):
        self.directory = tempfile.TemporaryDirectory(prefix="a12-s2-")
        self.uart = pathlib.Path(self.directory.name) / "uart"
        args = [
            executable, "-M", "esp32S2", "-S", "-display", "none", "-monitor", "none",
            "-qmp", "stdio", "-serial", f"file:{self.uart}", "-nic", "none",
            "-L", rom_dir, "-device", f"loader,file={elf},cpu-num=0",
            "-icount", "shift=3,align=off,sleep=off",
        ]
        if trace:
            args += ["-d", "in_asm", "-D", trace]
        self.process = subprocess.Popen(args, stdin=subprocess.PIPE, stdout=subprocess.PIPE, bufsize=0)
        self.select = selectors.DefaultSelector()
        self.select.register(self.process.stdout, selectors.EVENT_READ)
        self.pending = bytearray()
        self.sequence = 0
        self.events = []
        self.uart_offset = 0

    def receive(self, deadline):
        while b"\n" not in self.pending:
            if not self.select.select(max(0, deadline - time.monotonic())):
                raise RuntimeError("QMP session timed out")
            chunk = self.process.stdout.read(32768)
            if not chunk:
                raise RuntimeError("QEMU session exited")
            self.pending.extend(chunk)
        line, tail = self.pending.split(b"\n", 1)
        self.pending = tail
        if not line.startswith(b"{"):
            return {}
        return json.loads(line)

    def request(self, name, **arguments):
        self.sequence += 1
        self.process.stdin.write((json.dumps({
            "execute": name, "arguments": arguments, "id": self.sequence,
        }) + "\n").encode())
        deadline = time.monotonic() + 8
        while True:
            message = self.receive(deadline)
            if "event" in message:
                self.events.append(message["event"])
            if message.get("id") == self.sequence:
                if "error" in message:
                    raise RuntimeError(message["error"]["desc"])
                return message["return"]

    def start(self):
        if "QMP" not in self.receive(time.monotonic() + 8):
            raise RuntimeError("Invalid QMP greeting")
        self.request("qmp_capabilities")
        self.gpio = self.find_gpio("/machine", 3)
        # Direct SRAM loading skips the ROM clock setup used on the physical board.
        parent = self.gpio.rsplit("/", 1)[0]
        self.timer = parent + "/timg0"
        self.uart_device = parent + "/uart0"
        self.request("qom-set", path=self.timer, property="apb_freq", value=80000000)

    def find_gpio(self, path, depth):
        for item in self.request("qom-list", path=path):
            if item["type"] == "child<esp32s2.gpio>":
                return path + "/" + item["name"]
            if depth > 0 and item["type"].startswith("child<"):
                candidate = self.find_gpio(path + "/" + item["name"], depth - 1)
                if candidate:
                    return candidate
        if path == "/machine":
            raise RuntimeError("ESP32-S2 GPIO object unavailable")
        return None

    def get(self, name):
        return self.request("qom-get", path=self.gpio, property="a12-" + name)

    def set(self, name, value):
        self.request("qom-set", path=self.gpio, property="a12-" + name, value=value)

    def step(self, pressed, duration_ms):
        start_us = self.get("clock-us")
        self.set("stimulus-high", not pressed)
        self.set("window-us", duration_ms * 1000)
        self.events.clear()
        self.request("cont")
        deadline = time.monotonic() + 8
        while "STOP" not in self.events:
            message = self.receive(deadline)
            if "event" in message:
                self.events.append(message["event"])
        if not self.get("output-driven"):
            raise RuntimeError("Firmware did not configure GPIO5 as an output")
        with self.uart.open("rb") as stream:
            stream.seek(self.uart_offset)
            serial = stream.read().decode("ascii")
            self.uart_offset = stream.tell()
        return {
            "target": "esp32s2", "timeUs": self.get("clock-us"), "startUs": start_us,
            "inputHigh": self.get("input-high"), "outputHigh": self.get("output-high"),
            "edgeUs": self.get("edge-us"), "edges": self.get("edges"), "serial": serial,
            "ticks": self.request("qom-get", path=self.timer, property="a12-t0-count"),
            "uartUs": self.request("qom-get", path=self.uart_device, property="a12-tx-us"),
        }

    def close(self):
        if self.process.poll() is None:
            self.process.terminate()
            try:
                self.process.wait(timeout=2)
            except subprocess.TimeoutExpired:
                self.process.kill()
                self.process.wait()
        self.select.close()
        self.directory.cleanup()


def main():
    machine = Machine(*sys.argv[1:])
    try:
        machine.start()
        print(json.dumps(machine.step(False, 90)), flush=True)
        for line in sys.stdin:
            pressed, window = map(int, line.split())
            if pressed not in (0, 1) or not 1 <= window <= 100:
                raise ValueError("Invalid A12 input")
            print(json.dumps(machine.step(bool(pressed), window)), flush=True)
    finally:
        machine.close()


if __name__ == "__main__":
    main()
