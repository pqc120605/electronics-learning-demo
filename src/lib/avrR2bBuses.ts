import { AVRSPI, AVRTWI, spiConfig, twiConfig, type CPU } from 'avr8js'
import type { createR2bCircuitInterface } from '../simulation/catalogR2bCircuit'

const UNO_CLOCK_HZ = 16_000_000

export function attachR2bAvrBuses(cpu: CPU, circuits: ReturnType<typeof createR2bCircuitInterface>,
  observe: () => void, changed: () => void) {
  if (circuits.hasI2c) {
    const twi = new AVRTWI(cpu,twiConfig,UNO_CLOCK_HZ)
    const afterByte = (callback: () => void) =>
      cpu.addClockEvent(callback,Math.max(1,Math.round(9 * UNO_CLOCK_HZ / twi.sclFrequency)))
    const {i2c} = circuits
    twi.eventHandler = {
      start(repeated) {
        observe()
        i2c.start(repeated,twi.sclFrequency)
        changed()
        twi.completeStart()
      },
      stop() {
        observe()
        i2c.stop()
        changed()
        twi.completeStop()
      },
      connectToSlave(address,write) {
        afterByte(() => {
          observe()
          const ack = i2c.connect(address,write)
          changed()
          twi.completeConnect(ack)
        })
      },
      writeByte(value) {
        afterByte(() => {
          observe()
          const ack = i2c.write(value)
          changed()
          twi.completeWrite(ack)
        })
      },
      readByte(ack) {
        afterByte(() => {
          observe()
          const value = i2c.read(ack)
          changed()
          twi.completeRead(value === 'X' ? 255 : value)
        })
      },
    }
  }
  if (circuits.hasSpi) {
    const spi = new AVRSPI(cpu,spiConfig,UNO_CLOCK_HZ)
    spi.onByte = value => {
      const {spiFrequency,spiMode,dataOrder,isMaster,transferCycles} = spi
      cpu.addClockEvent(() => {
        observe()
        circuits.spi(value,isMaster ? spiFrequency : 0,spiMode,dataOrder === 'msbFirst')
        changed()
        spi.completeTransfer(255)
      },transferCycles)
    }
  }
}
