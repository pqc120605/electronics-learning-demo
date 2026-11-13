# -*- coding: utf-8 -*-
"""MoBot tay cầm EVT0 r3 — netlist + placement. Nguồn: 02-tai-lieu-thiet-ke.md (r3)."""
R0603 = "Resistor_SMD:R_0603_1608Metric"
C0603 = "Capacitor_SMD:C_0603_1608Metric"
C0805 = "Capacitor_SMD:C_0805_2012Metric"
LED = "LED_SMD:LED_0603_1608Metric"
SOT23 = "Package_TO_SOT_SMD:SOT-23"
SOCK15 = "Connector_PinSocket_2.54mm:PinSocket_1x15_P2.54mm_Vertical"
XH2 = "Connector_JST:JST_XH_B2B-XH-A_1x02_P2.50mm_Vertical"
PH2 = "Connector_JST:JST_PH_B2B-PH-K_1x02_P2.00mm_Vertical"
BTN = "Button_Switch_THT:SW_PUSH_6mm"
TP = "TestPoint:TestPoint_Pad_D1.5mm"
HOLE = "MountingHole:MountingHole_3.2mm_M3"

PARTS = []


def P(ref, value, fp, nets, block, names=None, mpn="", dnp=False, nobom=False):
    PARTS.append(dict(ref=ref, value=value, fp=fp, nets={str(k): v for k, v in nets.items()}, block=block,
                      names={str(k): v for k, v in (names or {}).items()}, mpn=mpn, dnp=dnp, nobom=nobom))


def R(ref, val, a, b, block, dnp=False):
    P(ref, val, R0603, {1: a, 2: b}, block, dnp=dnp)


def C(ref, val, a, b, block, fp=C0603, dnp=False):
    P(ref, val, fp, {1: a, 2: b}, block, dnp=dnp)


B1 = "1 Nguồn vào 3xAA"
B2 = "2 Buck-boost 3V3 + UVLO"
B3 = "3 Hạn dòng, chặn ngược -> 3V3 DevKit"
B4 = "4 ESP32 DevKit (socket) + UART"
B5 = "5 Joystick, nút, đo pin"
B6 = "6 LiPo + sạc BQ24072 (DNP ở EVT0)"
B7 = "7 Cơ khí, điểm thử"

# ---- 1 nguồn vào
P("J3", "3xAA", XH2, {1: "VBAT_RAW", 2: "GND"}, B1, {1: "+", 2: "-"}, mpn="B2B-XH-A")
P("F1", "PTC 2A", "Fuse:Fuse_1812_4532Metric", {1: "VBAT_RAW", 2: "VBAT_F"}, B1, mpn="MF-MSMF200/8X")
P("Q1", "DMG2305UX", SOT23, {1: "Q1_G", 2: "VAA", 3: "VBAT_F"}, B1, {1: "G", 2: "S", 3: "D"}, mpn="DMG2305UX-7")
R("R1", "100k", "Q1_G", "GND", B1)
P("JP2", "AA|LiPo", "Jumper:SolderJumper-3_P1.3mm_Bridged12_RoundedPad1.0x1.5mm",
  {1: "VAA", 2: "VSYS_IN", 3: "LIPO_OUT"}, B1, {1: "AA", 2: "COM", 3: "LIPO"}, nobom=True)
P("J9", "SW1 (cong tac roi >=2A)", XH2, {1: "VSYS_IN", 2: "VBAT_SW"}, B1, {1: "IN", 2: "OUT"}, mpn="B2B-XH-A")

# ---- 2 buck-boost + UVLO
P("U1", "TPS631000", "Package_TO_SOT_SMD:SOT-583-8",
  {1: "V3V3_BB", 2: "LX2", 3: "LX1", 4: "VBAT_SW", 5: "EN_BB", 6: "GND", 7: "GND", 8: "FB_BB"}, B2,
  {1: "VOUT", 2: "LX2", 3: "LX1", 4: "VIN", 5: "EN", 6: "MODE", 7: "GND", 8: "FB"}, mpn="TPS631000DRLR")
P("L1", "1uH 3.5A", "Inductor_SMD:L_Changjiang_FNR4030S", {1: "LX1", 2: "LX2"}, B2, mpn="XEL4030-102ME")
C("C1", "10u 10V", "VBAT_SW", "GND", B2, C0805)
C("C2", "22u 10V", "V3V3_BB", "GND", B2, C0805)
C("C3", "22u 10V", "V3V3_BB", "GND", B2, C0805)
R("R2", "576k 1%", "V3V3_BB", "FB_BB", B2)
R("R3", "100k 1%", "FB_BB", "GND", B2)
P("U2", "TLV6710", "Package_TO_SOT_SMD:TSOT-23-6",
  {1: "EN_BB", 2: "GND", 3: "UV_DIV", 4: "GND", 5: "VBAT_SW"}, B2,
  {1: "OUTA", 2: "GND", 3: "INA", 4: "INB", 5: "VDD", 6: "OUTB"}, mpn="TLV6710DDCR")
R("R4", "71.5k 0.1%", "VBAT_SW", "UV_DIV", B2)
R("R5", "10.2k 0.1%", "UV_DIV", "GND", B2)
C("C4", "100n", "VBAT_SW", "GND", B2)
R("R7", "470k", "VBAT_SW", "EN_BB", B2)
C("C5", "1u", "EN_BB", "GND", B2)
P("Q2", "DMN2075U", SOT23, {1: "EN_BB", 2: "UV_DIV", 3: "UV_HYS"}, B2, {1: "G", 2: "S", 3: "D"}, mpn="DMN2075U-7", dnp=True)
R("R6", "1M 0.1%", "VBAT_SW", "UV_HYS", B2, dnp=True)
P("Q3", "DMG2305UX", SOT23, {1: "EN_BB", 2: "VBAT_SW", 3: "LOWBAT_D"}, B2, {1: "G", 2: "S", 3: "D"}, mpn="DMG2305UX-7")
R("R8", "1k", "LOWBAT_D", "LOWBAT_A", B2)
P("D1", "LED do (pin yeu)", LED, {1: "GND", 2: "LOWBAT_A"}, B2, {1: "K", 2: "A"})

# ---- 3 TPS2553
P("U3", "TPS2553", "Package_TO_SOT_SMD:SOT-23-6",
  {1: "V3V3_BB", 2: "GND", 3: "EN_SW", 5: "ILIM", 6: "V3V3_DEV"}, B3,
  {1: "IN", 2: "GND", 3: "EN", 4: "FAULT", 5: "ILIM", 6: "OUT"}, mpn="TPS2553DBVR")
R("R9", "39.2k 1%", "ILIM", "GND", B3)
R("R10", "10k", "V3V3_BB", "EN_SW", B3)
C("C6", "1u", "V3V3_BB", "GND", B3)
C("C7", "10u 10V", "V3V3_DEV", "GND", B3, C0805)
R("R14", "1k", "V3V3_DEV", "PWR_A", B3)
P("D2", "LED xanh (nguon)", LED, {1: "GND", 2: "PWR_A"}, B3, {1: "K", 2: "A"})

# ---- 4 DevKit
LEFT = ["VIN", "GND", "D13", "D12", "D14", "D27", "D26", "D25", "D33", "D32", "D35", "D34", "VN", "VP", "EN"]
RIGHT = ["3V3", "GND", "D15", "D2", "D4", "RX2", "TX2", "D5", "D18", "D19", "D21", "RX0", "TX0", "D22", "D23"]
NETL = {"GND": "GND", "D13": "L3_G", "D27": "B3_G", "D26": "B2_G", "D25": "B1_G", "D33": "R3_G", "D32": "VBAT_ADC",
        "D35": "JRY_G", "D34": "JRX_G", "VN": "JLY_G", "VP": "JLX_G", "EN": "ESP_EN"}
NETR = {"3V3": "V3V3_DEV", "GND": "GND", "D18": "B4_G", "D19": "B5_G", "RX0": "RX0_G", "TX0": "TX0_G", "D23": "B6_G"}
P("J1", "DevKit hang trai", SOCK15, {i + 1: NETL.get(n) for i, n in enumerate(LEFT) if NETL.get(n)}, B4,
  {i + 1: n for i, n in enumerate(LEFT)})
P("J2", "DevKit hang phai (3 vi tri)", "mobot:PinSocket_1x15_Alt3Rows_22.86_25.40_27.94",
  {i + 1: NETR[x] for i, x in enumerate(RIGHT) if x in NETR}, B4, {i + 1: x for i, x in enumerate(RIGHT)})
P("J5", "UART GND TX0 RX0 EN", "Connector_PinHeader_2.54mm:PinHeader_1x04_P2.54mm_Vertical",
  {1: "GND", 2: "TX0_H", 3: "RX0_H", 4: "ESP_EN"}, B4, {1: "GND", 2: "TX0", 3: "RX0", 4: "EN"})
R("R29", "100", "TX0_G", "TX0_H", B4)
R("R30", "100", "RX0_G", "RX0_H", B4)

# ---- 5 joystick, nút, đo pin
JOY = "Connector_PinHeader_2.54mm:PinHeader_1x05_P2.54mm_Vertical"
JN = {1: "GND", 2: "VCC", 3: "VRx", 4: "VRy", 5: "SW"}
P("J6", "Joystick trai (KY-023)", JOY, {1: "GND", 2: "V3V3_DEV", 3: "JLX", 4: "JLY", 5: "L3"}, B5, JN)
P("J7", "Joystick phai (KY-023)", JOY, {1: "GND", 2: "V3V3_DEV", 3: "JRX", 4: "JRY", 5: "R3"}, B5, JN)
for i, n in enumerate(("JLX", "JLY", "JRX", "JRY")):
    R("R%d" % (15 + i), "1k", n, n + "_G", B5)
    C("C%d" % (9 + i), "100n", n + "_G", "GND", B5)
R("R25", "1k", "L3", "L3_G", B5)
R("R26", "1k", "R3", "R3_G", B5)
for i in range(6):
    b = "B%d" % (i + 1)
    P("SW%d" % (i + 2), b, BTN, {1: b, 2: "GND"}, B5)
    R("R%d" % (19 + i), "1k", b, b + "_G", B5)
R("R27", "100k 1%", "VBAT_SW", "VBAT_ADC", B5)
R("R28", "100k 1%", "VBAT_ADC", "GND", B5)
C("C13", "100n", "VBAT_ADC", "GND", B5)

# ---- 6 LiPo DNP
USBN = {"A1": "GND", "A12": "GND", "B1": "GND", "B12": "GND", "SH": "GND", "A4": "VBUS_CHG", "A9": "VBUS_CHG",
        "B4": "VBUS_CHG", "B9": "VBUS_CHG", "A5": "CC1", "B5": "CC2"}
P("J4", "USB-C chi sac", "Connector_USB:USB_C_Receptacle_GCT_USB4105-xx-A_16P_TopMnt_Horizontal", USBN, B6,
  {"A5": "CC1", "B5": "CC2", "A4": "VBUS", "A1": "GND", "SH": "SHIELD"}, mpn="USB4105-GF-A", dnp=True)
R("R31", "5.1k", "CC1", "GND", B6, dnp=True)
R("R32", "5.1k", "CC2", "GND", B6, dnp=True)
P("U4", "BQ24072", "Package_DFN_QFN:VQFN-16-1EP_3x3mm_P0.5mm_EP1.68x1.68mm",
  {1: "TS_L", 2: "VLIPO", 3: "VLIPO", 4: "GND", 5: "GND", 6: "EN1_L", 7: "PG_L", 8: "GND", 9: "CHG_L", 10: "LIPO_OUT",
   11: "LIPO_OUT", 12: "ILIM_L", 13: "VBUS_CHG", 15: "GND", 16: "ISET_L", 17: "GND"}, B6,
  {1: "TS", 2: "BAT", 3: "BAT", 4: "CE", 5: "EN2", 6: "EN1", 7: "PGOOD", 8: "VSS", 9: "CHG", 10: "OUT", 11: "OUT",
   12: "ILIM", 13: "IN", 14: "TMR", 15: "TD", 16: "ISET", 17: "EP"}, mpn="BQ24072RGTR", dnp=True)
R("R33", "3.3k", "ISET_L", "GND", B6, dnp=True)
R("R34", "1.5k", "ILIM_L", "GND", B6, dnp=True)
R("R35", "10k", "TS_L", "GND", B6, dnp=True)
R("R36", "10k", "VBUS_CHG", "EN1_L", B6, dnp=True)
C("C14", "1u", "VBUS_CHG", "GND", B6, dnp=True)
C("C15", "4.7u", "VLIPO", "GND", B6, dnp=True)
C("C16", "4.7u", "LIPO_OUT", "GND", B6, dnp=True)
R("R37", "1k", "VBUS_CHG", "CHGLED_A", B6, dnp=True)
P("D3", "LED CHG", LED, {1: "CHG_L", 2: "CHGLED_A"}, B6, {1: "K", 2: "A"}, dnp=True)
R("R38", "1k", "VBUS_CHG", "PGLED_A", B6, dnp=True)
P("D4", "LED PGOOD", LED, {1: "PG_L", 2: "PGLED_A"}, B6, {1: "K", 2: "A"}, dnp=True)
P("J8", "LiPo 1S", PH2, {1: "VLIPO", 2: "GND"}, B6, {1: "+", 2: "-"}, mpn="B2B-PH-K-S", dnp=True)

# ---- 7 cơ khí
for i, n in enumerate(("VBAT_F", "VBAT_SW", "EN_BB", "V3V3_BB", "V3V3_DEV", "GND")):
    P("TP%d" % (i + 1), n, TP, {1: n}, B7, nobom=True)
for i in range(4):
    P("H%d" % (i + 1), "M3", HOLE, {}, B7, nobom=True)

W, H = 80.0, 66.0
XL = 27.30
FIXED = {
    "H1": (3.5, 3.5, 0), "H2": (76.5, 3.5, 0), "H3": (3.5, 62.5, 0), "H4": (76.5, 62.5, 0),
    "J1": (XL, 53.05, 180), "J2": (XL + 22.86, 53.05, 180),
    "J6": (5.0, 12.0, 90), "J7": (64.8, 12.0, 90),
    "SW2": (2.5, 30.0, 0), "SW3": (7.5, 39.5, 0), "SW4": (13.5, 30.0, 0),
    "SW5": (60.0, 30.0, 0), "SW6": (65.5, 39.5, 0), "SW7": (71.0, 30.0, 0),
    "J3": (4.0, 51.5, 0), "J9": (12.5, 60.0, 0),
    "J5": (61.0, 50.5, 90), "J8": (62.0, 57.0, 0),
    "J4": (40.0, 61.6, 0),
}
REGIONS = [
    (30.6, 17.2, 47.9, 31.8, ["U4", "C14", "C15", "C16", "R31", "R32", "R33", "R34", "R35", "R36", "R37", "D3", "R38", "D4", "Q2", "R6"], 0.7),
    (30.6, 32.3, 47.9, 58.3, ["U1", "L1", "C1", "C2", "C3", "R2", "R3", "U3", "C6", "C7", "R9", "R10",
                              "U2", "R4", "R5", "C4", "R7", "C5"], 0.7),
    (11.5, 45.5, 23.8, 58.5, ["F1", "Q1", "R1", "JP2", "Q3", "R8", "D1"], 0.6),
    (2.0, 18.0, 23.0, 27.5, ["R15", "C9", "R16", "C10", "R25", "R19", "R20", "R21"], 0.8),
    (58.5, 17.5, 78.5, 28.0, ["R17", "C11", "R18", "C12", "R26", "R22", "R23", "R24", "R27", "R28", "C13", "R29", "R30"], 0.9),
    (70.5, 50.5, 78.5, 58.5, ["R14", "D2"], 0.8),
    (20.0, 60.5, 33.0, 65.0, ["TP1", "TP2", "TP3"], 1.0),
    (47.5, 60.5, 60.0, 65.0, ["TP4", "TP5", "TP6"], 1.0),
]
DESIGN = dict(
    title="MoBot tay cầm EVT0 r3", rev="r3", paper="A1", size=(W, H), clearance=0.15, parts=PARTS,
    fixed=FIXED, regions=REGIONS, keepout=[(23.0, 0.0, 57.0, 15.0)],
    netclass={"VBAT_RAW": "w", "VBAT_F": "w", "VAA": "w", "VSYS_IN": "w", "VBAT_SW": "w",
              "V3V3_BB": "m", "V3V3_DEV": "m", "LX1": "m", "LX2": "m", "VBUS_CHG": "m", "VLIPO": "m", "LIPO_OUT": "m"},
    silk=[("MoBot HANDSET EVT0 r3", 40.0, 64.9, 1.0), ("ANTEN - CAM DONG", 40.0, 7.5, 1.2),
          ("GND TX0 RX0 EN", 66.0, 52.6, 0.8), ("3xAA", 6.0, 57.5, 1.0), ("SW", 15.0, 64.8, 1.0)],
)
