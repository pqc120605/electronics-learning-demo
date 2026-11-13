; Bare-metal AVR program for ATmega328P / Arduino Uno R3.
; Configures PB5 (Uno D13), then blinks it using bounded software delay loops.
; This is assembly firmware, not an Arduino sketch and has no Arduino core.

reset:
  SBI 0x04, 5

blink:
  SBI 0x05, 5
  LDI R18, 15
on_outer:
  LDI R24, 0xFF
  LDI R25, 0xFF
on_inner:
  SBIW R24, 1
  BRNE on_inner
  DEC R18
  BRNE on_outer

  CBI 0x05, 5
  LDI R18, 15
off_outer:
  LDI R24, 0xFF
  LDI R25, 0xFF
off_inner:
  SBIW R24, 1
  BRNE off_inner
  DEC R18
  BRNE off_outer
  RJMP blink
