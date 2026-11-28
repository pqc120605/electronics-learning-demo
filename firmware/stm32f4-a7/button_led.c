
#include <stdbool.h>
#include <stdint.h>

#define REG32(addr) (*(volatile uint32_t *)(uintptr_t)(addr))
#define GPIOA 0x40020000u
#define GPIOB 0x40020400u
#define USART2 0x40004400u
#define RCC 0x40023800u
#define BIT(n) (1u << (n))

extern uint32_t __stack_top, __data_load, __data_start, __data_end, __bss_start, __bss_end;

enum { input_pin = 10, led_pin = 5, tx_pin = 2, poll_ms = 10, debounce_ms = 40 };
volatile uint32_t a7_ticks_ms;

void SysTick_Handler(void)
{
    ++a7_ticks_ms;
}

static void uart_puts(const char *str)
{
    while (*str) {
        while (!(REG32(USART2) & BIT(7))) {}
        REG32(USART2 + 4u) = (uint8_t)*str++;
    }
}

static bool button_pressed(void)
{
    return (REG32(GPIOA + 0x10u) & BIT(input_pin)) == 0;
}

static void set_led(bool high)
{
    REG32(GPIOB + 0x18u) = BIT(high ? led_pin : 16 + led_pin);
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

    REG32(RCC + 0x30u) |= BIT(0) | BIT(1);
    REG32(RCC + 0x40u) |= BIT(17);
    (void)REG32(RCC + 0x40u);

    REG32(GPIOA) &= ~(3u << (input_pin * 2));
    REG32(GPIOA + 0x0Cu) &= ~(3u << (input_pin * 2));
    REG32(GPIOB + 4u) &= ~BIT(led_pin);
    set_led(false);
    REG32(GPIOB) = (REG32(GPIOB) & ~(3u << (led_pin * 2))) | BIT(led_pin * 2);

    REG32(GPIOA + 0x20u) = (REG32(GPIOA + 0x20u) & ~(15u << (tx_pin * 4))) | (7u << (tx_pin * 4));
    REG32(GPIOA) = (REG32(GPIOA) & ~(3u << (tx_pin * 2))) | (2u << (tx_pin * 2));
    REG32(USART2 + 8u) = 0x008Bu;
    REG32(USART2 + 0x0Cu) = BIT(13) | BIT(3);

    REG32(0xE000ED08u) = 0x08000000u;
    REG32(0xE000E014u) = 15999u;
    REG32(0xE000E018u) = 0;
    REG32(0xE000E010u) = 7u;
    uart_puts("A7_READY=" A7_TARGET "\nA7_BUTTON=0\n");

    uint32_t last_poll = a7_ticks_ms;
    uint32_t changed_at = last_poll;
    bool candidate = false;
    bool settled = false;

    for (;;) {
        const uint32_t now = a7_ticks_ms;
        if ((uint32_t)(now - last_poll) < poll_ms) {
            __asm__ volatile ("wfi");
            continue;
        }

        last_poll = now;
        const bool pressed = button_pressed();
        if (pressed != candidate) {
            candidate = pressed;
            changed_at = now;
        }
        if (settled != candidate && (uint32_t)(now - changed_at) >= debounce_ms) {
            settled = candidate;
            set_led(settled);
            uart_puts(settled ? "A7_BUTTON=1\n" : "A7_BUTTON=0\n");
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
