static bool stablePressed;
static bool candidatePressed;
static unsigned long candidateSince;
static unsigned long lastSample;

void setup() {
  pinMode(A10_INPUT, INPUT);
  digitalWrite(A10_LED, LOW);
  pinMode(A10_LED, OUTPUT);
  Serial.begin(A10_BAUD);
  Serial.println(F("A10_READY " A10_TARGET));
  lastSample = candidateSince = millis();
}

void loop() {
  const unsigned long now = millis();
  if (now - lastSample < A10_SAMPLE_MS) return;
  lastSample = now;

  const bool pressed = digitalRead(A10_INPUT) == LOW;
  if (pressed != candidatePressed) {
    candidatePressed = pressed;
    candidateSince = now;
  }
  if (stablePressed == candidatePressed || now - candidateSince < A10_DEBOUNCE_MS) return;

  stablePressed = candidatePressed;
  digitalWrite(A10_LED, stablePressed ? HIGH : LOW);
  Serial.println(stablePressed ? F("A10_LED 1") : F("A10_LED 0"));
}
