// Mạch Mở sample: blink the built-in LED on Arduino Uno R3.
// Select Arduino Uno (ATmega328P) in Arduino IDE before compiling.

void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {
  digitalWrite(LED_BUILTIN, HIGH);
  delay(500);
  digitalWrite(LED_BUILTIN, LOW);
  delay(500);
}
