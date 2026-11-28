#include <inttypes.h>
#include <stdbool.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "octsx.h"
#include "octbx.h"
#include "avr0per.h"
#include "avr0dev/mega4809.h"

enum {
    CLOCK_HZ = 16000000,
    VPORT_LAST = 0x17, PORTMUX = 0x05e0, USART_ROUTE = 0x05e2,
    USART1 = 0x0820, UART_STATUS = 4, UART_CTRLA = 5, UART_CTRLB = 6,
    UART_CTRLC = 7, UART_BAUDL = 8, UART_BAUDH = 9, UART_TXDATA = 2,
    DRE = 0x20, TXC = 0x40, TXEN = 0x40, DRE_VECTOR = 27, TIMER_VECTOR = 36,
};

static mega4809_t board;
static sys_t *system_clock;
static uint64_t edge_us, uart_us;
static unsigned edges, timer_acks;
static char uart[4096];
static size_t uart_length;
static bool tx_busy, tx_held;
static uint8_t shift_byte, held_byte;

static void fail(const char *message)
{
    fprintf(stderr, "%s at PC 0x%06x\n", message, 2 * cpu_get_pc(&board.base.cpu));
    exit(1);
}

static uint64_t now_us(void)
{
    return (uint64_t)system_clock->clk.time.sec * 1000000
        + system_clock->clk.time.nsec / 1000;
}

static uint8_t *uart_regs(void)
{
    return &board.data[USART1];
}

static void update_dre(void)
{
    uint8_t *reg = uart_regs();
    bool pending = (reg[UART_CTRLA] & DRE) && (reg[UART_STATUS] & DRE)
        && (reg[UART_CTRLB] & TXEN);
    mcu_ir(&board.base, pending ? DRE_VECTOR : -DRE_VECTOR);
}

static void start_byte(tkclk_t *clock);

static void finish_byte(void *unused, tkclk_t *clock)
{
    uint8_t *reg = uart_regs();
    if (uart_length == sizeof uart || !(reg[UART_CTRLB] & TXEN)) {
        fail("USART1 TX state invalid");
    }
    uart[uart_length++] = shift_byte;
    uart_us = now_us();
    tx_busy = false;
    if (tx_held) {
        start_byte(clock);
    } else {
        reg[UART_STATUS] |= TXC;
    }
}

static void start_byte(tkclk_t *clock)
{
    uint8_t *reg = uart_regs();
    const unsigned baud_setting = (reg[UART_BAUDH] << 8) | reg[UART_BAUDL];
    const unsigned cycles = (10 * baud_setting + 3) / 4;
    if ((board.data[USART_ROUTE] & 0x0c) != 0x04 || reg[UART_CTRLC] != 0x03
        || (reg[UART_CTRLB] & 0x06) != 0 || baud_setting < 6665 || baud_setting > 6668) {
        fail("USART1 route or 9600 8N1 configuration invalid");
    }
    tx_busy = true;
    tx_held = false;
    shift_byte = held_byte;
    reg[UART_STATUS] |= DRE;
    tkclk_sched(clock, cycles, NEPS_TICKPOST, finish_byte, NULL);
    update_dre();
}

static void write_usart(int offset, uint8_t value)
{
    uint8_t *reg = uart_regs();
    if (offset == UART_TXDATA) {
        if (tx_held || !(reg[UART_CTRLB] & TXEN)) {
            fail("USART1 write while TX buffer unavailable");
        }
        reg[offset] = held_byte = value;
        tx_held = true;
        reg[UART_STATUS] &= ~(DRE | TXC);
        if (!tx_busy) {
            start_byte(&board.base.clk_per);
        }
    } else if (offset == UART_STATUS) {
        reg[UART_STATUS] &= ~(value & TXC);
    } else {
        reg[offset] = value;
    }
    update_dre();
}

static bool led(void)
{
    return board.portE.pin[3].dir == PIN_DIR_OUT && board.portE.pin[3].wrlev;
}

static port_t *vport(int addr)
{
    port_t *ports[] = { &board.portA, &board.portB, &board.portC, &board.portD, &board.portE, &board.portF };
    return ports[addr / 4];
}

static uint8_t read_register(void *device, int addr)
{
    static const int offset[] = { 0, 4, 8, 9 };
    if (addr <= VPORT_LAST) {
        port_t *port = vport(addr);
        return port_rd(port, port->base_addr + offset[addr % 4]);
    }
    if (addr >= 0x4000) {
        // AVRxt maps the 48 KiB program flash into data space at 0x4000.
        const unsigned ix = (unsigned)addr - 0x4000;
        if (ix >= sizeof board.prog) fail("Address outside ATmega4809 flash");
        return (board.prog[ix / 2] >> ((ix % 2) * 8)) & 0xff;
    }
    if (addr >= USART1 && addr < USART1 + 16) {
        return board.data[addr];
    }
    return mega4809_rd(device, addr);
}

static void write_register(void *device, int addr, uint8_t value)
{
    static const int offset[] = { 0, 4, 7, 9 };
    const bool previous = led();
    if (addr <= VPORT_LAST) {
        port_t *port = vport(addr);
        port_wr(port, port->base_addr + offset[addr % 4], value);
    } else if (addr == 0x0a00 && board.data[0x0a01] == 0x03 && !board.data[0x0a0a]) {
        // The core configures TCA single-slope mode with no compare outputs or interrupts.
        // TCB uses its prescaler. No TCA PWM waveform belongs to this fixture.
        board.data[addr] = value;
    } else if (addr >= 0x00a0 && addr <= 0x00a1) {
        // Arduino init configures the ADC reference. The fixture uses digital I/O.
        board.data[addr] = value;
    } else if (addr >= PORTMUX && addr < PORTMUX + 8) {
        board.data[addr] = value;
    } else if (addr >= USART1 && addr < USART1 + 16) {
        write_usart(addr - USART1, value);
    } else {
        mega4809_wr(device, addr, value);
    }
    if (led() != previous) {
        edges++;
        edge_us = now_us();
    }
}

static void write_bits(void *device, int addr, uint8_t value, uint8_t mask)
{
    const uint8_t current = read_register(device, addr);
    write_register(device, addr, (current & ~mask) | (value & mask));
}

static void acknowledge(void *device, int vector)
{
    if (vector == TIMER_VECTOR) timer_acks++;
    mega4809_ia(device, vector);
}

static void emit_uart(void)
{
    for (size_t i = 0; i < uart_length; i++) {
        const unsigned char byte = uart[i];
        if (byte < 32 || byte >= 127 || byte == '"' || byte == '\\') {
            printf("\\u%04x", byte);
        } else {
            putchar(byte);
        }
    }
    uart_length = 0;
}

static void step(bool pressed, unsigned duration_ms)
{
    const uint64_t start_us = now_us();
    iopin_notify_per(&board.portA.pin[0], PIN_BOP_LVL, !pressed);
    sys_run_to(system_clock, tm_add_ns(system_clock->clk.time, duration_ms * 1000000L));
    if (board.portE.pin[3].dir != PIN_DIR_OUT || board.portA.pin[0].dir != PIN_DIR_IN
        || board.base.cpu.clk_cpu.div != 1 || board.base.clk_per.div != 1) {
        fail("Firmware did not configure PA0, PE3 and the 16 MHz clock");
    }
    printf("{\"target\":\"atmega4809\",\"timeUs\":%" PRIu64 ",\"startUs\":%" PRIu64
           ",\"inputHigh\":%s,\"outputHigh\":%s,\"edgeUs\":%" PRIu64
           ",\"edges\":%u,\"timerAcks\":%u,\"uartUs\":%" PRIu64 ",\"pc\":%u,\"serial\":\"",
           now_us(), start_us, (board.portA.reg->IN & 1) ? "true" : "false",
           led() ? "true" : "false", edge_us, edges, timer_acks, uart_us,
           2 * cpu_get_pc(&board.base.cpu));
    emit_uart();
    puts("\"}");
    fflush(stdout);
}

int main(int argc, char *argv[])
{
    if (argc != 2) {
        fputs("Usage: nano-runner <locked flash.hex>\n", stderr);
        return 1;
    }
    system_clock = make_sys(0, NULL);
    mega4809_init(&board, &system_clock->clk);
    mcu_t *mcu = &board.base;
    mcu->osc20m.tick_per = 1.0 / CLOCK_HZ;
    mcu->osc20m.allan_dev = 0.0;
    mcu->osc20m.drift_dev = 0.0;
    mcu->rd = read_register;
    mcu->wr = write_register;
    mcu->bs = write_bits;
    mcu->ia = acknowledge;
    memset(board.prog, 0xff, sizeof board.prog);
    if (cpu_load_program(&mcu->cpu, argv[1]) != 0) fail("Failed to load AVR program");
    mcu_reset(mcu, 0);
    uart_regs()[UART_STATUS] = DRE;
    if (cpu_get_pc(&mcu->cpu) != 0) fail("Wrong Nano Every reset vector");
    fprintf(stderr, "ATmega4809 AVRxt reset PC 0x0000, opcode 0x%04x\n", board.prog[0]);
    step(false, 90);
    char line[32];
    while (fgets(line, sizeof line, stdin)) {
        unsigned pressed, duration;
        char extra;
        if (sscanf(line, "%u %u %c", &pressed, &duration, &extra) != 2
            || pressed > 1 || duration < 1 || duration > 100) {
            fail("Invalid Nano Every step");
        }
        step(pressed != 0, duration);
    }
    return 0;
}
