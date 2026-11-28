#include <stdbool.h>
#include <stdio.h>
#include "driver/gpio.h"
#include "esp_check.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

static const gpio_num_t button_pin = GPIO_NUM_4;
static const gpio_num_t led_pin = GPIO_NUM_10;

void app_main(void)
{
    const gpio_config_t button = {
        .pin_bit_mask = 1ULL << button_pin,
        .mode = GPIO_MODE_INPUT,
        .pull_up_en = GPIO_PULLUP_DISABLE,
        .pull_down_en = GPIO_PULLDOWN_DISABLE,
        .intr_type = GPIO_INTR_DISABLE,
    };
    ESP_ERROR_CHECK(gpio_config(&button));
    ESP_ERROR_CHECK(gpio_set_direction(led_pin, GPIO_MODE_OUTPUT));
    ESP_ERROR_CHECK(gpio_set_level(led_pin, 0));
    puts("A2_READY");

    const TickType_t interval = pdMS_TO_TICKS(10);
    const TickType_t debounce = pdMS_TO_TICKS(40);
    TickType_t next_poll = xTaskGetTickCount();
    TickType_t changed_at = next_poll;
    bool candidate = gpio_get_level(button_pin) == 0;
    int settled = -1;
    while (true) {
        const bool pressed = gpio_get_level(button_pin) == 0;
        const TickType_t now = xTaskGetTickCount();
        if (pressed != candidate) {
            candidate = pressed;
            changed_at = now;
        }
        if ((int)candidate != settled && now - changed_at >= debounce) {
            settled = candidate;
            ESP_ERROR_CHECK(gpio_set_level(led_pin, settled));
            printf("A2_BUTTON=%d\n", settled);
        }
        vTaskDelayUntil(&next_poll, interval);
    }
}
