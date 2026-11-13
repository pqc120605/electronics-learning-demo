const arduinoMcuRefs: Record<string, string> = {
  'arduino-uno-r3': 'ZU4',
  'arduino-nano-classic': 'IC3',
  'arduino-mega-2560-r3': 'IC3',
}

export function getDefaultBoardFeatureId(boardId: string): string {
  if (boardId === 'esp32-devkit') return 'wroom-module'
  if (boardId === 'raspberry-pi-pico') return 'component-pico-ref-microcontroller'
  if (boardId === 'raspberry-pi-pico-w') return 'component-rpi-rp2040'
  if (boardId === 'raspberry-pi-pico-2') return 'component-rpi-rp2350a'
  if (boardId === 'raspberry-pi-pico-2-h') return 'component-rpi-rp2350a'
  if (boardId === 'adafruit-qtpy-esp32-c3-5405') return 'cad-u2'
  if (boardId === 'adafruit-feather-esp32-s3-5323') return 'cad-u1'
  if (boardId === 'adafruit-feather-esp32-s3-tft-5483') return 'cad-u6'
  if (boardId === 'seeed-xiao-esp32c3') return 'cad-u4'
  if (boardId === 'seeed-xiao-esp32-s3') return 'cad-pcb'
  if (boardId === 'esp32-s3-devkitc-1') return 'cad-u4'
  return `component-${arduinoMcuRefs[boardId] ?? 'ZU4'}`
}
