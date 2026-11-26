export const hexGlyphs = [0x3F,0x06,0x5B,0x4F,0x66,0x6D,0x7D,0x07,0x7F,0x6F,0x77,0x7C,0x39,0x5E,0x79,0x71]
export const maxSegmentPin = (digit: number, segment: number) => {
  const pin = 7-segment
  return 'seg' + (pin >= digit ? pin+1 : pin)
}

export function createR4Max6951() {
  const registers = new Uint8Array(0x68)
  registers[3]=4
  let shift=0
  let prevClock=false
  let prevSelect=true
  const edge = (din: boolean, clock: boolean, select: boolean) => {
    if (!select && clock && !prevClock) shift=(shift<<1|+din)&65535
    if (select && !prevSelect) {
      const address=shift>>>8
      if ([1,2,3,4,7].includes(address) || (address>=0x20 && address<=0x27)) registers[address]=shift&255
      if (address===4 && (shift&0x20)) registers.fill(0,0x20,0x28)
    }
    prevClock=clock
    prevSelect=select
  }
  function digits() {
    return Array.from({length:8},(_,i) => {
      if (registers[7]&1) return 0xFF
      if (!(registers[4]&1) || i>(registers[3]&7)) return 0
      const value=registers[0x20+i]
      return registers[1]&(1<<i) ? hexGlyphs[value&15] | (value&0x80) : value
    })
  }
  return { edge, digits, intensity: () => (registers[7]&1 ? 1 : ((registers[2]&15)+1)/16) }
}

/** Shift registers consume physical edges. Level-sensitive LE and the edge latches differ deliberately. */
export function createR4ShiftDriver(model: 'tlc5940'|'tlc5928'|'tlc5916') {
  const bitsPerChannel=model==='tlc5940'?12:1
  const width=model==='tlc5916'?8:16
  const length=width*bitsPerChannel
  const mask=(1n<<BigInt(length))-1n
  let shift=0n
  let latched=0n
  let previouslyClock=false
  let previouslyLatch=false
  let previouslyGs=false
  let count=0
  let shiftedOut=0
  let disabled=true
  function edge(input: boolean, clock: boolean, latch: boolean, blank: boolean, gs = false) {
    if (clock && !previouslyClock) {
      shiftedOut=Number((shift>>BigInt(length-1))&1n)
      shift=((shift<<1n)|BigInt(+input))&mask
    }
    if (model==='tlc5916' ? latch || previouslyLatch : latch&&!previouslyLatch && (model==='tlc5928'||blank)) latched=shift
    if (blank) count=0
    else if (gs && !previouslyGs) count=Math.min(4096,count+1)
    previouslyClock=clock
    previouslyLatch=latch
    previouslyGs=gs
    disabled=blank
  }
  const code = (channel: number) => Number(latched>>BigInt(channel*bitsPerChannel) & ((1n<<BigInt(bitsPerChannel))-1n))
  return { width, length, edge, shiftedOut: () => shiftedOut,
    codes: () => Array.from({length:width},(_,index)=>code(index)),
    duty: (channel:number) => disabled?0:code(channel)/(bitsPerChannel===1?1:4096),
    drive:(channel:number) => !disabled && count<code(channel) ? 0 : 'Z',
  }
}

export function createR4Tlc59116() {
  const registers=new Uint8Array(32)
  const reset=()=>{ registers.fill(0);registers[0]=0x11;registers.fill(0xFF,2,0x12);registers[0x12]=0xFF }
  reset()
  function write(pointer: number, bytes: number[]) {
    const first=pointer&31
    for (const [i,value] of bytes.entries()) {
      const at=(pointer&0x80)?(first+i)&31:first
      if (at<=0x17) registers[at]=value
    }
  }
  const read=(pointer:number)=>Array.from({length:32},(_,i)=>registers[((pointer&31)+((pointer&0x80)?i:0))&31])
  function duty(channel:number) {
    if (registers[0]&0x10) return 0
    const mode=registers[0x14+(channel>>2)]>>((channel&3)*2)&3
    if (!mode) return 0
    if (mode===1) return 1
    const individual=registers[2+channel]/256
    return mode===2?individual:individual*registers[0x12]/256
  }
  return { reset,write,read,duty }
}
