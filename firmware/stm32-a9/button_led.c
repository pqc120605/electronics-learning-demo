#include <stdbool.h>
#include <stdint.h>

#define REG32(addr) (*(volatile uint32_t *)(uintptr_t)(addr))
#define BIT(n) (1u << (n))

#if defined(A9_F103)
#define GPIOA 0x40010800u
#define GPIOB 0x40010C00u
#define GPIO_IDR 0x08u
#define GPIO_ODR 0x0Cu
#define UART 0x40013800u
#define UART_STATUS 0x00u
#define UART_TX 0x04u
#elif defined(A9_L476)
#define GPIOA 0x48000000u
#define GPIOB 0x48000400u
#define GPIO_IDR 0x10u
#define GPIO_ODR 0x14u
#define UART 0x40004400u
#define UART_STATUS 0x1Cu
#define UART_TX 0x28u
#else
#error Select the approved A9 target
#endif

extern uint32_t __stack_top, __data_load, __data_start, __data_end, __bss_start, __bss_end;
enum { input_pin = 10, led_pin = 5, poll_ms = 10, debounce_ms = 40 };
volatile uint32_t a9_ticks_ms;

void SysTick_Handler(void)
{
    ++a9_ticks_ms;
}

static void set_led(bool high)
{
    const uint32_t odr = REG32(GPIOB + GPIO_ODR);
    REG32(GPIOB + GPIO_ODR) = (odr & ~BIT(led_pin)) | (high ? BIT(led_pin) : 0u);
}

static void setup_pins_and_uart(void)
{
#if defined(A9_F103)
    REG32(0x40021018u) |= BIT(2) | BIT(3) | BIT(14);
    (void)REG32(0x40021018u);

    // CRH nibbles for PA10 floating input and PA9 2 MHz AF push-pull.
    REG32(GPIOA + 4u) = (REG32(GPIOA + 4u) & ~0xFF0u) | 0x4A0u;
    set_led(false);
    REG32(GPIOB) = (REG32(GPIOB) & ~(15u << 20)) | (2u << 20);
    REG32(UART + 8u) = A9_BRR;
    REG32(UART + 0x0Cu) = BIT(13) | BIT(3);
#else
    REG32(0x4002104Cu) |= BIT(0) | BIT(1);
    REG32(0x40021058u) |= BIT(17);
    (void)REG32(0x40021058u);

    REG32(GPIOA) &= ~(3u << (input_pin * 2));
    REG32(GPIOA + 0x0Cu) &= ~(3u << (input_pin * 2));
    REG32(GPIOB + 4u) &= ~BIT(led_pin);
    REG32(GPIOB + 0x0Cu) &= ~(3u << (led_pin * 2));
    set_led(false);
    REG32(GPIOB) = (REG32(GPIOB) & ~(3u << (led_pin * 2))) | BIT(led_pin * 2);

    const unsigned tx_pin = 2;
    REG32(GPIOA + 4u) &= ~BIT(tx_pin);
    REG32(GPIOA + 0x20u) = (REG32(GPIOA + 0x20u) & ~(15u << (tx_pin * 4))) | (7u << (tx_pin * 4));
    REG32(GPIOA) = (REG32(GPIOA) & ~(3u << (tx_pin * 2))) | (2u << (tx_pin * 2));
    REG32(UART + 0x0Cu) = A9_BRR;
    REG32(UART) = BIT(0) | BIT(3);
#endif
}

static void uart_puts(const char *text)
{
    while (*text) {
        while (!(REG32(UART + UART_STATUS) & BIT(7))) {}
        REG32(UART + UART_TX) = (uint8_t)*text++;
    }
}

void Reset_Handler(void)
{
    const uint32_t *source = &__data_load;
    for (volatile uint32_t *dest = &__data_start; dest < &__data_end; ++dest) {
        *dest = *source++;
    }
    for (volatile uint32_t *dest = &__bss_start; dest < &__bss_end; ++dest) {
        *dest = 0;
    }

    setup_pins_and_uart();
    REG32(0xE000ED08u) = 0x08000000u;
    REG32(0xE000E014u) = A9_SYSTICK_RELOAD;
    REG32(0xE000E018u) = 0;
    REG32(0xE000E010u) = 7u;
    uart_puts("A9_READY=" A9_TARGET "\nA9_BUTTON=0\n");

    uint32_t last_poll = a9_ticks_ms;
    uint32_t changed_at = last_poll;
    bool candidate = false;
    bool settled = false;

    for (;;) {
        const uint32_t now = a9_ticks_ms;
        if ((uint32_t)(now - last_poll) < poll_ms) {
            __asm__ volatile ("wfi");
            continue;
        }

        last_poll = now;
        const bool pressed = (REG32(GPIOA + GPIO_IDR) & BIT(input_pin)) == 0;
        if (pressed != candidate) {
            candidate = pressed;
            changed_at = now;
        }
        if (settled != candidate && (uint32_t)(now - changed_at) >= debounce_ms) {
            settled = candidate;
            set_led(settled);
            uart_puts(settled ? "A9_BUTTON=1\n" : "A9_BUTTON=0\n");
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
    (uintptr_t)&__stack_top,
    (uintptr_t)Reset_Handler,
    (uintptr_t)Default_Handler,
    (uintptr_t)Default_Handler,
    (uintptr_t)Default_Handler,
    (uintptr_t)Default_Handler,
    (uintptr_t)Default_Handler,
    0, 0, 0, 0,
    (uintptr_t)Default_Handler,
    (uintptr_t)Default_Handler,
    0,
    (uintptr_t)Default_Handler,
    (uintptr_t)SysTick_Handler
};
