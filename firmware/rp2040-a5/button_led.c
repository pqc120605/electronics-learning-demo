#include <stdbool.h>
#include <stdint.h>
#include "hardware/clocks.h"
#include "hardware/gpio.h"
#include "hardware/uart.h"
#include "pico/time.h"

enum {
    button_pin = 14,
    led_pin = 15,
    uart_tx_pin = 0,
    poll_us = 10000,
    debounce_us = 40000,
};

int main(void)
{
    set_sys_clock_khz(125000, true);

    gpio_init(button_pin);
    gpio_set_dir(button_pin, GPIO_IN);
    gpio_disable_pulls(button_pin);
    gpio_init(led_pin);
    gpio_put(led_pin, false);
    gpio_set_dir(led_pin, GPIO_OUT);

    uart_init(uart0, 115200);
    gpio_set_function(uart_tx_pin, GPIO_FUNC_UART);
    uart_puts(uart0, "A5_READY=" A5_BOARD "\n");

    uint64_t next_poll = time_us_64();
    uint64_t changed_at = next_poll;
    bool candidate = !gpio_get(button_pin);
    int settled = -1;
    for (;;) {
        const bool pressed = !gpio_get(button_pin);
        const uint64_t now = time_us_64();
        if (pressed != candidate) {
            candidate = pressed;
            changed_at = now;
        }
        if (settled != (int)candidate && now - changed_at >= debounce_us) {
            settled = candidate;
            gpio_put(led_pin, candidate);
            uart_puts(uart0, candidate ? "A5_BUTTON=1\n" : "A5_BUTTON=0\n");
        }
        next_poll += poll_us;
        sleep_until(from_us_since_boot(next_poll));
    }
}
