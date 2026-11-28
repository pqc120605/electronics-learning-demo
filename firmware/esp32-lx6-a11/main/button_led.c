#include <stdbool.h>
#include <stdio.h>
#include "driver/gpio.h"
#include "esp_check.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "sdkconfig.h"

#if !CONFIG_IDF_TARGET_ESP32 || !CONFIG_FREERTOS_UNICORE || !CONFIG_ESPTOOLPY_FLASHSIZE_4MB
#error "A11 requires ESP32 LX6, single-core firmware and a 4 MiB flash image"
#endif

static const gpio_num_t button_pin = GPIO_NUM_25;
static const gpio_num_t led_pin = GPIO_NUM_26;

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
    ESP_ERROR_CHECK(gpio_set_level(led_pin, 0));
    ESP_ERROR_CHECK(gpio_set_direction(led_pin, GPIO_MODE_OUTPUT));
    puts("A11_SOURCE_SHA256=" A11_SOURCE_SHA256);
    puts("A11_READY=esp32:4");

    const TickType_t interval = pdMS_TO_TICKS(10);
    const TickType_t debounce = pdMS_TO_TICKS(40);
    TickType_t next_poll = xTaskGetTickCount();
    TickType_t changed_at = next_poll;
    bool stable = false;
    bool candidate = gpio_get_level(button_pin) == 0;
    while (true) {
        const bool pressed = gpio_get_level(button_pin) == 0;
        const TickType_t now = xTaskGetTickCount();
        if (pressed != candidate) {
            candidate = pressed;
            changed_at = now;
        }
        if (candidate != stable && now - changed_at >= debounce) {
            stable = candidate;
            ESP_ERROR_CHECK(gpio_set_level(led_pin, stable));
            printf("A11_LED=%d\n", stable);
        }
        vTaskDelayUntil(&next_poll, interval);
    }
}
