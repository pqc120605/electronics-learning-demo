#include <Arduino.h>

#if !defined(__AVR_ATmega4809__) || !defined(ARDUINO_AVR_NANO_EVERY) || F_CPU != 16000000UL || defined(AVR_NANO_4809_328MODE)
#error "A12 requires Nano Every ATmega4809 at 16 MHz without legacy register emulation"
#endif

constexpr uint8_t buttonPin = 2;
constexpr uint8_t ledPin = 8;
constexpr uint32_t sampleMs = 10;
constexpr uint32_t debounceMs = 40;

static uint32_t lastSampleMs;
static uint32_t changedMs;
static bool stable;
static bool candidate;

void setup() {
    pinMode(buttonPin, INPUT);
    digitalWrite(ledPin, LOW);
    pinMode(ledPin, OUTPUT);
    Serial1.begin(9600);
    Serial1.println(F("A12_READY=atmega4809"));
    lastSampleMs = millis();
    changedMs = lastSampleMs;
    candidate = digitalRead(buttonPin) == LOW;
}

void loop() {
    const uint32_t now = millis();
    if (now - lastSampleMs < sampleMs) return;
    lastSampleMs = now;
    const bool pressed = digitalRead(buttonPin) == LOW;
    if (pressed != candidate) {
        candidate = pressed;
        changedMs = now;
    }
    if (candidate != stable && now - changedMs >= debounceMs) {
        stable = candidate;
        digitalWrite(ledPin, stable ? HIGH : LOW);
        Serial1.println(stable ? F("A12_LED=1") : F("A12_LED=0"));
    }
}
