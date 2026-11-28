.section .text.start,"ax",@progbits
.global _start
.type _start,@function
_start:
    rsil a2, 15
    movi a1, __stack_top
    call0 a12_main
1:
    j 1b
.size _start, .-_start
