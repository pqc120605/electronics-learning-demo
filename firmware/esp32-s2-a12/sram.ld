ENTRY(_start)
MEMORY {
    iram (rx) : ORIGIN = 0x40024000, LENGTH = 0xc000
    dram (rw) : ORIGIN = 0x3ffc0000, LENGTH = 0x38000
}
PHDRS {
    code PT_LOAD FLAGS(5);
    data PT_LOAD FLAGS(6);
}
SECTIONS {
    .text : ALIGN(4) {
        KEEP(*(.literal.start))
        KEEP(*(.text.start))
        *(.literal .literal.*)
        *(.text .text.*)
    } > iram :code
    .rodata : ALIGN(4) { *(.rodata .rodata.*) } > dram :data
    .data : ALIGN(4) { *(.data .data.*) } > dram :data
    .bss (NOLOAD) : ALIGN(4) { *(.bss .bss.* COMMON) } > dram :data
    __stack_top = (ORIGIN(dram) + LENGTH(dram)) & ~15;
}
