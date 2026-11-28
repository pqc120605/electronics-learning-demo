#include <stdbool.h>
#include <stdint.h>
#include "soc/soc.h"
#include "soc/gpio_reg.h"
#include "soc/gpio_sig_map.h"
#include "soc/io_mux_reg.h"
#include "soc/timer_group_reg.h"
#include "soc/uart_reg.h"

#if !defined(__XTENSA__) || !defined(CONFIG_IDF_TARGET_ESP32S2)
#error "A12 requires the ESP32-S2 Xtensa toolchain and registers"
#endif

enum { input_mask = 1 << 4, output_mask = 1 << 5, interval_us = 10000, debounce_us = 40000 };

static void uart_line(const char *text)
{
    while (*text) {
        while (((REG_READ(UART_STATUS_REG(0)) & UART_TXFIFO_CNT_M) >> UART_TXFIFO_CNT_S) >= 64) {}
        REG_WRITE(UART_FIFO_REG(0), (uint8_t)*text++);
    }
    REG_WRITE(UART_FIFO_REG(0), '\n');
}

static uint32_t timer_us(void)
{
    REG_WRITE(TIMG_T0UPDATE_REG(0), TIMG_T0_UPDATE);
    return REG_READ(TIMG_T0LO_REG(0));
}

void a12_main(void)
{
    REG_WRITE(IO_MUX_GPIO4_REG, (PIN_FUNC_GPIO << MCU_SEL_S) | FUN_IE);
    REG_WRITE(IO_MUX_GPIO5_REG, PIN_FUNC_GPIO << MCU_SEL_S);
    REG_WRITE(GPIO_FUNC5_OUT_SEL_CFG_REG, SIG_GPIO_OUT_IDX);
    REG_WRITE(GPIO_ENABLE_W1TC_REG, input_mask);
    REG_WRITE(GPIO_OUT_W1TC_REG, output_mask);
    REG_WRITE(GPIO_ENABLE_W1TS_REG, output_mask);
    REG_WRITE(PERIPHS_IO_MUX_U0TXD_U, FUNC_U0TXD_U0TXD << MCU_SEL_S);
    REG_WRITE(UART_CLKDIV_REG(0), 694 | (7 << UART_CLKDIV_FRAG_S));
    REG_WRITE(UART_CONF0_REG(0), (3 << UART_BIT_NUM_S) | (1 << UART_STOP_BIT_NUM_S));

    REG_WRITE(TIMG_T0CONFIG_REG(0), TIMG_T0_EN | TIMG_T0_INCREASE | (80 << TIMG_T0_DIVIDER_S));
    uart_line("A12_READY=esp32s2");
    uint32_t last = timer_us();
    uint32_t changed = last;
    bool stable = false;
    bool candidate = (REG_READ(GPIO_IN_REG) & input_mask) == 0;
    for (;;) {
        const uint32_t now = timer_us();
        if (now - last < interval_us) continue;
        last = now;
        const bool pressed = (REG_READ(GPIO_IN_REG) & input_mask) == 0;
        if (pressed != candidate) {
            candidate = pressed;
            changed = now;
        }
        if (candidate != stable && now - changed >= debounce_us) {
            stable = candidate;
            REG_WRITE(stable ? GPIO_OUT_W1TS_REG : GPIO_OUT_W1TC_REG, output_mask);
            uart_line(stable ? "A12_LED=1" : "A12_LED=0");
        }
    }
}
