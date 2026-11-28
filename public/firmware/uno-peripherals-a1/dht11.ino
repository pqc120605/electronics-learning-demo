#define MODE 11
#define DATA_PIN 2
#define INTERVAL_MS 2500
// Constants and the selected MODE are generated from MM-PINS-SIM-FW-A1.
#if MODE == 11 || MODE == 22
unsigned long pulseWidth(uint8_t state) {
  unsigned long started = micros();
  while (digitalRead(DATA_PIN) != state) {
    if (micros() - started > 150) return 0;
  }
  started = micros();
  while (digitalRead(DATA_PIN) == state) {
    if (micros() - started > 150) return 0;
  }
  return micros() - started;
}

bool receive(uint8_t payload[5]) {
  pinMode(DATA_PIN, OUTPUT);
  digitalWrite(DATA_PIN, LOW);
  delay(20);
  pinMode(DATA_PIN, INPUT);
  if (pulseWidth(LOW) < 50 || pulseWidth(HIGH) < 50) return false;
  for (uint8_t index = 0; index < 40; ++index) {
    if (pulseWidth(LOW) == 0) return false;
    unsigned long high = pulseWidth(HIGH);
    if (high == 0) return false;
    payload[index / 8] = (payload[index / 8] << 1) | (high >= 48);
  }
  return uint8_t(payload[0] + payload[1] + payload[2] + payload[3]) == payload[4];
}

void setup() { Serial.begin(9600); }
void loop() {
  uint8_t data[5] = {};
  Serial.print(MODE == 11 ? F("DHT11 ") : F("DHT22 "));
  if (!receive(data)) {
    Serial.println(F("TIMEOUT OR CHECKSUM"));
  } else {
    const int humidity = MODE == 11 ? data[0] * 10 : (uint16_t(data[0]) << 8) | data[1];
    const int magnitude = MODE == 11 ? data[2] * 10 : (uint16_t(data[2] & 0x7f) << 8) | data[3];
    const int temperature = MODE == 22 && (data[2] & 0x80) ? -magnitude : magnitude;
    Serial.print(temperature);
    Serial.print(F(" dC "));
    Serial.print(humidity);
    Serial.println(F(" dRH OK"));
  }
  delay(INTERVAL_MS);
}

#elif MODE == 40
const uint8_t rowPins[] = ROW_PINS;
const uint8_t colPins[] = COLUMN_PINS;
const char keyNames[] = "123A456B789C*0#D";
char previous = 0;
char candidate = 0;

char scanKeys() {
  for (uint8_t row = 0; row < 4; ++row) {
    digitalWrite(rowPins[row], LOW);
    pinMode(rowPins[row], OUTPUT);
    char key = 0;
    for (uint8_t col = 0; col < 4; ++col) {
      if (digitalRead(colPins[col]) == LOW) { key = keyNames[row * 4 + col]; break; }
    }
    pinMode(rowPins[row], INPUT);
    if (key) return key;
  }
  return 0;
}

void setup() {
  Serial.begin(9600);
  for (uint8_t column : colPins) pinMode(column, INPUT_PULLUP);
  Serial.println(F("KEY IDLE"));
}
void loop() {
  const char key = scanKeys();
  if (key == candidate && key != previous) {
    previous = key;
    Serial.print(F("KEY "));
    if (key) Serial.println(key);
    else Serial.println(F("IDLE"));
  }
  candidate = key;
  delay(10);
}

#elif MODE == 70
const uint8_t segmentPins[] = SEGMENT_PINS;
// Least significant bit = segment a. The top bit is the decimal point.
const uint8_t masks[] = {0x3f,0x06,0x5b,0x4f,0x66,0x6d,0x7d,0x07,0x7f,0xef};
uint8_t digit = 0;

void setup() {
  Serial.begin(9600);
  for (uint8_t segment : segmentPins) {
    digitalWrite(segment, HIGH);
    pinMode(segment, OUTPUT);
  }
}
void loop() {
  for (uint8_t i = 0; i < 8; ++i) {
    digitalWrite(segmentPins[i], (masks[digit] & (1 << i)) ? LOW : HIGH);
  }
  Serial.print(F("DIGIT "));
  Serial.println(digit);
  delay(120);
  digit = (digit + 1) % 10;
}
#endif
