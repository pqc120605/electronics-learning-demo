
cmake_minimum_required(VERSION 3.16)
include("$ENV{PICO_SDK_PATH}/external/pico_sdk_import.cmake")
project(machmo_rp2350_a6 C CXX ASM)

if(NOT PICO_PLATFORM STREQUAL "rp2350-arm-s" OR NOT PICO_BOARD STREQUAL "pico2")
    message(FATAL_ERROR "A6 requires the Pico 2 RP2350 Arm Secure target")
endif()

pico_sdk_init()
add_executable(machmo_rp2350_a6 button_led.c)
set_target_properties(machmo_rp2350_a6 PROPERTIES C_STANDARD 11 C_STANDARD_REQUIRED ON)
target_link_libraries(machmo_rp2350_a6 PRIVATE pico_stdlib hardware_uart)
pico_enable_stdio_usb(machmo_rp2350_a6 0)
pico_enable_stdio_uart(machmo_rp2350_a6 0)
