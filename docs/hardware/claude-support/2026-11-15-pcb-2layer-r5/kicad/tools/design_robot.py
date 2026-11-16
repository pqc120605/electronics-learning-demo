# -*- coding: utf-8 -*-
"""MoBot robot EVT0 r3 — netlist + placement. Nguồn: 02-tai-lieu-thiet-ke.md (r3), giá trị nguồn theo r7."""
R0603 = "Resistor_SMD:R_0603_1608Metric"
R1206 = "Resistor_SMD:R_1206_3216Metric"
C0603 = "Capacitor_SMD:C_0603_1608Metric"
C0805 = "Capacitor_SMD:C_0805_2012Metric"
LED = "LED_SMD:LED_0603_1608Metric"
SOT23 = "Package_TO_SOT_SMD:SOT-23"
SOCK15 = "Connector_PinSocket_2.54mm:PinSocket_1x15_P2.54mm_Vertical"
XH2 = "Connector_JST:JST_XH_B2B-XH-A_1x02_P2.50mm_Vertical"
PH2 = "Connector_JST:JST_PH_B2B-PH-K_1x02_P2.00mm_Vertical"
USBC = "Connector_USB:USB_C_Receptacle_GCT_USB4105-xx-A_16P_TopMnt_Horizontal"
TP = "TestPoint:TestPoint_Pad_D1.5mm"
HOLE = "MountingHole:MountingHole_3.2mm_M3"
PARTS = []


def P(ref, value, fp, nets, block, names=None, mpn="", dnp=False, nobom=False):
    PARTS.append(dict(ref=ref, value=value, fp=fp, nets={str(k): v for k, v in nets.items()}, block=block,
                      names={str(k): v for k, v in (names or {}).items()}, mpn=mpn, dnp=dnp, nobom=nobom))


def R(ref, val, a, b, block, dnp=False, fp=R0603):
    P(ref, val, fp, {1: a, 2: b}, block, dnp=dnp)


def C(ref, val, a, b, block, fp=C0603, dnp=False):
    P(ref, val, fp, {1: a, 2: b}, block, dnp=dnp)


B1 = "1 Pack 2S, bảo vệ vào"
B2 = "2 Sạc BQ25886 (J_CHG)"
B3 = "3 UVLO + khóa khi sạc"
B4 = "4 Buck 5V, buck 3V3"
B5 = "5 Buck-boost 6V motor"
B6 = "6 DRV8833 + khóa motor"
B7 = "7 Nguồn USB-C cho DevKit (J_SRC)"
B8 = "8 ESP32 DevKit (socket)"
B9 = "9 Cảm biến, âm thanh, đo pin"
B10 = "10 Cơ khí, điểm thử"
MOSN = {1: "G", 2: "S", 3: "D"}

# 1 — r5 (F01): khoi chong dao cuc hai chieu bao ca BAT U7 va tai. PLAN.md muc 4a, phuong an A.
# QA/QB: PFET doi dau chung source; QD do cuc tinh ngay tai dau pack (VPK so voi J3.2/GND).
P("J3", "Pack 2S", XH2, {1: "VPACK_RAW", 2: "GND"}, B1, {1: "+", 2: "-"}, mpn="B2B-XH-A")
P("F1", "PTC 2.5A", "Fuse:Fuse_1812_4532Metric", {1: "VPACK_RAW", 2: "VPK"}, B1, mpn="MF-MSMF250/16X")
MOSP = {1: "G", 2: "S", 3: "D"}
P("QA", "PFET >=20V TBD", SOT23, {1: "RP_G", 2: "RP_S", 3: "VPK"}, B1, MOSP, mpn="TBD")
P("QB", "PFET >=20V TBD", SOT23, {1: "RP_G", 2: "RP_S", 3: "VBAT_PROT"}, B1, MOSP, mpn="TBD")
R("R1", "100k", "RP_S", "RP_G", B1)          # RGS: gate ve source chung khi QD tat
R("R2", "100k", "RP_G", "QD_D", B1)          # RG: VGS = -Vs/2 khi QD dan (gioi han VGS, TBD theo MPN)
P("QD", "2N7002", SOT23, {1: "QD_G", 2: "GND", 3: "QD_D"}, B1, MOSN, mpn="2N7002")
R("R57", "100k 1%", "VPK", "QD_G", B1)       # RD1, nguong ~ Vth(QD)*2 — chot o tinh toan
R("R58", "100k 1%", "QD_G", "GND", B1)       # RD2
P("J15", "SW1 (cong tac roi >=3A)", XH2, {1: "VBAT_PROT", 2: "VBAT_SW"}, B1, {1: "IN", 2: "OUT"}, mpn="B2B-XH-A")

# 2 charger
USBG = {"A1": "GND", "A12": "GND", "B1": "GND", "B12": "GND", "SH": "GND"}
n = dict(USBG); n.update({"A4": "VBUS_CHG", "A9": "VBUS_CHG", "B4": "VBUS_CHG", "B9": "VBUS_CHG", "A5": "CHG_CC1", "B5": "CHG_CC2",
                          "A6": "CHG_DP", "B6": "CHG_DP", "A7": "CHG_DM", "B7": "CHG_DM"})
P("J4", "USB-C SAC", USBC, n, B2, {"A5": "CC1", "B5": "CC2", "A4": "VBUS", "A1": "GND", "A6": "D+", "A7": "D-", "SH": "SHIELD"}, mpn="USB4105-GF-A")
R("R3", "5.1k", "CHG_CC1", "GND", B2)
R("R4", "5.1k", "CHG_CC2", "GND", B2)
P("U7", "BQ25886", "Package_DFN_QFN:VQFN-24-1EP_4x4mm_P0.5mm_EP2.45x2.45mm",
  {1: "CHG_DM", 2: "STAT_K", 3: "CE_N", 4: "GND", 5: "GND", 7: "TS_NET", 8: "ILIM_C", 10: "ICHG_C", 11: "REGN", 12: "BTST",
   13: "VBAT_PROT", 14: "VBAT_PROT", 15: "SYS_CHG", 16: "SYS_CHG", 17: "SW_CHG", 18: "SW_CHG", 19: "GND", 20: "GND", 21: "PMID",
   22: "PMID", 23: "VBUS_CHG", 24: "CHG_DP", 25: "GND"}, B2,
  {1: "D-", 2: "STAT", 3: "CE", 4: "GND", 5: "OTG", 6: "VSET", 7: "TS", 8: "ILIM", 9: "PG", 10: "ICHGSET", 11: "REGN", 12: "BTST",
   13: "BAT", 14: "BAT", 15: "SYS", 16: "SYS", 17: "SW", 18: "SW", 19: "GND", 20: "GND", 21: "PMID", 22: "PMID", 23: "VBUS",
   24: "D+", 25: "EP"}, mpn="BQ25886RGER")
P("L2", "1uH", "Inductor_SMD:L_Vishay_IHLP-2525", {1: "PMID", 2: "SW_CHG"}, B2, mpn="IHLP2525CZER1R0M01")
C("C1", "1u 16V", "VBUS_CHG", "GND", B2)
C("C2", "10u 16V", "PMID", "GND", B2, C0805)
C("C3", "22u 16V", "SYS_CHG", "GND", B2, C0805)
C("C4", "22u 16V", "SYS_CHG", "GND", B2, C0805)
C("C5", "10u 16V", "VBAT_PROT", "GND", B2, C0805)
C("C6", "10u 16V", "VBAT_PROT", "GND", B2, C0805)
C("C7", "47n", "BTST", "SW_CHG", B2)
C("C8", "4.7u", "REGN", "GND", B2)
R("R5", "1.24k 1%", "ILIM_C", "GND", B2)
R("R6", "1.91k 1%", "ICHG_C", "GND", B2)
R("R7", "9.53k 1%", "REGN", "TS_NET", B2)
R("R8", "511k 1%", "TS_NET", "GND", B2)
P("J13", "NTC 10k (103AT-2)", PH2, {1: "TS_NET", 2: "GND"}, B2, mpn="B2B-PH-K-S")
R("R9", "10k", "CE_N", "GND", B2)
R("R10", "2.2k", "VBUS_CHG", "STAT_A", B2)
P("D5", "LED sac", LED, {1: "STAT_K", 2: "STAT_A"}, B2, {1: "K", 2: "A"})

# 3 UVLO
P("U1", "TLV6710", "Package_TO_SOT_SMD:TSOT-23-6", {1: "EN_NODE", 2: "GND", 3: "UV2_DIV", 4: "GND", 5: "VBAT_SW"}, B3,
  {1: "OUTA", 2: "GND", 3: "INA", 4: "INB", 5: "VDD", 6: "OUTB"}, mpn="TLV6710DDCR")
R("R13", "180k 0.1%", "VBAT_SW", "UV2_DIV", B3)
R("R14", "11.1k 0.1%", "UV2_DIV", "GND", B3)
R("R15", "2.84M 0.1%", "VBAT_SW", "UV2_SW", B3)
P("Q2", "DMN2075U", SOT23, {1: "EN_NODE", 2: "UV2_DIV", 3: "UV2_SW"}, B3, MOSN, mpn="DMN2075U-7")
R("R16", "100k", "VBAT_SW", "EN_NODE", B3)
R("R17", "68k", "EN_NODE", "GND", B3)
C("C9", "100n 16V", "VBAT_SW", "GND", B3)
R("R11", "100k", "VBUS_CHG", "CHG_SNS", B3)
R("R12", "100k", "CHG_SNS", "GND", B3)
P("Q5", "2N7002", SOT23, {1: "CHG_SNS", 2: "GND", 3: "EN_NODE"}, B3, MOSN, mpn="2N7002")

# 4 bucks
P("U2", "TPS54302", "Package_TO_SOT_SMD:SOT-23-6", {1: "GND", 2: "SW_5V", 3: "VBAT_SW", 4: "FB_5V", 5: "EN_NODE", 6: "BOOT_5V"}, B4,
  {1: "GND", 2: "SW", 3: "VIN", 4: "FB", 5: "EN", 6: "BOOT"}, mpn="TPS54302DDCR")
P("L1", "10uH 2A", "Inductor_SMD:L_Taiyo-Yuden_NR-50xx", {1: "SW_5V", 2: "V5"}, B4)
R("R18", "100k 1%", "V5", "FB_5V", B4)
R("R19", "13.3k 1%", "FB_5V", "GND", B4)
C("C10", "10u 25V", "VBAT_SW", "GND", B4, C0805)
C("C11", "22u 10V", "V5", "GND", B4, C0805)
C("C12", "22u 10V", "V5", "GND", B4, C0805)
C("C13", "100n", "BOOT_5V", "SW_5V", B4)
P("U4", "TLV62569", "Package_TO_SOT_SMD:SOT-23-5", {1: "V5", 2: "GND", 3: "SW_3V3", 4: "V5", 5: "FB_3V3"}, B4,
  {1: "EN", 2: "GND", 3: "SW", 4: "VIN", 5: "FB"}, mpn="TLV62569DBVR")
P("L3", "2.2uH 2.5A", "Inductor_SMD:L_Changjiang_FNR4030S", {1: "SW_3V3", 2: "V3V3_C"}, B4)
R("R20", "453k 1%", "V3V3_C", "FB_3V3", B4)
R("R21", "100k 1%", "FB_3V3", "GND", B4)
C("C14", "4.7u 10V", "V5", "GND", B4, C0805)
C("C15", "10u 10V", "V3V3_C", "GND", B4, C0805)
R("R56", "2.2k", "V5", "PWR_A", B4)
P("D2", "LED nguon", LED, {1: "GND", 2: "PWR_A"}, B4, {1: "K", 2: "A"})

# 5 TPS63070
P("U8", "TPS63070", "mobot:Texas_RNM0015A_VQFN-15_2.5x3mm",
  {1: "PS_SYNC", 3: "VAUX", 4: "GND", 5: "FB_6V", 7: "VM_6V", 8: "VM_6V", 9: "L4_B", 10: "GND", 11: "L4_A",
   12: "VBAT_SW", 13: "VBAT_SW", 14: "MOTOR_EN", 15: "GND"}, B5,
  {1: "PS/SYNC", 2: "PG", 3: "VAUX", 4: "GND", 5: "FB", 6: "FB2", 7: "VOUT", 8: "VOUT", 9: "L2", 10: "PGND", 11: "L1",
   12: "VIN", 13: "VIN", 14: "EN", 15: "VSEL"}, mpn="TPS63070RNMR")
P("L4", "1.5uH", "Inductor_SMD:L_Changjiang_FNR4020S", {1: "L4_A", 2: "L4_B"}, B5, mpn="XFL4020-152ME")
R("R22", "649k 1%", "VM_6V", "FB_6V", B5)
R("R23", "100k 1%", "FB_6V", "GND", B5)
R("R24", "10k", "PS_SYNC", "VBAT_SW", B5)  # F06: TPS63070 SLVSC58B §11.1 tr.32; lap loai tru voi R25
R("R25", "0R (loai tru R24)", "PS_SYNC", "GND", B5, dnp=True)
C("C16", "10u 25V", "VBAT_SW", "GND", B5, C0805)
C("C17", "10u 25V", "VBAT_SW", "GND", B5, C0805)
C("C18", "22u 16V", "VM_6V", "GND", B5, C0805)
C("C19", "22u 16V", "VM_6V", "GND", B5, C0805)
C("C20", "22u 16V", "VM_6V", "GND", B5, C0805)
C("C21", "100n", "VAUX", "GND", B5)
P("C22", "220u 16V polymer", "Capacitor_SMD:CP_Elec_8x10", {1: "VM_6V", 2: "GND"}, B5, {1: "+", 2: "-"})
P("D1", "TVS TBD (du phong d2)", "Diode_SMD:D_SMA", {1: "VM_6V", 2: "GND"}, B5, {1: "K", 2: "A"}, mpn="TBD", dnp=True)
# F02 (d1): clamp chu dong. Nguong/R/Q chua chot: thieu motor, quan tinh, braking profile (PLAN 4d).
P("U9", "Comparator+ref TBD", "Package_TO_SOT_SMD:TSOT-23-6", {1: "CLMP_G", 2: "GND", 3: "CLMP_DIV", 4: "GND", 5: "VM_6V"}, B5,
  {1: "OUTA", 2: "GND", 3: "INA", 4: "INB", 5: "VDD", 6: "OUTB"}, mpn="TBD")
R("R59", "TBD", "VM_6V", "CLMP_DIV", B5)
R("R60", "TBD", "CLMP_DIV", "GND", B5)
R("R61", "100k", "VM_6V", "CLMP_G", B5)
P("Q6", "NFET clamp TBD", SOT23, {1: "CLMP_G", 2: "GND", 3: "CLMP_D"}, B5, MOSN, mpn="TBD")
R("R62", "TBD (xa nang luong)", "VM_6V", "CLMP_D", B5, fp="Resistor_SMD:R_2512_6332Metric")

# 6 DRV8833
P("U5", "SN74LVC1G08", "Package_TO_SOT_SMD:SOT-23-5", {1: "MOT_EN", 2: "V3V3_C", 3: "GND", 4: "MOTOR_EN", 5: "V3V3_C"}, B6,
  {1: "A", 2: "B", 3: "GND", 4: "Y", 5: "VCC"}, mpn="SN74LVC1G08DBVR")
R("R26", "100k", "MOT_EN", "GND", B6)
R("R54", "100k", "MOTOR_EN", "GND", B6)
R("R55", "1k", "MOT_G", "MOT_EN", B6)
C("C23", "100n", "V3V3_C", "GND", B6)
P("U6", "DRV8833", "Package_SO:HTSSOP-16-1EP_4.4x5mm_P0.65mm_EP3.4x5mm_Mask2.46x2.31mm",
  {1: "MOTOR_EN", 2: "MA1", 3: "ISEN_A", 4: "MA2", 5: "MB2", 6: "ISEN_B", 7: "MB1", 8: "NFAULT", 9: "BIN1_D", 10: "BIN2_D",
   11: "VCP", 12: "VM_6V", 13: "GND", 14: "VINT", 15: "AIN2_D", 16: "AIN1_D", 17: "GND"}, B6,
  {1: "nSLEEP", 2: "AOUT1", 3: "AISEN", 4: "AOUT2", 5: "BOUT2", 6: "BISEN", 7: "BOUT1", 8: "nFAULT", 9: "BIN1", 10: "BIN2",
   11: "VCP", 12: "VM", 13: "GND", 14: "VINT", 15: "AIN2", 16: "AIN1", 17: "EP"}, mpn="DRV8833PWPR")
R("R27", "0.62R 1% 0.25W", "ISEN_A", "GND", B6, fp=R1206)
R("R28", "0.62R 1% 0.25W", "ISEN_B", "GND", B6, fp=R1206)
C("C24", "10n 16V", "VCP", "VM_6V", B6)
C("C25", "2.2u", "VINT", "GND", B6)
C("C26", "10u 25V", "VM_6V", "GND", B6, C0805)
P("D3", "Schottky", "Diode_SMD:D_SOD-323", {1: "ISEN_A", 2: "GND"}, B6, {1: "K", 2: "A"}, dnp=True)
P("D4", "Schottky", "Diode_SMD:D_SOD-323", {1: "ISEN_B", 2: "GND"}, B6, {1: "K", 2: "A"}, dnp=True)
R("R29", "10k", "ISEN_A", "ISA_ADC", B6)
C("C27", "100n", "ISA_ADC", "GND", B6)
R("R30", "10k", "ISEN_B", "ISB_ADC", B6)
C("C28", "100n", "ISB_ADC", "GND", B6)
R("R31", "10k", "NFAULT", "V3V3_C", B6)
R("R37", "1k", "NFAULT", "NFAULT_G", B6)
for i, s in enumerate(("AIN1", "AIN2", "BIN1", "BIN2")):
    R("R%d" % (38 + i), "1k", s + "_G", s + "_D", B6)
P("J6", "Motor A", XH2, {1: "MA2", 2: "MA1"}, B6, mpn="B2B-XH-A")
P("J7", "Motor B", XH2, {1: "MB2", 2: "MB1"}  # r5: dao chan de MB1/MB2 khong cat nhau; chieu motor dinh nghia trong firmware
  , B6, mpn="B2B-XH-A")

# 7 USB source
P("U3", "TPS2553", "Package_TO_SOT_SMD:SOT-23-6", {1: "V5", 2: "GND", 3: "SRC_EN", 5: "ILIM_S", 6: "VBUS_OUT"}, B7,
  {1: "IN", 2: "GND", 3: "EN", 4: "FAULT", 5: "ILIM", 6: "OUT"}, mpn="TPS2553DBVR")
R("R32", "39.2k 1%", "ILIM_S", "GND", B7)
C("C29", "1u", "V5", "GND", B7)
C("C30", "10u 10V", "VBUS_OUT", "GND", B7, C0805)
R("R36", "4.7k", "VBUS_OUT", "GND", B7)
# F07 (c3): o USB-A, khong co CC; bo Q3/Q4/R33/R34/JP1. EN tre bang R35/C31.
R("R35", "470k", "V5", "SRC_EN", B7)
C("C31", "1u", "SRC_EN", "GND", B7)
P("J5", "USB-A -> ESP32 (cap A->DevKit)", "Connector_USB:USB_A_Molex_67643_Horizontal",
  {1: "VBUS_OUT", 4: "GND", "SH": "GND"}, B7, {1: "VBUS", 2: "D-", 3: "D+", 4: "GND", "SH": "SHIELD"}, mpn="Molex 67643 (suffix TBD)")

# 8 DevKit
LEFT = ["VIN", "GND", "D13", "D12", "D14", "D27", "D26", "D25", "D33", "D32", "D35", "D34", "VN", "VP", "EN"]
RIGHT = ["3V3", "GND", "D15", "D2", "D4", "RX2", "TX2", "D5", "D18", "D19", "D21", "RX0", "TX0", "D22", "D23"]
NETL = {"GND": "GND", "D13": "MOT_G", "D14": "NFAULT_G", "D27": "DIN_G", "D26": "BCLK_G", "D25": "LRCLK_G", "D33": "VBAT_ADC",
        "D32": "IR2_G", "D35": "IR1_G", "D34": "ECHO_G", "VN": "ISB_ADC", "VP": "ISA_ADC"}
NETR = {"GND": "GND", "RX2": "AIN1_G", "TX2": "AIN2_G", "D18": "BIN1_G", "D19": "BIN2_G", "D21": "SDA_G", "D22": "SCL_G", "D23": "TRIG_G"}
P("J1", "DevKit hang trai", SOCK15, {i + 1: NETL[x] for i, x in enumerate(LEFT) if x in NETL}, B8, {i + 1: x for i, x in enumerate(LEFT)})
P("J2", "DevKit hang phai (25.40 mm)", SOCK15,
  {i + 1: NETR[x] for i, x in enumerate(RIGHT) if x in NETR}, B8, {i + 1: x for i, x in enumerate(RIGHT)})

# 9 sensors
S4 = "Connector_PinSocket_2.54mm:PinSocket_1x04_P2.54mm_Vertical"
P("J8", "OLED SSD1306", S4, {1: "GND", 2: "V3V3_C", 3: "SCL", 4: "SDA"}, B9, {1: "GND", 2: "VCC", 3: "SCL", 4: "SDA"})
R("R48", "100", "SDA_G", "SDA", B9)
R("R49", "100", "SCL_G", "SCL", B9)
P("J9", "HC-SR04", S4, {1: "V5", 2: "US_TRIG", 3: "US_ECHO", 4: "GND"}, B9, {1: "VCC", 2: "TRIG", 3: "ECHO", 4: "GND"})
R("R45", "1k", "TRIG_G", "US_TRIG", B9)
R("R50", "10k", "US_ECHO", "ECHO_G", B9)
R("R51", "20k", "ECHO_G", "GND", B9)
H3 = "Connector_PinHeader_2.54mm:PinHeader_1x03_P2.54mm_Vertical"
P("J10", "TCRT5000 #1", H3, {1: "V3V3_C", 2: "GND", 3: "IR1"}, B9, {1: "VCC", 2: "GND", 3: "DO"})
P("J11", "TCRT5000 #2", H3, {1: "V3V3_C", 2: "GND", 3: "IR2"}, B9, {1: "VCC", 2: "GND", 3: "DO"})
R("R46", "1k", "IR1", "IR1_G", B9)
R("R47", "1k", "IR2", "IR2_G", B9)
P("J12", "Module MAX98357A", "Connector_PinSocket_2.54mm:PinSocket_1x07_P2.54mm_Vertical",
  {1: "I2S_LRCLK", 2: "I2S_BCLK", 3: "I2S_DIN", 6: "GND", 7: "V5"}, B9,
  {1: "LRC", 2: "BCLK", 3: "DIN", 4: "GAIN", 5: "SD", 6: "GND", 7: "VIN"})
R("R42", "1k", "BCLK_G", "I2S_BCLK", B9)
R("R43", "1k", "LRCLK_G", "I2S_LRCLK", B9)
R("R44", "1k", "DIN_G", "I2S_DIN", B9)
R("R52", "100k 1%", "VBAT_SW", "VBAT_ADC", B9)
R("R53", "27k 1%", "VBAT_ADC", "GND", B9)
C("C32", "100n", "VBAT_ADC", "GND", B9)

# 10
for i, x in enumerate(("VBAT_PROT", "VBAT_SW", "EN_NODE", "V5", "V3V3_C", "VM_6V", "VBUS_OUT", "MOTOR_EN", "GND")):
    P("TP%d" % (i + 1), x, TP, {1: x}, B10, nobom=True)
for i in range(4):
    P("H%d" % (i + 1), "M3", HOLE, {}, B10, nobom=True)

# Bo cuc r5 (PLAN.md muc 2.1, nguyen tac T1-T8 ME4169): luong nguon mot chieu tu mep duoi-trai,
# moi IC nguon la mot CELL (IC co dinh, ve tinh dat theo khoang cach pad cung net nho nhat, khong chong courtyard).
W, H = 100.0, 80.0
XL = 40.00
FIXED = {
    "H1": (3.5, 3.5, 0), "H2": (96.5, 3.5, 0), "H3": (3.5, 76.5, 0), "H4": (96.5, 76.5, 0),
    "J1": (XL, 53.05, 180), "J2": (XL + 25.40, 53.05, 180),
    "J10": (10.0, 4.5, 90), "J11": (20.0, 4.5, 90), "J12": (30.5, 18.0, 0),
    "J9": (71.2, 4.5, 90), "J8": (82.8, 4.5, 90),
    "J6": (91.5, 28.0, 0), "J7": (91.5, 20.0, 0),   # r5: J7 (B) tren vi BOUT o phia tren U6 xoay 180; J6 (A) duoi
    "J4": (13.0, 75.6, 0), "J3": (23.5, 74.5, 0), "J15": (33.5, 74.5, 0), "J5": (44.0, 66.5, 0),
    "J13": (2.5, 69.0, 0),
}
CELLS = [
    # BQ25886 SLUSD88A §11 tr.31-32: tu PMID/VBUS sat chan, vong SW-L-PMID ngan, BTST sat chan, BAT/SYS sat chan
    dict(ic="U7", at=(11.0, 57.0, 0), r=9.0, parts=[("C2", "21"), ("C1", "23"), ("C3", "15"), ("C4", "16"), ("C5", "13"), ("C6", "14"), "L2", ("C7", "12"), ("R5", "8"), ("R6", "10"), ("C8", "11"), ("R8", "7"), "R7", "R9", "R10", "D5"]),
    # TPS54302: Cin sat VIN-GND, Cboot sat BOOT-SW, FB xa SW
    dict(ic="U2", at=(10.0, 21.5, 0), r=7.0, parts=[("C10", "3"), ("C13", "6"), "L1", "C11", "C12", "R19", "R18"]),
    # TLV62569
    dict(ic="U4", at=(10.0, 35.0, 0), r=6.5, parts=[("C14", "4"), "L3", "C15", "R21", "R20"]),
    # TPS63070 SLVSC58B §11: Cin/Cout sat chan, L4 ngan, VAUX sat chan
    dict(ic="U8", at=(76.0, 63.0, 0), r=7.5, parts=[("C16", "12"), "C17", ("C21", "3"), "L4", "C18", "C19", "C20", "R23", "R22", "R24", "R25"]),
    # DRV8833 SLVSAR1E tr.15: C VM, VCP, VINT sat chan; shunt sat AISEN/BISEN (F08)
    dict(ic="U6", at=(78.0, 26.0, 180), r=7.0, parts=[("C26", "12"), ("C24", "11"), ("C25", "14"), ("R27", "3"), ("R28", "6"), "D3", "D4"]),
    # TPS2553: Cin sat IN
    dict(ic="U3", at=(61.0, 63.0, 0), r=5.5, parts=[("C29", "1"), "C30", "R32", "R35", "C31", "R36"]),
]
REGIONS = [
    (2.0, 64.0, 18.0, 72.0, ["R3", "R4"], 0.5),
    (15.0, 59.0, 38.0, 71.0, ["F1", "QA", "QB", "QD", "R1", "R2", "R57", "R58"], 0.5),
    (2.0, 40.0, 30.0, 49.0, ["U1", "R13", "R14", "R15", "Q2", "R16", "R17", "C9", "R11", "R12", "Q5", "R56", "D2"], 0.5),
    (31.0, 17.0, 38.6, 57.0, ["R29", "C27", "R30", "C28", "R42", "R43", "R44", "R46", "R47", "R50", "R51", "R52", "R53", "C32"], 0.5),
    (66.5, 32.0, 90.0, 44.0, ["U5", "C23", "R26", "R54", "R55", "R31", "R37", "R38", "R39", "R40", "R41"], 0.5),
    (80.0, 38.0, 99.0, 56.0, ["C22", "Q6", "R62", "U9", "R59", "R60", "R61", "D1"], 0.5),
    (66.5, 44.0, 80.0, 56.0, ["TP1", "TP2", "TP3", "TP4", "TP5", "TP6", "TP7", "TP8", "TP9"], 0.5),
    (68.0, 8.5, 95.0, 15.0, ["R45", "R48", "R49"], 0.5),
]
DESIGN = dict(
    title="MoBot robot EVT0 r5", rev="r5", paper="A0", size=(W, H), clearance=0.15, parts=PARTS,
    fixed=FIXED, cells=CELLS, regions=REGIONS, keepout=[(36.0, 0.0, 70.0, 15.0)],
    part_keepout=[(41.8, 15.0, 63.6, 57.0)],   # duoi than DevKit giua hai hang socket: khong dat linh kien (stack height, probe)
    # F04: BQ25886 EP 2,45x2,45 -> 3x3 via 0,3/0,6 buoc 0,9; DRV8833 EP 3,4x5 -> 3x4 buoc 1,0. Ly do o 04-ket-qua-r5.md
    ep_vias=[("U7", "25", 3, 3, 0.9), ("U6", "17", 3, 4, 1.0)],
    b_track_keepout=[(9.4, 55.4, 12.6, 58.6), (75.9, 23.1, 80.1, 28.9)],
    pwr_flags=["GND", "VBUS_CHG", "VBAT_SW", "V5", "V3V3_C"],
    netclass={"VPACK_RAW": "w", "VPK": "w", "RP_S": "w", "VBAT_PROT": "w", "CLMP_D": "w", "ISEN_A": "m", "ISEN_B": "m", "VBAT_SW": "w", "VM_6V": "w",
              "V5": "m", "V3V3_C": "m", "VBUS_CHG": "m", "PMID": "m", "SW_CHG": "m", "SYS_CHG": "m", "SW_5V": "m",
              "SW_3V3": "m", "L4_A": "m", "L4_B": "m", "MA1": "m", "MA2": "m", "MB1": "m", "MB2": "m", "VBUS_OUT": "m"},
    silk=[("MoBot ROBOT EVT0 r5", 75.0, 78.5, 1.0), ("ANTEN - CAM DONG", 53.0, 7.5, 1.2), ("SAC", 13.0, 70.8, 1.0),
          ("RA->ESP32", 46.0, 71.0, 0.9), ("PACK 2S", 24.5, 71.0, 0.9), ("SW", 34.5, 71.0, 0.9)],
)
