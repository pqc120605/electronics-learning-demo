import type { Atmega328pSnapshot } from './avr8jsRunner'

/** Invalidates non-abortable file reads and aborts fetches when a newer selection wins. */
export function createFirmwareLoadGuard() {
  let generation = 0
  let controller: AbortController | undefined
  function cancel() {
    generation += 1
    controller?.abort()
    controller = undefined
  }
  return {
    cancel,
    start() {
      cancel()
      const current = generation
      const request = new AbortController()
      controller = request
      return { signal: request.signal, isCurrent: () => generation === current && !request.signal.aborted }
    },
  }
}

export const arduinoBlinkSamplePath = '/firmware/arduino-uno-d13-blink/arduino-uno-d13-blink.hex'
export const arduinoBlinkSampleName = 'arduino-uno-d13-blink.hex'

export async function fetchFirmwareText(path: string, signal: AbortSignal) {
  const response = await fetch(path, { signal })
  if (!response.ok) throw new Error('Không tải được firmware mẫu. Hãy thử lại hoặc chọn tệp HEX trên máy.')
  const source = await response.text()
  if (source.length > 2 * 1024 * 1024) throw new Error('Tệp HEX vượt giới hạn 2 MiB.')
  return source
}

export function firmwareTraceCsv(frame: Atmega328pSnapshot): string {
  const rows = ['source,target,signal,simulated_ms,cycles,level,trace_truncated']
  for (const event of frame.pinTransitionEvents) {
    rows.push(['avr8js', frame.target, 'D13/PB5', event.simulatedMilliseconds, event.cycles, event.level ? 'HIGH' : 'LOW', frame.traceTruncated].join(','))
  }
  return rows.join('\r\n') + '\r\n'
}

export function downloadFirmwareTrace(frame: Atmega328pSnapshot) {
  const url = URL.createObjectURL(new Blob([firmwareTraceCsv(frame)], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `mach-mo-${frame.target}-d13.csv`
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
