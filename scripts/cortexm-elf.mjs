export function assertCortexMImage(elf, board, stage, cpu = 'Cortex-M4') {
  const invalid = () => new Error('ELF ' + cpu + ' ' + stage + ' không phù hợp với vùng flash và SRAM của board.')
  if (elf.length < 52 || elf.readUInt32LE(0) !== 0x464C457F || elf[4] !== 1 || elf[5] !== 1
    || elf.readUInt16LE(16) !== 2 || elf.readUInt16LE(18) !== 40 || elf.readUInt32LE(20) !== 1) throw invalid()

  const entry = elf.readUInt32LE(24)
  const start = elf.readUInt32LE(28)
  const stride = elf.readUInt16LE(42)
  const count = elf.readUInt16LE(44)
  const flash = Number(board.flash.base)
  const sram = Number(board.sram.base)
  const inFlash = (addr, size) => addr >= flash && addr + size <= Number(board.flash.endExclusive)
  const inSram = (addr, size) => addr >= sram && addr + size <= Number(board.sram.endExclusive)
  if (!(entry & 1) || !inFlash(entry, 1) || start < 52 || stride !== 32 || count === 0
    || start + count * stride > elf.length) throw invalid()

  let vectorFileOffset
  for (let i = 0; i < count; i++) {
    const segment = start + i * stride
    if (elf.readUInt32LE(segment) !== 1) continue
    const offset = elf.readUInt32LE(segment + 4)
    const vma = elf.readUInt32LE(segment + 8)
    const lma = elf.readUInt32LE(segment + 12)
    const dataBytes = elf.readUInt32LE(segment + 16)
    const mappedBytes = elf.readUInt32LE(segment + 20)
    if (dataBytes > mappedBytes || offset + dataBytes > elf.length
      || !(inFlash(vma, mappedBytes) || inSram(vma, mappedBytes))
      || (dataBytes && !inFlash(lma, dataBytes))) throw invalid()
    if (vma === flash && lma === flash && dataBytes >= 64) vectorFileOffset = offset
  }
  if (vectorFileOffset === undefined) throw invalid()
  const stack = elf.readUInt32LE(vectorFileOffset)
  const reset = elf.readUInt32LE(vectorFileOffset + 4)
  const systick = elf.readUInt32LE(vectorFileOffset + 60)
  if (stack !== Number(board.sram.endExclusive) || stack % 8 || reset !== entry
    || !(systick & 1) || !inFlash(systick, 1)) throw invalid()
}

export function cortexMLinkerScript(flash, sram) {
  return [
    'ENTRY(Reset_Handler)',
    'MEMORY {',
    '  FLASH (rx) : ORIGIN = ' + flash.base + ', LENGTH = ' + flash.bytes,
    '  SRAM (rwx) : ORIGIN = ' + sram.base + ', LENGTH = ' + sram.bytes,
    '}',
    '__stack_top = ORIGIN(SRAM) + LENGTH(SRAM);',
    'SECTIONS {',
    '  .vectors : { KEEP(*(.vectors)) } > FLASH',
    '  .text : { *(.text*) *(.rodata*) } > FLASH',
    '  .ARM.exidx : { *(.ARM.exidx*) } > FLASH',
    '  .data : { . = ALIGN(4); __data_start = .; *(.data*) . = ALIGN(4); __data_end = .; } > SRAM AT > FLASH',
    '  __data_load = LOADADDR(.data);',
    '  .bss (NOLOAD) : { . = ALIGN(4); __bss_start = .; *(.bss*) *(COMMON) . = ALIGN(4); __bss_end = .; } > SRAM',
    '}',
    '',
  ].join('\n')
}
