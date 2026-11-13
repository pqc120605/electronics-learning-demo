"""Generate educational reference PCBs for classic Arduino AVR boards."""
from pathlib import Path
import pcbnew

ROOT = Path(__file__).resolve().parent
LIBS = Path(r"C:\Program Files\KiCad\9.0\share\kicad\footprints")
MM = pcbnew.FromMM
loader = pcbnew.PCB_IO_KICAD_SEXPR()

def footprint(board, lib, name, ref, value, x, y, rotation=0):
    fp = loader.FootprintLoad(str(LIBS / f"{lib}.pretty"), name)
    if fp is None: raise RuntimeError(f"Missing footprint {lib}:{name}")
    fp.SetReference(ref); fp.SetValue(value); fp.SetPosition(pcbnew.VECTOR2I(MM(x), MM(y))); fp.SetOrientationDegrees(rotation)
    fp.Reference().SetVisible(True); fp.Value().SetVisible(False); board.Add(fp)

def outline(board, width, height):
    x, y = width/2, height/2
    pts=[(-x,-y),(x,-y),(x,y),(-x,y)]
    for i,(x1,y1) in enumerate(pts):
        x2,y2=pts[(i+1)%4]; s=pcbnew.PCB_SHAPE(); s.SetShape(pcbnew.SHAPE_T_SEGMENT); s.SetStart(pcbnew.VECTOR2I(MM(x1),MM(y1))); s.SetEnd(pcbnew.VECTOR2I(MM(x2),MM(y2))); s.SetLayer(pcbnew.Edge_Cuts); s.SetWidth(MM(.05)); board.Add(s)

def text(board, value, x, y, size=.8, rot=0):
    t=pcbnew.PCB_TEXT(board); t.SetText(value); t.SetPosition(pcbnew.VECTOR2I(MM(x),MM(y))); t.SetLayer(pcbnew.F_SilkS); t.SetTextSize(pcbnew.VECTOR2I(MM(size),MM(size))); t.SetTextThickness(MM(.12)); t.SetTextAngleDegrees(rot); board.Add(t)

def headers(board, rows):
    for ref, count, x, y, rot in rows:
        footprint(board,"Connector_PinHeader_2.54mm",f"PinHeader_1x{count:02d}_P2.54mm_Vertical",ref,f"{count}-pin header",x,y,rot)

def passives(board, points):
    for i,(kind,x,y) in enumerate(points):
        lib,name=("Resistor_SMD","R_0603_1608Metric") if kind=='R' else ("Capacitor_SMD","C_0603_1608Metric")
        footprint(board,lib,name,f"{kind}{i+1}","0603",x,y)

def uno():
    b=pcbnew.BOARD(); b.GetDesignSettings().SetBoardThickness(MM(1.6)); outline(b,68.6,53.4)
    # R3 shield header geometry, DIP MCU, USB-B, barrel input and power section.
    headers(b,[("J1",10,-11.43,-22.86,90),("J2",8,14.0,-22.86,90),("J3",8,-14.0,22.86,90),("J4",6,14.0,22.86,90)])
    footprint(b,"Package_DIP","DIP-28_W7.62mm","U1","ATmega328P",0,3.8)
    footprint(b,"Package_QFP","LQFP-32_7x7mm_P0.8mm","U2","USB interface",-16,-8)
    footprint(b,"Connector_USB","USB_B_OST_USB-B1HSxx_Horizontal","J5","USB-B",-21.5,-23,0)
    footprint(b,"Connector_BarrelJack","BarrelJack_CUI_PJ-063AH_Horizontal","J6","DC input",-31,-20,90)
    footprint(b,"Package_TO_SOT_SMD","SOT-223-3_TabPin2","U3","5V regulator",-27,1)
    footprint(b,"Button_Switch_THT","SW_PUSH_6mm_H7.3mm","SW1","RESET",-17,-19)
    footprint(b,"Crystal","Resonator_Murata_CSTLSxxxX-3Pin_W5.5mm_H3.0mm","Y1","16 MHz",8,5)
    for i,(x,y) in enumerate([(-8,-20),(-3,-20),(9,-17),(14,-17),(18,-16)]): footprint(b,"LED_SMD","LED_0603_1608Metric",f"D{i+1}","status LED",x,y)
    passives(b,[('R',-10,-18),('R',-5,-18),('R',10,-14),('R',15,-14),('C',-27,6),('C',-23,6),('C',-13,-3),('C',-7,-3)])
    text(b,"UNO R3 · ATmega328P",0,24,1.1); text(b,"DIGITAL",27,9,.65,90); text(b,"POWER",-29,13,.65,90); text(b,"ANALOG IN",17,17,.65)
    return b

def nano():
    b=pcbnew.BOARD(); b.GetDesignSettings().SetBoardThickness(MM(1.6)); outline(b,45,18)
    headers(b,[("J1",15,-7.62,0,90),("J2",15,7.62,0,90)])
    footprint(b,"Package_QFP","LQFP-32_7x7mm_P0.8mm","U1","ATmega328P-AU",0,0)
    footprint(b,"Package_SO","SOIC-16W_7.5x10.3mm_P1.27mm","U2","USB-UART",0,-5.5)
    footprint(b,"Connector_USB","USB_Mini-B_Lumberg_2486_01_Horizontal","J3","Mini-B",0,-8)
    footprint(b,"Package_TO_SOT_SMD","SOT-223-3_TabPin2","U3","5V regulator",-11,-5)
    footprint(b,"Button_Switch_THT","SW_PUSH_6mm_H7.3mm","SW1","RESET",10,-5)
    footprint(b,"Crystal","Resonator_Murata_CSTLSxxxX-3Pin_W5.5mm_H3.0mm","Y1","16 MHz",0,3)
    for i,(x,y) in enumerate([(-5,-3),(5,-3)]): footprint(b,"LED_SMD","LED_0603_1608Metric",f"D{i+1}","status LED",x,y)
    passives(b,[('R',-7,-5),('R',7,-5),('C',-10,5),('C',10,5),('C',0,6)])
    text(b,"NANO · ATmega328P",0,7,1.0); text(b,"D0–D13 / A0–A7",0,-7,.65)
    return b

def mega():
    b=pcbnew.BOARD(); b.GetDesignSettings().SetBoardThickness(MM(1.6)); outline(b,101.52,53.3)
    headers(b,[("J1",18,-45.72,-9,0),("J2",18,-20.32,-9,0),("J3",18,20.32,-9,0),("J4",18,45.72,-9,0),("J5",16,-35.56,22,0),("J6",8,35.56,22,0)])
    footprint(b,"Package_QFP","TQFP-100_14x14mm_P0.5mm","U1","ATmega2560",0,0)
    footprint(b,"Package_QFP","LQFP-32_7x7mm_P0.8mm","U2","USB interface",-27,-8)
    footprint(b,"Connector_USB","USB_B_OST_USB-B1HSxx_Horizontal","J7","USB-B",-36,-23)
    footprint(b,"Connector_BarrelJack","BarrelJack_CUI_PJ-063AH_Horizontal","J8","DC input",-46,-20,90)
    footprint(b,"Package_TO_SOT_SMD","SOT-223-3_TabPin2","U3","5V regulator",-40,0)
    footprint(b,"Button_Switch_THT","SW_PUSH_6mm_H7.3mm","SW1","RESET",-30,-19)
    footprint(b,"Crystal","Resonator_Murata_CSTLSxxxX-3Pin_W5.5mm_H3.0mm","Y1","16 MHz",12,0)
    for i,(x,y) in enumerate([(-20,-20),(-15,-20),(18,-17),(23,-17)]): footprint(b,"LED_SMD","LED_0603_1608Metric",f"D{i+1}","status LED",x,y)
    passives(b,[('R',-22,-17),('R',-17,-17),('R',18,-14),('R',23,-14),('C',-40,5),('C',-35,5),('C',-24,-3),('C',-18,-3)])
    text(b,"MEGA 2560 R3 · ATmega2560",0,25,1.05); text(b,"DIGITAL 0–53",47,8,.7,90); text(b,"ANALOG IN",-34,16,.7)
    return b

if __name__=='__main__':
    for name,make in [('arduino-uno-r3',uno),('arduino-nano-classic',nano),('arduino-mega-2560-r3',mega)]:
        board=make(); path=ROOT/f'{name}.kicad_pcb'; pcbnew.SaveBoard(str(path),board); print(f'{path}: {len(board.GetFootprints())} footprints')
