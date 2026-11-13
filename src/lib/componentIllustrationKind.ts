export type ComponentIllustrationKind = 'led' | 'resistor' | 'pot' | 'button' | 'capacitor' | 'diode' | 'ldr' | 'ultrasonic' | 'motor' | 'display' | 'buzzer' | 'board' | 'module' | 'wire' | 'breadboard' | 'supply'

/** Ids where a name fragment would pick the wrong part: oLED, photoRESISTOR-module, MOTOR-driver. */
const exactKinds: Record<string, ComponentIllustrationKind> = {
  oled: 'display', lcd1602: 'display', 'photoresistor-module': 'module', 'motor-driver': 'module', tb6612: 'module', 'h-bridge': 'module', 'h-bridge-l298n': 'module',
  jumper: 'wire', 'usb-cable': 'wire', breadboard: 'breadboard', battery: 'supply', 'power-bank': 'supply', 'dc-supply': 'supply',
}

export function getComponentIllustrationKind(id: string): ComponentIllustrationKind {
  return exactKinds[id] ?? (/led|neopixel/.test(id) ? 'led' : /resistor/.test(id) ? 'resistor' : /potentiometer/.test(id) ? 'pot' : /button/.test(id) ? 'button' : /capacitor|electrolytic/.test(id) ? 'capacitor' : /diode/.test(id) ? 'diode' : /ldr/.test(id) ? 'ldr' : /ultrasonic|hc-sr04/.test(id) ? 'ultrasonic' : /motor|servo|pump/.test(id) ? 'motor' : /seven-segment/.test(id) ? 'display' : /buzzer/.test(id) ? 'buzzer' : /esp|arduino|stm|pico|rp2040|mcu/.test(id) ? 'board' : 'module')
}
