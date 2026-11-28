#include <stdbool.h>
#include <stdint.h>

#define REG8(addr) (*(volatile uint8_t *)(uintptr_t)(addr))
#define REG16(addr) (*(volatile uint16_t *)(uintptr_t)(addr))
#define REG32(addr) (*(volatile uint32_t *)(uintptr_t)(addr))
#define BIT(n) (1u << (n))

#define PRCR 0x4001e3feu
#define SCKDIVCR 0x4001e020u
#define MSTPCRB 0x40047000u
#define PWPR 0x40040d03u
#define PORT1_PFS 0x40040840u
#define PORT1_PCNTR3 0x40040028u
#define P302_PFS 0x400408c8u
#define SCI2 0x40070040u
#define PFS_PIDR BIT(1)
#define PFS_PDR BIT(2)
#define PFS_PMR BIT(16)

extern uint32_t __stack_top, __data_load, __data_start, __data_end, __bss_start, __bss_end;
volatile uint32_t a8_ticks_ms;
enum { poll_ms = 10, debounce_ms = 40 };

void SysTick_Handler(void)
{
    ++a8_ticks_ms;
}

static void uart_puts(const char *text)
{
    while (*text) {
        while (!(REG8(SCI2 + 4u) & BIT(7))) {}
        REG8(SCI2 + 3u) = (uint8_t)*text++;
    }
}

static bool button_pressed(void)
{
    return (REG32(PORT1_PFS + A8_INPUT * 4u) & PFS_PIDR) == 0;
}

static void set_led(bool high)
{
    REG32(PORT1_PCNTR3) = high ? BIT(A8_OUTPUT) : BIT(16 + A8_OUTPUT);
}

void Reset_Handler(void)
{
    uint32_t *source = &__data_load;
    for (volatile uint32_t *dest = &__data_start; dest < &__data_end; ++dest) {
        *dest = *source++;
    }
    for (volatile uint32_t *dest = &__bss_start; dest < &__bss_end; ++dest) {
        *dest = 0;
    }

    /* MOCO is selected at reset. Use its undivided 8 MHz for ICLK and PCLKB. */
    REG16(PRCR) = 0xa501u;
    REG32(SCKDIVCR) = 0;
    REG16(PRCR) = 0xa500u;
    REG32(MSTPCRB) &= ~BIT(29);
    (void)REG32(MSTPCRB);

    REG8(PWPR) = 0;
    REG8(PWPR) = BIT(6);
    REG32(PORT1_PFS + A8_INPUT * 4u) = 0;
    REG32(PORT1_PFS + A8_OUTPUT * 4u) = PFS_PDR;
    REG32(P302_PFS) = (4u << 24) | PFS_PMR;
    REG8(PWPR) = 0;
    REG8(PWPR) = BIT(7);

    REG8(SCI2 + 2u) = 0;
    REG8(SCI2) = 0;
    REG8(SCI2 + 7u) = 0;
    REG8(SCI2 + 1u) = 25;

    REG32(0xe000ed08u) = 0;
    REG32(0xe000e014u) = 7999u;
    REG32(0xe000e018u) = 0;
    REG32(0xe000e010u) = 7;
    while (!a8_ticks_ms) {
        __asm__ volatile ("wfi");
    }
    REG8(SCI2 + 2u) = BIT(5);
    uart_puts("A8_READY=" A8_SKU "\nA8_BUTTON=0\n");

    uint32_t last_poll = a8_ticks_ms;
    uint32_t changed_at = last_poll;
    bool candidate = false;
    bool settled = false;

    for (;;) {
        uint32_t now = a8_ticks_ms;
        if (now - last_poll < poll_ms) {
            __asm__ volatile ("wfi");
            continue;
        }
        last_poll = now;
        bool pressed = button_pressed();
        if (pressed != candidate) {
            candidate = pressed;
            changed_at = now;
        }
        if (settled != candidate && now - changed_at >= debounce_ms) {
            settled = candidate;
            set_led(settled);
            uart_puts(settled ? "A8_BUTTON=1\n" : "A8_BUTTON=0\n");
        }
    }
}

static void Default_Handler(void)
{
    for (;;) {
        __asm__ volatile ("wfi");
    }
}

__attribute__((used, section(".vectors")))
const uintptr_t vectors[16] = {
    (uintptr_t)&__stack_top, (uintptr_t)Reset_Handler,
    (uintptr_t)Default_Handler, (uintptr_t)Default_Handler,
    (uintptr_t)Default_Handler, (uintptr_t)Default_Handler,
    (uintptr_t)Default_Handler, 0, 0, 0, 0,
    (uintptr_t)Default_Handler, (uintptr_t)Default_Handler, 0,
    (uintptr_t)Default_Handler, (uintptr_t)SysTick_Handler
};
