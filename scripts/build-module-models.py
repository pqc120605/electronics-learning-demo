"""Build electronic-module GLB sources from KiCad library footprints/3D models (KiCad 10.0.7).

usage (KiCad's python): python scripts/build-module-models.py OUT_DIR [id ...]

For each module this writes OUT_DIR/<id>.kicad_pcb, <id>.pads.json and <id>.primitives.json
(parts with no KiCad 3D model, built later by make-primitive-part-glb.mjs). The board outline,
soldermask colour and part placement follow the common hobby module (sizes from vendor
listings/datasheets); positions are educational approximations, not vendor CAD.
Coordinates: PCB millimetres, origin top-left, x right, y down. Primitive coordinates use the
kicad-cli GLB frame: x, height above the board bottom, z = PCB y.
"""
import json
import os
import sys

import pcbnew

KICAD = 'D:/StartupOS/.tools/kicad-10.0.7/share/kicad/footprints'
mm = pcbnew.FromMM
T = 1.6  # board thickness
MASK = {'blue': 'Blue', 'green': 'Green', 'red': 'Red', 'black': 'Black', 'purple': 'Purple', 'white': 'White'}
SILVER, DARK, BLACK, WHITE, MESH = [0.78, 0.79, 0.8], [0.12, 0.13, 0.14], [0.05, 0.05, 0.06], [0.92, 0.92, 0.9], [0.28, 0.29, 0.3]


def place(board, path, ref, x, y, rot=0.0, back=False, value=None):
    lib, name = path.split('/')
    fp = pcbnew.FootprintLoad(f'{KICAD}/{lib}.pretty', name)
    if fp is None:
        raise SystemExit(f'missing footprint {path}')
    fp.SetReference(ref)
    fp.SetValue(value or name)
    fp.Reference().SetVisible(False)
    fp.Value().SetVisible(False)
    board.Add(fp)
    fp.SetPosition(pcbnew.VECTOR2I(mm(x), mm(y)))
    fp.SetOrientationDegrees(rot)
    if back:
        fp.Flip(fp.GetPosition(), pcbnew.FLIP_DIRECTION_TOP_BOTTOM)
    return fp


def outline(board, points):
    for (x1, y1), (x2, y2) in zip(points, points[1:] + points[:1]):
        seg = pcbnew.PCB_SHAPE(board)
        seg.SetShape(pcbnew.SHAPE_T_SEGMENT)
        seg.SetStart(pcbnew.VECTOR2I(mm(x1), mm(y1)))
        seg.SetEnd(pcbnew.VECTOR2I(mm(x2), mm(y2)))
        seg.SetLayer(pcbnew.Edge_Cuts)
        seg.SetWidth(mm(0.1))
        board.Add(seg)


def silk(board, text, x, y, size=1.0, rot=0.0, back=False):
    item = pcbnew.PCB_TEXT(board)
    item.SetText(text)
    item.SetLayer(pcbnew.B_SilkS if back else pcbnew.F_SilkS)
    item.SetPosition(pcbnew.VECTOR2I(mm(x), mm(y)))
    item.SetTextSize(pcbnew.VECTOR2I(mm(size), mm(size)))
    item.SetTextThickness(mm(size * 0.16))
    item.SetTextAngleDegrees(rot)
    if back:
        item.SetMirrored(True)
    board.Add(item)


def track(board, points, width=0.8, layer=pcbnew.F_Cu):
    for (x1, y1), (x2, y2) in zip(points, points[1:]):
        t = pcbnew.PCB_TRACK(board)
        t.SetStart(pcbnew.VECTOR2I(mm(x1), mm(y1)))
        t.SetEnd(pcbnew.VECTOR2I(mm(x2), mm(y2)))
        t.SetWidth(mm(width))
        t.SetLayer(layer)
        board.Add(t)


def mask_window(board, x0, y0, x1, y1):
    """Solder-mask opening so copper under it is exposed (e.g. soil-probe traces)."""
    shape = pcbnew.PCB_SHAPE(board)
    shape.SetShape(pcbnew.SHAPE_T_RECT)
    shape.SetStart(pcbnew.VECTOR2I(mm(x0), mm(y0)))
    shape.SetEnd(pcbnew.VECTOR2I(mm(x1), mm(y1)))
    shape.SetFilled(True)
    shape.SetLayer(pcbnew.F_Mask)
    shape.SetWidth(mm(0.05))
    board.Add(shape)


def header(board, ref, n, x, y, rot=90, back=False, kind='Vertical', female=False):
    lib = 'Connector_PinSocket_2.54mm' if female else 'Connector_PinHeader_2.54mm'
    name = f"{'PinSocket' if female else 'PinHeader'}_1x{n:02d}_P2.54mm_{kind}"
    return place(board, f'{lib}/{name}', ref, x, y, rot, back)


def rect(w, h):
    return [(0, 0), (w, 0), (w, h), (0, h)]


def cyl(name, x, z, y0, height, radius, color, axis='y', inner=0.0, metallic=0.05, roughness=0.6, segments=32):
    return {'name': name, 'type': 'cyl', 'center': [x, y0 + height / 2 if axis == 'y' else y0, z], 'radius': radius, 'height': height, 'axis': axis, 'innerRadius': inner, 'color': color, 'metallic': metallic, 'roughness': roughness, 'segments': segments}


def box(name, x, z, y0, w, h, d, color, metallic=0.05, roughness=0.6):
    return {'name': name, 'type': 'box', 'center': [x, y0 + h / 2, z], 'size': [w, h, d], 'color': color, 'metallic': metallic, 'roughness': roughness}


def transducer(name, x, z):
    return [cyl(f'{name}-can', x, z, T, 12.0, 8.0, SILVER, inner=6.6, metallic=0.85, roughness=0.35),
            cyl(f'{name}-mesh', x, z, T, 11.4, 6.6, MESH, roughness=0.9, segments=40)]


def smd_passives(board, prefix, spots, kind='R'):
    for i, (x, y, rot) in enumerate(spots, start=1):
        path = 'Resistor_SMD/R_0603_1608Metric' if kind == 'R' else 'Capacitor_SMD/C_0603_1608Metric'
        place(board, path, f'{prefix}{i}', x, y, rot)


# ---------------------------------------------------------------- module specs
def ultrasonic(b):
    w, h = 45.0, 20.0
    outline(b, rect(w, h))
    header(b, 'J1', 4, 18.69, 18.2, 90, back=True, kind='Horizontal')
    place(b, 'Crystal/Crystal_SMD_HC49-SD', 'Y1', 22.5, 4.2, 0)
    place(b, 'Package_SO/SOIC-16_3.9x9.9mm_P1.27mm', 'U1', 22.5, 9.5, 90, back=True)
    place(b, 'Package_SO/SOIC-14_3.9x8.7mm_P1.27mm', 'U2', 10.0, 10.0, 90, back=True)
    place(b, 'Package_SO/SOIC-8_3.9x4.9mm_P1.27mm', 'U3', 35.0, 10.0, 90, back=True)
    smd_passives(b, 'R', [(19.0, 12.0, 0), (26.0, 12.0, 0)])
    silk(b, 'HC-SR04', 22.5, 1.6, 1.4)
    silk(b, 'T', 4.0, 2.0, 1.2)
    silk(b, 'R', 41.0, 2.0, 1.2)
    silk(b, 'Vcc Trig Echo Gnd', 22.5, 14.8, 0.8)
    prims = transducer('T1', 9.6, 10.0) + transducer('R1', 35.4, 10.0)
    return {'pins': {'J1': ['vcc', 'trig', 'echo', 'gnd']}, 'mask': 'blue', 'primitives': prims, 'orient': 'upright', 'mount': 'breadboard',
            'package': 'Module siêu âm HC-SR04 (45 × 20 mm)'}


def oled(b):
    w, h = 27.3, 27.8
    outline(b, rect(w, h))
    header(b, 'J1', 4, 9.84, 1.8, 90, back=True)
    for i, (x, y) in enumerate([(2.0, 2.0), (25.3, 2.0), (2.0, 25.8), (25.3, 25.8)], 1):
        place(b, 'MountingHole/MountingHole_2.2mm_M2', f'H{i}', x, y)
    smd_passives(b, 'C', [(6.0, 5.2, 0), (21.0, 5.2, 0)], 'C')
    silk(b, 'VCC GND SDA SCL', 13.65, 4.2, 0.75)
    prims = [box('glass', 13.65, 15.4, T, 26.0, 1.5, 19.3, [0.06, 0.07, 0.09], 0.1, 0.15),
             box('active-area', 13.65, 14.6, T + 1.5, 22.0, 0.05, 11.2, [0.03, 0.1, 0.2], 0.0, 0.08),
             box('flex', 13.65, 26.0, T, 12.0, 0.2, 3.0, [0.85, 0.55, 0.12], 0.2, 0.5)]
    return {'pins': {'J1': ['vcc', 'gnd', 'sda', 'scl']}, 'mask': 'blue', 'primitives': prims, 'orient': 'flat', 'mount': 'breadboard',
            'package': 'Module OLED 0,96" I²C SSD1306 (27,3 × 27,8 mm)'}


def lcd1602(b):
    w, h = 80.0, 36.0
    outline(b, rect(w, h))
    for i, (x, y) in enumerate([(2.5, 2.5), (77.5, 2.5), (2.5, 33.5), (77.5, 33.5)], 1):
        place(b, 'MountingHole/MountingHole_3.2mm_M3', f'H{i}', x, y)
    header(b, 'J2', 16, 8.0, 2.5, 90)
    header(b, 'J1', 4, 2.0, 14.2, 0, kind='Horizontal')
    place(b, 'Package_SO/SOIC-16W_7.5x10.3mm_P1.27mm', 'U1', 40.0, 30.0, 90, back=True)
    place(b, 'Potentiometer_THT/Potentiometer_Bourns_3296W_Vertical', 'RV1', 14.0, 30.0, 0, back=True)
    silk(b, 'LCD1602 · I2C', 40.0, 34.6, 1.0)
    prims = [box('bezel', 40.0, 19.0, T, 71.2, 7.0, 24.2, [0.04, 0.04, 0.05], 0.1, 0.5),
             box('glass', 40.0, 19.0, T + 7.0, 64.5, 0.3, 14.5, [0.18, 0.42, 0.85], 0.0, 0.1)]
    return {'pins': {'J1': ['gnd', 'vcc', 'sda', 'scl']}, 'mask': 'green', 'primitives': prims, 'orient': 'flat', 'mount': 'bench',
            'package': 'LCD 16×2 HD44780 + backpack I²C PCF8574 (80 × 36 mm)'}


def relay(b):
    w, h = 50.0, 26.0
    outline(b, rect(w, h))
    header(b, 'J1', 3, 1.6, 10.46, 0, kind='Horizontal', back=False)
    place(b, 'Relay_THT/Relay_SPDT_SANYOU_SRD_Series_Form_C', 'K1', 18.0, 7.0, 0)
    place(b, 'TerminalBlock_Phoenix/TerminalBlock_Phoenix_MKDS-1,5-3_1x03_P5.00mm_Horizontal', 'J2', 45.0, 8.0, 90)
    place(b, 'Package_TO_SOT_SMD/SOT-23', 'Q1', 10.0, 20.0, 0)
    place(b, 'Diode_SMD/D_SOD-123', 'D1', 14.0, 22.5, 0)
    place(b, 'LED_SMD/LED_0603_1608Metric', 'D2', 8.0, 4.0, 0)
    place(b, 'LED_SMD/LED_0603_1608Metric', 'D3', 8.0, 7.0, 0)
    smd_passives(b, 'R', [(10.0, 15.0, 0), (6.0, 20.0, 90), (11.0, 4.0, 0)])
    silk(b, 'IN VCC GND', 6.5, 23.8, 0.8, 0)
    silk(b, 'NO COM NC', 44.0, 23.0, 0.8, 0)
    silk(b, 'SRD-05VDC-SL-C', 26.0, 24.5, 0.8)
    return {'pins': {'J1': ['in', 'vcc', 'gnd'], 'J2': ['no', 'com', 'nc']}, 'mask': 'blue', 'primitives': [], 'orient': 'flat', 'mount': 'bench',
            'package': 'Module relay 1 kênh 5 V (SRD-05VDC)'}


def h_bridge(b):
    w, h = 43.0, 43.0
    outline(b, rect(w, h))
    place(b, 'TerminalBlock_Phoenix/TerminalBlock_Phoenix_MKDS-1,5-2_1x02_P5.00mm_Horizontal', 'J1', 3.0, 14.0, 90)
    place(b, 'TerminalBlock_Phoenix/TerminalBlock_Phoenix_MKDS-1,5-2_1x02_P5.00mm_Horizontal', 'J2', 40.0, 19.0, -90)
    place(b, 'TerminalBlock_Phoenix/TerminalBlock_Phoenix_MKDS-1,5-3_1x03_P5.00mm_Horizontal', 'J3', 9.0, 40.0, 0)
    header(b, 'J4', 6, 22.0, 39.5, 90)
    place(b, 'Capacitor_THT/CP_Radial_D10.0mm_P5.00mm', 'C1', 9.0, 28.0, 0)
    place(b, 'Capacitor_THT/CP_Radial_D10.0mm_P5.00mm', 'C2', 30.0, 30.0, 0)
    place(b, 'Package_TO_SOT_SMD/TO-252-2', 'U2', 16.0, 32.0, 0)
    for i in range(4):
        place(b, 'Diode_SMD/D_SMA', f'D{i + 1}', 13.0 + i * 5.0, 26.0, 90)
    silk(b, 'L298N', 21.5, 40.8, 1.1)
    silk(b, '12V GND 5V', 14.0, 35.0, 0.8)
    silk(b, 'ENA IN1 IN2 IN3 IN4 ENB', 28.0, 37.2, 0.7)
    prims = [box('L298N', 21.5, 16.0, T, 20.0, 10.0, 3.6, BLACK, 0.1, 0.5),
             box('heatsink-base', 21.5, 11.0, T, 23.0, 25.0, 4.0, [0.08, 0.08, 0.09], 0.7, 0.45)]
    prims += [box(f'heatsink-fin-{i}', 11.0 + i * 3.0, 6.0, T + 2.0, 1.2, 23.0, 7.0, [0.08, 0.08, 0.09], 0.7, 0.45) for i in range(8)]
    return {'pins': {'J1': ['out1', 'out2'], 'J3': ['motorVcc', 'gnd', 'logicVcc'], 'J4': ['ena', 'in1', 'in2', None, None, None]}, 'mask': 'red', 'primitives': prims,
            'orient': 'flat', 'mount': 'bench', 'package': 'Module cầu H L298N (43 × 43 mm)'}


def tb6612(b):
    w = 20.32
    outline(b, rect(w, w))
    header(b, 'J1', 8, 1.27, 1.27, 90, back=True)
    header(b, 'J2', 8, 1.27, 19.05, 90, back=True)
    place(b, 'Package_SO/SSOP-24_5.3x8.2mm_P0.65mm', 'U1', 10.16, 10.16, 90)
    for i, (x, y) in enumerate([(4.0, 7.0), (4.0, 13.0), (16.3, 7.0), (16.3, 13.0)], 1):
        place(b, 'Capacitor_SMD/C_0805_2012Metric', f'C{i}', x, y, 90)
    silk(b, 'TB6612FNG', 10.16, 4.0, 0.8)
    return {'pins': {'J1': ['vm', 'vcc', 'gnd', 'a01', 'a02', None, None, None], 'J2': ['pwma', 'ain2', 'ain1', 'stby', None, None, None, None]}, 'mask': 'red', 'primitives': [],
            'orient': 'flat', 'mount': 'breadboard', 'package': 'Breakout TB6612FNG 2×8 chân (20,3 × 20,3 mm)'}


def mpu6050(b):
    w, h = 21.0, 16.0
    outline(b, rect(w, h))
    header(b, 'J1', 8, 1.61, 14.5, 90)
    place(b, 'Package_DFN_QFN/QFN-24-1EP_4x4mm_P0.5mm_EP2.7x2.7mm', 'U1', 10.5, 6.5, 45)
    place(b, 'Package_TO_SOT_SMD/SOT-23-5', 'U2', 4.0, 4.0, 0)
    place(b, 'LED_SMD/LED_0603_1608Metric', 'D1', 17.0, 3.0, 0)
    smd_passives(b, 'C', [(15.0, 7.0, 90), (6.0, 9.0, 0)], 'C')
    smd_passives(b, 'R', [(17.0, 6.0, 90), (17.0, 9.5, 90)])
    for i, (x, y) in enumerate([(1.8, 1.8), (19.2, 1.8)], 1):
        place(b, 'MountingHole/MountingHole_3.2mm_M3', f'H{i}', x, y)
    silk(b, 'GY-521', 10.5, 11.6, 0.9)
    return {'pins': {'J1': ['vcc', 'gnd', 'scl', 'sda', None, None, None, 'int']}, 'mask': 'blue', 'primitives': [], 'orient': 'flat', 'mount': 'bench',
            'package': 'Module GY-521 MPU-6050 (21 × 16 mm)'}


def bmp280(b):
    w, h = 11.5, 15.0
    outline(b, rect(w, h))
    header(b, 'J1', 6, -0.6, 13.5, 90)
    place(b, 'Package_LGA/Bosch_LGA-8_2.5x2.5mm_P0.65mm_ClockwisePinNumbering', 'U1', 5.75, 5.5, 0)
    smd_passives(b, 'R', [(2.5, 3.0, 90), (9.0, 3.0, 90), (2.5, 8.0, 90)])
    place(b, 'MountingHole/MountingHole_2.2mm_M2', 'H1', 5.75, 1.6)
    silk(b, 'BMP280', 5.75, 10.6, 0.8)
    return {'pins': {'J1': ['vcc', 'gnd', 'scl', 'sda', 'csb', 'sdo']}, 'mask': 'purple', 'primitives': [], 'orient': 'flat', 'mount': 'bench',
            'package': 'Module GY-BMP280 (11,5 × 15 mm)'}


def ir_sensor(b):
    w, h = 31.0, 14.0
    outline(b, rect(w, h))
    header(b, 'J1', 3, 1.6, 4.46, 0, kind='Horizontal')
    place(b, 'Package_SO/SOIC-8_3.9x4.9mm_P1.27mm', 'U1', 12.0, 7.0, 0)
    place(b, 'Potentiometer_THT/Potentiometer_Bourns_3296W_Vertical', 'RV1', 20.0, 7.0, 0)
    place(b, 'LED_THT/LED_D3.0mm_Horizontal_O1.27mm_Z2.0mm', 'D1', 27.0, 3.0, 0)
    place(b, 'LED_THT/LED_D3.0mm_Horizontal_O1.27mm_Z2.0mm', 'D2', 27.0, 8.5, 0)
    place(b, 'LED_SMD/LED_0603_1608Metric', 'D3', 7.0, 2.0, 0)
    place(b, 'LED_SMD/LED_0603_1608Metric', 'D4', 7.0, 12.0, 0)
    smd_passives(b, 'R', [(16.0, 2.0, 0), (16.0, 12.0, 0)])
    silk(b, 'OUT GND VCC', 5.0, 7.0, 0.7, 90)
    return {'pins': {'J1': ['out', 'gnd', 'vcc']}, 'mask': 'blue', 'primitives': [], 'orient': 'flat', 'mount': 'bench',
            'package': 'Module cảm biến vật cản hồng ngoại FC-51 (31 × 14 mm)'}


def photoresistor(b):
    w, h = 32.0, 14.0
    outline(b, rect(w, h))
    header(b, 'J1', 4, 1.6, 3.19, 0, kind='Horizontal')
    place(b, 'Package_SO/SOIC-8_3.9x4.9mm_P1.27mm', 'U1', 13.0, 7.0, 0)
    place(b, 'Potentiometer_THT/Potentiometer_Bourns_3296W_Vertical', 'RV1', 21.0, 7.0, 0)
    place(b, 'OptoDevice/R_LDR_5.1x4.3mm_P3.4mm_Vertical', 'R1', 27.5, 7.0, 90)
    place(b, 'LED_SMD/LED_0603_1608Metric', 'D1', 8.0, 2.0, 0)
    place(b, 'LED_SMD/LED_0603_1608Metric', 'D2', 8.0, 12.0, 0)
    silk(b, 'VCC GND DO AO', 5.2, 7.0, 0.7, 90)
    return {'pins': {'J1': ['vcc', 'gnd', 'do', 'ao']}, 'mask': 'blue', 'primitives': [], 'orient': 'flat', 'mount': 'bench',
            'package': 'Module quang trở LDR + LM393 (32 × 14 mm)'}


def pir(b):
    w, h = 32.0, 24.0
    outline(b, rect(w, h))
    header(b, 'J1', 3, 13.46, 22.0, 90)
    place(b, 'Package_SO/SOIC-16_3.9x9.9mm_P1.27mm', 'U1', 25.0, 12.0, 0, back=True)
    place(b, 'Potentiometer_THT/Potentiometer_Bourns_3296W_Vertical', 'RV1', 4.0, 19.0, 0)
    place(b, 'Potentiometer_THT/Potentiometer_Bourns_3296W_Vertical', 'RV2', 27.0, 19.0, 0)
    silk(b, 'VCC OUT GND', 16.0, 19.5, 0.7)
    prims = [box('lens-base', 16.0, 11.0, T, 23.0, 3.0, 23.0, WHITE, 0.0, 0.7)]
    for i, (r, hgt) in enumerate([(11.5, 3.5), (10.5, 3.0), (9.0, 2.5), (6.5, 2.0), (3.5, 1.2)]):
        base = T + 3.0 + sum(x[1] for x in [(11.5, 3.5), (10.5, 3.0), (9.0, 2.5), (6.5, 2.0), (3.5, 1.2)][:i])
        prims.append(cyl(f'lens-{i}', 16.0, 11.0, base, hgt, r, [0.95, 0.95, 0.93], roughness=0.8, segments=40))
    return {'pins': {'J1': ['vcc', 'out', 'gnd']}, 'mask': 'green', 'primitives': prims, 'orient': 'flat', 'mount': 'bench',
            'package': 'Module PIR HC-SR501 với thấu kính Fresnel (32 × 24 mm)'}


def corner_pads(b, spots):
    for ref, x, y in spots:
        place(b, 'TestPoint/TestPoint_THTPad_D2.0mm_Drill1.0mm', ref, x, y)


def boost(b):
    w, h = 36.0, 17.0
    outline(b, rect(w, h))
    corner_pads(b, [('TP1', 2.0, 2.0), ('TP2', 2.0, 15.0), ('TP3', 34.0, 2.0), ('TP4', 34.0, 15.0)])
    place(b, 'Package_TO_SOT_SMD/SOT-23-6', 'U1', 14.0, 8.5, 0)
    place(b, 'Inductor_SMD/L_Bourns_SRN6045TA', 'L1', 8.0, 8.5, 0)
    place(b, 'Potentiometer_THT/Potentiometer_Bourns_3296W_Vertical', 'RV1', 26.0, 8.5, 0)
    place(b, 'Diode_SMD/D_SOD-123', 'D1', 18.0, 4.0, 0)
    place(b, 'Capacitor_SMD/C_1206_3216Metric', 'C1', 18.0, 13.0, 0)
    place(b, 'Capacitor_SMD/C_1206_3216Metric', 'C2', 31.0, 8.5, 90)
    silk(b, 'IN+', 5.5, 2.0, 0.8)
    silk(b, 'IN-', 5.5, 15.0, 0.8)
    silk(b, 'OUT+', 30.0, 2.0, 0.8)
    silk(b, 'OUT-', 30.0, 15.0, 0.8)
    return {'pins': {'TP1': ['inPlus'], 'TP2': ['inMinus'], 'TP3': ['outPlus'], 'TP4': ['outMinus']}, 'mask': 'blue', 'primitives': [], 'orient': 'flat', 'mount': 'bench',
            'package': 'Module tăng áp MT3608 (36 × 17 mm)'}


def buck(b):
    w, h = 43.0, 21.0
    outline(b, rect(w, h))
    corner_pads(b, [('TP1', 2.0, 2.0), ('TP2', 2.0, 19.0), ('TP3', 41.0, 2.0), ('TP4', 41.0, 19.0)])
    place(b, 'Package_TO_SOT_SMD/TO-263-5_TabPin3', 'U1', 13.0, 10.5, 90)
    place(b, 'Inductor_SMD/L_Bourns_SRR1260', 'L1', 26.0, 10.5, 0)
    place(b, 'Capacitor_THT/CP_Radial_D8.0mm_P3.50mm', 'C1', 6.0, 10.5, 90)
    place(b, 'Capacitor_THT/CP_Radial_D8.0mm_P3.50mm', 'C2', 37.0, 10.5, 90)
    place(b, 'Diode_SMD/D_SMA', 'D1', 20.0, 18.0, 0)
    place(b, 'Potentiometer_THT/Potentiometer_Bourns_3296W_Vertical', 'RV1', 33.0, 3.0, 0)
    silk(b, 'IN+', 5.5, 2.0, 0.8)
    silk(b, 'IN-', 5.5, 19.0, 0.8)
    silk(b, 'OUT+', 37.0, 18.5, 0.8)
    silk(b, 'LM2596', 13.0, 19.5, 0.8)
    return {'pins': {'TP1': ['inPlus'], 'TP2': ['inMinus'], 'TP3': ['outPlus'], 'TP4': ['outMinus']}, 'mask': 'blue', 'primitives': [], 'orient': 'flat', 'mount': 'bench',
            'package': 'Module hạ áp LM2596 (43 × 21 mm)'}


def rfid(b):
    w, h = 40.0, 60.0
    outline(b, rect(w, h))
    header(b, 'J1', 8, 11.11, 57.5, 90)
    place(b, 'Package_DFN_QFN/QFN-32-1EP_5x5mm_P0.5mm_EP3.45x3.45mm', 'U1', 20.0, 44.0, 45)
    place(b, 'Crystal/Crystal_SMD_HC49-SD', 'Y1', 20.0, 50.5, 0)
    smd_passives(b, 'C', [(12.0, 42.0, 90), (28.0, 42.0, 90), (12.0, 47.0, 90), (28.0, 47.0, 90)], 'C')
    for i, (x, y) in enumerate([(3.5, 3.5), (36.5, 3.5), (3.5, 38.0), (36.5, 38.0)], 1):
        place(b, 'MountingHole/MountingHole_3.2mm_M3', f'H{i}', x, y)
    for k in range(4):
        m = 6.5 + k * 1.6
        track(b, [(m, m), (w - m, m), (w - m, 35.0 - k * 1.6), (m, 35.0 - k * 1.6), (m, m + 1.6)], 0.8)
    silk(b, 'RFID-RC522', 20.0, 37.2, 1.0)
    silk(b, 'SDA SCK MOSI MISO IRQ GND RST 3.3V', 20.0, 55.0, 0.62)
    return {'pins': {'J1': ['sda', 'sck', 'mosi', 'miso', 'irq', 'gnd', 'rst', 'vcc']}, 'mask': 'blue', 'primitives': [], 'orient': 'flat', 'mount': 'bench',
            'package': 'Module RFID RC522 13,56 MHz (40 × 60 mm)', 'tracks': True}


def rotary_encoder(b):
    w, h = 24.0, 18.0
    outline(b, rect(w, h))
    header(b, 'J1', 5, 6.92, 1.6, 90)
    smd_passives(b, 'R', [(4.0, 6.0, 90), (4.0, 10.0, 90), (4.0, 14.0, 90)])
    silk(b, 'CLK DT SW + GND', 12.0, 4.0, 0.7)
    prims = [box('encoder-body', 13.0, 11.0, T, 12.4, 6.5, 13.2, SILVER, 0.85, 0.35),
             cyl('encoder-bushing', 13.0, 11.0, T + 6.5, 5.0, 3.5, [0.72, 0.73, 0.74], metallic=0.9, roughness=0.3),
             cyl('encoder-shaft', 13.0, 11.0, T + 11.5, 12.0, 3.0, [0.8, 0.8, 0.82], metallic=0.9, roughness=0.25),
             cyl('knob', 13.0, 11.0, T + 14.0, 9.5, 7.5, [0.06, 0.06, 0.07], roughness=0.5, segments=24)]
    return {'pins': {'J1': ['clk', 'dt', 'sw', 'vcc', 'gnd']}, 'mask': 'blue', 'primitives': prims, 'orient': 'flat', 'mount': 'bench',
            'package': 'Module encoder xoay KY-040 (24 × 18 mm)'}


def soil(b):
    pts = [(0, 0), (16, 0), (16, 60), (11, 60), (11, 18), (5, 18), (5, 60), (0, 60)]
    outline(b, pts)
    header(b, 'J1', 3, 5.46, 2.2, 90)
    track(b, [(2.5, 16.0), (2.5, 58.0)], 3.0)
    track(b, [(13.5, 16.0), (13.5, 58.0)], 3.0)
    mask_window(b, 0.8, 14.5, 4.2, 59.5)
    mask_window(b, 11.8, 14.5, 15.2, 59.5)
    silk(b, 'VCC GND AO', 8.0, 5.0, 0.7)
    silk(b, 'SOIL', 8.0, 10.0, 1.2)
    return {'pins': {'J1': ['vcc', 'gnd', 'aout']}, 'mask': 'blue', 'primitives': [], 'orient': 'flat', 'mount': 'bench',
            'package': 'Đầu dò độ ẩm đất dạng nĩa (16 × 60 mm)', 'tracks': True}


def logic_level(b):
    w, h = 15.24, 13.0
    outline(b, rect(w, h))
    header(b, 'J1', 6, 1.27, 1.5, 90)
    header(b, 'J2', 6, 1.27, 11.5, 90)
    for i in range(4):
        place(b, 'Package_TO_SOT_SMD/SOT-23', f'Q{i + 1}', 2.5 + i * 3.4, 6.5, 0)
    silk(b, 'LV  HV', 7.6, 4.0, 0.6)
    return {'pins': {}, 'mask': 'red', 'primitives': [], 'orient': 'flat', 'mount': 'bench', 'package': 'Module chuyển mức logic 4 kênh BSS138'}


def mosfet_module(b):
    w, h = 33.0, 24.0
    outline(b, rect(w, h))
    place(b, 'Package_TO_SOT_THT/TO-220-3_Vertical', 'Q1', 14.0, 6.0, 0)
    place(b, 'TerminalBlock_Phoenix/TerminalBlock_Phoenix_MKDS-1,5-2_1x02_P5.00mm_Horizontal', 'J1', 3.0, 7.0, 90)
    place(b, 'TerminalBlock_Phoenix/TerminalBlock_Phoenix_MKDS-1,5-2_1x02_P5.00mm_Horizontal', 'J2', 30.0, 12.0, -90)
    header(b, 'J3', 3, 13.46, 21.5, 90)
    place(b, 'LED_SMD/LED_0603_1608Metric', 'D1', 24.0, 20.0, 0)
    smd_passives(b, 'R', [(20.0, 16.0, 0), (24.0, 16.0, 0)])
    silk(b, 'SIG VCC GND', 16.0, 18.5, 0.7)
    silk(b, 'IRF520', 16.0, 13.5, 0.9)
    return {'pins': {}, 'mask': 'black', 'primitives': [], 'orient': 'flat', 'mount': 'bench', 'package': 'Module MOSFET IRF520'}


def dht22(b):
    w, h = 15.24, 20.0
    outline(b, rect(w, h))
    header(b, 'J1', 3, 5.08, 18.2, 90)
    smd_passives(b, 'R', [(3.0, 16.0, 0)])
    smd_passives(b, 'C', [(12.0, 16.0, 0)], 'C')
    silk(b, '+ OUT -', 7.6, 15.8, 0.7)
    prims = [box('housing', 7.62, 7.2, T, 15.1, 7.7, 13.4, WHITE, 0.0, 0.8)]
    prims += [box(f'grille-{i}', 7.62, 2.0 + i * 2.0, T + 7.7, 12.0, 0.15, 0.9, [0.55, 0.55, 0.55], 0.0, 0.9) for i in range(6)]
    return {'pins': {'J1': ['vcc', 'data', 'gnd']}, 'mask': 'blue', 'primitives': prims, 'orient': 'flat', 'mount': 'bench',
            'package': 'Module AM2302/DHT22 trên PCB 3 chân'}


def ir_receiver(b):
    outline(b, rect(8.0, 4.0))
    place(b, 'OptoDevice/Vishay_MOLD-3Pin', 'U1', 1.46, 2.0, 0)
    return {'pins': {'U1': ['out', 'gnd', 'vcc']}, 'mask': 'black', 'primitives': [], 'orient': 'flat', 'mount': 'bench', 'noBoard': True,
            'package': 'Mắt thu hồng ngoại 3 chân (vỏ Vishay MOLD, kiểu VS1838B/TSOP)'}


def battery(b):
    outline(b, rect(60.0, 33.0))
    place(b, 'Battery/BatteryHolder_Keystone_2462_2xAA', 'BT1', 5.0, 5.0, 0)
    # Two AA cells (14.5 x 50.5 mm) inside the holder; holder spans x 2.4-61.9, z -4.0-28.9 (measured export).
    prims = []
    for i, z in enumerate((5.0, 19.9)):
        prims += [cyl(f'cell{i}-wrap', 32.15, z, 4.6, 47.5, 7.25, [0.78, 0.14, 0.1] if i == 0 else [0.1, 0.12, 0.14], axis='x', roughness=0.45, segments=36),
                  cyl(f'cell{i}-cap', 32.15 + (24.6 if i == 0 else -24.6), z, 4.6, 1.6, 6.9, SILVER, axis='x', metallic=0.9, roughness=0.3),
                  cyl(f'cell{i}-nub', 32.15 + (26.0 if i == 0 else -26.0), z, 4.6, 1.2, 2.6, SILVER, axis='x', metallic=0.9, roughness=0.3)]
    return {'pins': {'BT1': ['positive', 'negative']}, 'mask': 'black', 'primitives': prims, 'orient': 'flat', 'mount': 'bench', 'noBoard': True,
            'package': 'Hộp pin 2×AA (Keystone 2462)'}


MODULES = {
    'ultrasonic': ultrasonic, 'oled': oled, 'lcd1602': lcd1602, 'relay': relay, 'h-bridge': h_bridge, 'tb6612': tb6612,
    'mpu6050': mpu6050, 'bmp280': bmp280, 'ir-sensor': ir_sensor, 'photoresistor-module': photoresistor, 'pir': pir,
    'boost-converter': boost, 'buck-converter': buck, 'rfid': rfid, 'rotary-encoder': rotary_encoder, 'soil': soil,
    'logic-level': logic_level, 'mosfet-module': mosfet_module, 'dht22': dht22, 'ir-receiver': ir_receiver, 'battery': battery,
}


def stackup(text, mask):
    colour = MASK[mask]
    block = (
        '\t\t(stackup\n'
        '\t\t\t(layer "F.SilkS" (type "Top Silk Screen") (color "White"))\n'
        f'\t\t\t(layer "F.Mask" (type "Top Solder Mask") (color "{colour}") (thickness 0.01))\n'
        '\t\t\t(layer "F.Cu" (type "copper") (thickness 0.035))\n'
        '\t\t\t(layer "dielectric 1" (type "core") (thickness 1.51) (material "FR4") (epsilon_r 4.5) (loss_tangent 0.02))\n'
        '\t\t\t(layer "B.Cu" (type "copper") (thickness 0.035))\n'
        f'\t\t\t(layer "B.Mask" (type "Bottom Solder Mask") (color "{colour}") (thickness 0.01))\n'
        '\t\t\t(layer "B.SilkS" (type "Bottom Silk Screen") (color "White"))\n'
        '\t\t\t(copper_finish "ENIG")\n'
        '\t\t\t(dielectric_constraints no)\n'
        '\t\t)\n')
    if '\t(setup\n' not in text:
        raise SystemExit('no setup block to hold the stackup')
    return text.replace('\t(setup\n', '\t(setup\n' + block, 1)


def strip_models(text, ref):
    """Remove the (model ...) entries of one footprint from saved board text."""
    blocks = text.split('\n\t(footprint ')
    for i, block in enumerate(blocks):
        if f'(property "Reference" "{ref}"' in block:
            while '\n\t\t(model ' in block:
                start = block.index('\n\t\t(model ')
                end = block.index('\n\t\t)', start) + len('\n\t\t)')
                block = block[:start] + block[end:]
            blocks[i] = block
    return '\n\t(footprint '.join(blocks)


def header_primitives(fp):
    """Plastic strip and square gold pins for a straight 1xN header (front: pins up, back: pins down)."""
    ref = fp.GetReference()
    pads = [(pcbnew.ToMM(p.GetPosition().x), pcbnew.ToMM(p.GetPosition().y)) for p in fp.Pads()]
    xs, ys = [p[0] for p in pads], [p[1] for p in pads]
    back = fp.IsFlipped()
    body_y0, pin_y0, pin_len = (-2.5, -8.6, 11.2) if back else (T, T - 3.0, 11.6)
    gold = [0.86, 0.68, 0.3]
    prims = [box(f'{ref}-plastic', (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2, body_y0, max(xs) - min(xs) + 2.54, 2.5, max(ys) - min(ys) + 2.54, [0.04, 0.04, 0.045], 0.05, 0.55)]
    prims += [box(f'{ref}-pin{i}', x, y, pin_y0, 0.64, pin_len, 0.64, gold, 0.9, 0.3) for i, (x, y) in enumerate(pads)]
    return prims


def main():
    out = sys.argv[1]
    wanted = sys.argv[2:] or list(MODULES)
    os.makedirs(out, exist_ok=True)
    for module_id in wanted:
        board = pcbnew.BOARD()
        meta = MODULES[module_id](board)
        path = os.path.join(out, f'{module_id}.kicad_pcb')
        pcbnew.SaveBoard(path, board)
        with open(path, encoding='utf8') as handle:
            text = handle.read()
        # Straight 2.54 mm headers: drop the heavy chamfered STEP and draw a light plastic strip + square pins.
        light = [fp for fp in board.GetFootprints() if 'PinHeader_1x' in str(fp.GetFPID().GetLibItemName()) and '_Vertical' in str(fp.GetFPID().GetLibItemName())]
        for fp in light:
            text = strip_models(text, fp.GetReference())
            meta['primitives'] += header_primitives(fp)
        with open(path, 'w', encoding='utf8', newline='') as handle:
            handle.write(stackup(text, meta['mask']))
        pads = {}
        for fp in board.GetFootprints():
            pads[fp.GetReference()] = {'footprint': f'{fp.GetFPID().GetLibNickname()}/{fp.GetFPID().GetLibItemName()}', 'side': 'back' if fp.IsFlipped() else 'front',
                                       'pads': sorted(({'number': p.GetNumber(), 'x': round(pcbnew.ToMM(p.GetPosition().x), 4), 'y': round(pcbnew.ToMM(p.GetPosition().y), 4)} for p in fp.Pads()), key=lambda p: (len(p['number']), p['number']))}
        meta_out = {k: v for k, v in meta.items() if k != 'primitives'}
        with open(os.path.join(out, f'{module_id}.pads.json'), 'w', encoding='utf8') as handle:
            json.dump({'meta': meta_out, 'footprints': pads}, handle, indent=1, ensure_ascii=False)
        with open(os.path.join(out, f'{module_id}.primitives.json'), 'w', encoding='utf8') as handle:
            json.dump(meta['primitives'], handle)
        print('wrote', module_id)


main()
