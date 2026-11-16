"""Build educational STM32 board reconstructions from KiCad library footprints and 3D models.

usage (KiCad's python): python scripts/build-stm32-education-boards.py OUT_DIR

Writes OUT_DIR/<board>.kicad_pcb and OUT_DIR/<board>.pads.json. Export GLBs with:
  kicad-cli pcb export glb -D KICAD10_3DMODEL_DIR=<kicad>/share/kicad/3dmodels -o public/models/<board>.glb OUT_DIR/<board>.kicad_pcb

These are NOT vendor CAD. Board size, header pitch/row spacing and pin order follow public
documentation; secondary part positions are approximations. ST's MB1136 CAD is not used
(its licence does not clear redistribution, see assets/boards/vendor/nucleo-f401re/SOURCE.md).
The Arduino-compatible header geometry of the Nucleo is copied from the Arduino Uno Rev3 CAD
(CC BY-SA 4.0) in assets/boards/arduino-reference, read-only.
"""
import json
import os
import sys

import pcbnew

KICAD = 'D:/StartupOS/.tools/kicad-10.0.7/share/kicad/footprints'
UNO = os.path.join(os.path.dirname(__file__), '..', 'assets', 'boards', 'arduino-reference', 'arduino-uno-r3-viewer.kicad_pcb')
mm = pcbnew.FromMM


def place(board, lib, name, ref, x, y, angle=0.0, value='', back=False):
    fp = pcbnew.FootprintLoad(f'{KICAD}/{lib}.pretty', name)
    if fp is None:
        raise SystemExit(f'missing footprint {lib}/{name}')
    fp.SetReference(ref)
    fp.SetValue(value or name)
    board.Add(fp)
    fp.SetPosition(pcbnew.VECTOR2I(mm(x), mm(y)))
    fp.SetOrientationDegrees(angle)
    if back:
        fp.Flip(fp.GetPosition(), pcbnew.FLIP_DIRECTION_TOP_BOTTOM)
    return fp


def outline(board, width, height, radius=0.0):
    corners = [(0, 0), (width, 0), (width, height), (0, height)]
    for (x1, y1), (x2, y2) in zip(corners, corners[1:] + corners[:1]):
        seg = pcbnew.PCB_SHAPE(board)
        seg.SetShape(pcbnew.SHAPE_T_SEGMENT)
        seg.SetStart(pcbnew.VECTOR2I(mm(x1), mm(y1)))
        seg.SetEnd(pcbnew.VECTOR2I(mm(x2), mm(y2)))
        seg.SetLayer(pcbnew.Edge_Cuts)
        seg.SetWidth(mm(0.1))
        board.Add(seg)


def pads_json(board):
    out = {}
    for fp in board.GetFootprints():
        out[fp.GetReference()] = {
            'footprint': f'{fp.GetFPID().GetLibNickname()}/{fp.GetFPID().GetLibItemName()}',
            'value': fp.GetValue(), 'side': 'back' if fp.IsFlipped() else 'front',
            'x': pcbnew.ToMM(fp.GetPosition().x), 'y': pcbnew.ToMM(fp.GetPosition().y), 'rotation': fp.GetOrientationDegrees(),
            'pads': [{'number': p.GetNumber(), 'x': round(pcbnew.ToMM(p.GetPosition().x), 4), 'y': round(pcbnew.ToMM(p.GetPosition().y), 4)} for p in fp.Pads()],
        }
    return out


def blue_pill():
    # 53.34 x 22.86 mm; two 1x20 rows on 2.54 mm pitch, 15.24 mm (0.6 in) apart; USB at x = 0.
    board = pcbnew.BOARD()
    outline(board, 53.34, 22.86)
    for ref, y in (('J1', 3.81), ('J2', 19.05)):
        place(board, 'Connector_PinHeader_2.54mm', 'PinHeader_1x20_P2.54mm_Vertical', ref, 2.54, y, 90, '1x20 header', back=True)
    place(board, 'Connector_USB', 'USB_Micro-B_Molex_47346-0001', 'J3', 1.45, 11.43, -90, 'Micro-USB')
    place(board, 'Package_QFP', 'LQFP-48_7x7mm_P0.5mm', 'U1', 27.0, 11.43, 45, 'STM32F103C8T6')
    place(board, 'Crystal', 'Crystal_SMD_HC49-SD', 'Y1', 15.0, 11.43, 0, '8 MHz')
    place(board, 'Crystal', 'Crystal_SMD_3215-2Pin_3.2x1.5mm', 'Y2', 32.5, 16.0, 0, '32.768 kHz')
    place(board, 'Package_TO_SOT_SMD', 'SOT-23-5', 'U2', 8.0, 7.0, 0, '3.3 V LDO')
    place(board, 'Button_Switch_SMD', 'SW_SPST_TL3342', 'SW1', 37.5, 11.43, 90, 'RESET')
    place(board, 'Connector_PinHeader_2.54mm', 'PinHeader_2x03_P2.54mm_Vertical', 'J4', 41.0, 10.16, 90, 'BOOT0/BOOT1')
    place(board, 'Connector_PinHeader_2.54mm', 'PinHeader_1x04_P2.54mm_Horizontal', 'J5', 50.8, 7.62, 0, 'SWD')
    place(board, 'LED_SMD', 'LED_0603_1608Metric', 'D1', 13.0, 6.2, 0, 'PWR')
    place(board, 'LED_SMD', 'LED_0603_1608Metric', 'D2', 20.5, 16.5, 0, 'PC13')
    return board


def uno_headers():
    uno = pcbnew.LoadBoard(UNO)
    box = uno.GetBoardEdgesBoundingBox()
    left, bottom = pcbnew.ToMM(box.GetX()) + 0.127, pcbnew.ToMM(box.GetY() + box.GetHeight()) - 0.127
    rows = {}
    for ref in ('IOH0', 'IOL0', 'POWER0', 'AD0'):
        fp = uno.FindFootprintByReference(ref)
        pads = sorted(((int(p.GetNumber()), pcbnew.ToMM(p.GetPosition().x) - left, bottom - pcbnew.ToMM(p.GetPosition().y)) for p in fp.Pads()))
        rows[ref] = pads
    return rows


def nucleo():
    # Nucleo-64: 70 x 82.5 mm (UM1724). ST-LINK at the top, target MCU below.
    board = pcbnew.BOARD()
    outline(board, 70.0, 82.5)
    place(board, 'Connector_USB', 'USB_Mini-B_Lumberg_2486_01_Horizontal', 'CN1', 35.0, 3.6, 180, 'ST-LINK USB')
    place(board, 'Package_QFP', 'LQFP-48_7x7mm_P0.5mm', 'U2', 35.0, 14.0, 45, 'STM32F103CBT6 (ST-LINK/V2-1)')
    place(board, 'Connector_PinHeader_2.54mm', 'PinHeader_1x06_P2.54mm_Vertical', 'CN4', 60.0, 7.0, 0, 'SWD')
    place(board, 'Connector_PinHeader_2.54mm', 'PinHeader_2x02_P2.54mm_Vertical', 'CN2', 10.0, 9.0, 0, 'ST-LINK/Nucleo jumpers')
    place(board, 'LED_SMD', 'LED_0603_1608Metric', 'LD1', 48.0, 6.0, 0, 'COM')
    place(board, 'Package_QFP', 'LQFP-64_10x10mm_P0.5mm', 'U1', 35.0, 54.0, 45, 'STM32F401RET6')
    place(board, 'Button_Switch_SMD', 'SW_SPST_TL3342', 'B1', 25.0, 32.0, 0, 'USER (blue)')
    place(board, 'Button_Switch_SMD', 'SW_SPST_TL3342', 'B2', 45.0, 32.0, 0, 'RESET (black)')
    place(board, 'LED_SMD', 'LED_0603_1608Metric', 'LD2', 35.0, 36.5, 0, 'USER · PA5')
    place(board, 'LED_SMD', 'LED_0603_1608Metric', 'LD3', 18.0, 26.0, 0, 'PWR')
    place(board, 'Package_TO_SOT_SMD', 'SOT-223-3_TabPin2', 'U5', 52.0, 26.0, 0, '3.3 V regulator')
    place(board, 'Crystal', 'Crystal_SMD_3215-2Pin_3.2x1.5mm', 'X2', 45.0, 64.0, 0, '32.768 kHz')
    # Arduino Uno R3 connectors, rotated into the portrait board: Uno x (away from USB) -> Nucleo y,
    # Uno y (power row at 2.54 mm, digital row at 50.8 mm) -> Nucleo x.
    rows = uno_headers()
    x0, y0 = 10.87 - 2.54, 14.0
    names = {'IOH0': ('CN5', 10, 'Arduino D8-D15'), 'IOL0': ('CN9', 8, 'Arduino D0-D7'), 'POWER0': ('CN6', 8, 'Arduino power'), 'AD0': ('CN8', 6, 'Arduino A0-A5')}
    for ref, (new_ref, count, value) in names.items():
        pads = rows[ref]
        first = pads[0]
        last = pads[-1]
        x = x0 + first[2]
        y = y0 + first[1]
        angle = 0 if last[1] > first[1] else 180
        place(board, 'Connector_PinSocket_2.54mm', f'PinSocket_1x{count:02d}_P2.54mm_Vertical', new_ref, x, y, angle, value)
    # ST morpho 2x19 male headers along the long edges (positions approximate).
    place(board, 'Connector_PinHeader_2.54mm', 'PinHeader_2x19_P2.54mm_Vertical', 'CN7', 3.81, 35.0, 0, 'ST morpho CN7')
    place(board, 'Connector_PinHeader_2.54mm', 'PinHeader_2x19_P2.54mm_Vertical', 'CN10', 63.65, 35.0, 0, 'ST morpho CN10')
    for i, (x, y) in enumerate(((3.5, 24.0), (66.5, 24.0), (14.5, 80.0), (55.5, 80.0)), start=1):
        place(board, 'MountingHole', 'MountingHole_3.2mm_M3', f'H{i}', x, y)
    return board


def main():
    out = sys.argv[1]
    os.makedirs(out, exist_ok=True)
    for name, build in (('stm32-blue-pill-f103', blue_pill), ('stm32-nucleo-f401re', nucleo)):
        board = build()
        path = os.path.join(out, f'{name}.kicad_pcb')
        pcbnew.SaveBoard(path, board)
        with open(os.path.join(out, f'{name}.pads.json'), 'w', encoding='utf8') as handle:
            json.dump(pads_json(board), handle, indent=1)
        print('wrote', path)


main()
