#!/usr/bin/env python3
"""MoBot V2 r7 - tinh lai doc lap 18 muc H-1..H-8, R-1..R-10 (worst-case).

Chi dung thu vien chuan. Chay: python calc_r7.py
Quy uoc: dien tro +/-1 % tru khi ghi khac; nguong IC lay min/max datasheet;
nhiet 0-40 C (cac bang TI dung TJ -40..125 C nen bao trum).
Moi thong so datasheet ghi nguon o comment canh gia tri.
"""
import math
from itertools import product

TOL_R = 0.01


def line(name, lo, nom, hi, unit="", nd=3, note=""):
    s = f"  {name}: min {lo:.{nd}f} / nom {nom:.{nd}f} / max {hi:.{nd}f} {unit}"
    if note:
        s += f"  [{note}]"
    print(s)


def head(t):
    print("\n" + "=" * 72 + "\n" + t + "\n" + "=" * 72)


def par(a, b):
    return a * b / (a + b)


def rtol(r, t=TOL_R):
    return (r * (1 - t), r * (1 + t))


def vout_fb(vref3, rtop, rbot, tol=TOL_R, ileak=0.0):
    """VOUT = VREF*(1+Rt/Rb) + Ileak*Rt. vref3=(min,nom,max). Tra ve (min, nom, max)."""
    nom = vref3[1] * (1 + rtop / rbot)
    vals = [vr * (1 + rt / rb) + il * rt
            for vr, rt, rb, il in product((vref3[0], vref3[2]), rtol(rtop, tol), rtol(rbot, tol), (-ileak, ileak))]
    return min(vals), nom, max(vals)


# ---------------- NTC 103AT ----------------
# Doi chieu: BQ25886 SLUSD88A 8.3.7.4 ghi RNTC(0 C)=27.28k, RNTC(60 C)=3.02k -> khop bang Semitec ben duoi.
B_0_25 = math.log(27.28 / 10.0) / (1 / 273.15 - 1 / 298.15)
B_25_60 = math.log(10.0 / 3.02) / (1 / 298.15 - 1 / 333.15)


# Bang R-T Semitec AT thermistor (103AT, kOhm), ban PDF hang luu tai static.chipdip.ru DOC021891763.
NTC_TABLE = [(-20, 67.77), (-15, 53.41), (-10, 42.47), (-5, 33.90), (0, 27.28), (5, 22.05), (10, 17.96), (15, 14.69), (20, 12.09),
             (25, 10.00), (30, 8.313), (35, 6.940), (40, 5.827), (45, 4.911), (50, 4.160), (55, 3.536),
             (60, 3.020), (65, 2.588), (70, 2.228), (75, 1.924), (80, 1.668), (85, 1.451), (90, 1.266)]


def ntc_r(tc):
    for (t0, r0), (t1, r1) in zip(NTC_TABLE, NTC_TABLE[1:]):
        if t0 <= tc <= t1:
            return math.exp(math.log(r0) + (math.log(r1) - math.log(r0)) * (tc - t0) / (t1 - t0))
    raise ValueError(tc)


def ntc_t(rk):
    for (t0, r0), (t1, r1) in zip(NTC_TABLE, NTC_TABLE[1:]):
        if r1 <= rk <= r0:
            return t0 + (t1 - t0) * (math.log(r0) - math.log(rk)) / (math.log(r0) - math.log(r1))
    return float("nan")


def ntc_t_tol(rk):
    """Nhiet do ung voi R do duoc khi NTC co dung sai +/-1 % (R25 va B) -> tra (min, max)."""
    return ntc_t(rk / 1.01), ntc_t(rk / 0.99)


def ntc_r_b3435(tc):
    return 10.0 * math.exp(3435 * (1 / (tc + 273.15) - 1 / 298.15))


# ======================================================================
def h1_tps61023():
    head("H-1 TPS61023 (SLVSF14B sec 6.5, 8.2)")
    vref = (0.580, 0.595, 0.610)  # VREF PWM mode, SLVSF14B 6.5
    lo, nom, hi = vout_fb(vref, 732e3, 100e3)
    line("VOUT 732k/100k", lo, nom, hi, "V", note="DeepSeek 4.742/4.950/5.165")
    print(f"  VOUT min < 4.75 V ? {lo < 4.75}  (DeepSeek ghi 'nam trong 4,75-5,25 V')")
    vout, iout = 5.0, 0.5
    for vin, eta, L, fsw in ((3.0, 0.8, 1.0e-6, 1.0e6), (3.0, 0.8, 0.7e-6, 1.0e6), (3.2, 0.8, 0.7e-6, 1.0e6)):
        il_dc = vout * iout / (vin * eta)                     # Eq 5
        d = 1 - vin * eta / vout                              # Eq 2 (co eta)
        dil = vin * d / (L * fsw)                             # Eq 6
        pk, val = il_dc + dil / 2, il_dc - dil / 2            # Eq 7
        print(f"  VIN {vin} V, L {L*1e6:.2f} uH: IL_DC {il_dc:.3f} A, dIL {dil:.3f} App, "
              f"dinh {pk:.3f} A, day {val:.3f} A (ILIM valley min 2.7 A tai 3.6 V)")
    print("  fSW chi co gia tri typ 1.0 MHz trong 6.5 -> dung typ. L -30 % theo khuyen nghi 8.2.2.2.")


def h2_tps25947():
    head("H-2 TPS259474 (SLVSFC9C sec 6.5, Eq 5, Eq 6)")
    vals = [vl * r2 / (r1 + r2) for vl, r1, r2 in product((3.135, 3.465), rtol(267e3), rtol(187e3))]
    line("V_EN khi logic cao (3.3 V +/-5 %)", min(vals), 3.3 * 187 / 454, max(vals), "V",
         note="can > VUVLO(R) max 1.223 V")
    vlo = 0.4 * 187 * 1.01 / (267 * 0.99 + 187 * 1.01)
    print(f"  V_EN khi logic thap 0.4 V (goc xau): {vlo:.3f} V (VSD(F) min 0.45 V; VUVLO(F) min 1.076 V)")
    r = 4.22e3
    inom = 3334 / r  # Eq 5: RILM = 3334 / ILIM
    kmin = min(0.425 / 0.500, 0.850 / 1.007)  # bang 6.5 tai 6.65k va 3.32k
    kmax = max(0.575 / 0.500, 1.150 / 1.007)
    line("ILIM R=4.22k", inom * kmin / 1.01, inom, inom * kmax / 0.99, "A",
         note="ty le min/max lay tu 2 diem bang 6.5; DeepSeek 0.711/0.790/0.869")
    tmin = 1.286 * 0.9e-9 / 2.5e-6   # Eq 6, dV 1.286-1.741 V, I 1.2-2.5 uA, C +/-10 %
    tmax = 1.741 * 1.1e-9 / 1.2e-6
    tnom = 1.51 * 1e-9 / 1.8e-6
    line("t_ITIMER C=1nF +/-10%", tmin * 1e3, tnom * 1e3, tmax * 1e3, "ms", note="DeepSeek 0.51-1.45 (bo dung sai tu)")
    print("  tRST auto-retry (ban A): chi co typ 110 ms, khong co min/max.")


def h3_tps3808():
    head("H-3 TPS3808G01 (SBVS050N sec 6.5, 7.3.2 Eq 1)")
    vit = (0.405 * 0.98, 0.405, 0.405 * 1.02)  # VIT G01 +/-2 %
    isense = 25e-9                             # ISENSE +/-25 nA tai VSENSE = VIT
    rt, rb, rh = 715e3, 98.6e3, 1.10e6

    def vfall(tol, rpu=None):
        vals = []
        for v, a, b, i in product((vit[0], vit[2]), rtol(rt, tol), rtol(rb, tol), (-isense, isense)):
            atop = a if rpu is None else par(a, rh + rpu)  # RESET keo len VPACK qua rpu -> R_H song song R_top
            k = b / (atop + b)
            vals.append((v + i * par(atop, b)) / k)
        return min(vals), max(vals)

    nomf = 0.405 * (1 + rt / rb)
    lo, hi = vfall(0.01)
    line("V_fall +/-1% (RESET high-Z)", lo, nomf, hi, "V", note="DeepSeek ghi 3.266-3.417 voi +/-1%")
    lo2, hi2 = vfall(0.001)
    line("V_fall +/-0.1% (RESET high-Z)", lo2, nomf, hi2, "V")
    lo3, hi3 = vfall(0.001, 100e3)
    line("V_fall +/-0.1%, RESET keo len VPACK qua 100k", lo3, (lo3 + hi3) / 2, hi3, "V",
         note="R_H boi them dong vao SENSE")
    print(f"  Bien toi 3.20 V: +/-1% -> {1000*(lo-3.20):.1f} mV; +/-0.1% -> {1000*(lo2-3.20):.1f} mV; "
          f"co pull-up -> {1000*(lo3-3.20):.1f} mV")
    vals = [v * (1 + a / par(b, h)) for v, a, b, h in
            product((vit[0], vit[2]), rtol(rt, 0.001), rtol(rb, 0.001), rtol(rh))]
    line("V_rise (RESET thap, VHYS noi = 0)", min(vals), 0.405 * (1 + rt / par(rb, rh)), max(vals), "V",
         note="muc tieu >= 3.50 V")
    c = 3.9
    tnom = c / 175 + 0.5e-3  # Eq 1 (s)
    # dung sai suy tu dong CT=180 nF: 0.62/1.03/1.44 s; tu +/-10 %
    line("tD CT=3.9nF", tnom * 0.62 / 1.03 * 0.9, tnom, tnom * 1.44 / 1.03 * 1.1, "s",
         nd=4, note="DeepSeek 22.3 ms, thieu +0.5 ms va dung sai")
    print("  Tre SENSE->RESET: chi co typ 20 us (khong co max).")
    print(f"  Thevenin SENSE = {par(rt, rb)/1e3:.1f} kOhm (Codex gia dinh <= 10 kOhm); "
          f"sai so do ISENSE quy ve pack = +/-{25e-9*par(rt, rb)*(1+rt/rb)*1e3:.1f} mV")


def h4_detector():
    head("H-4 Detector raw VBUS TLV6703 (SBOS865B sec 7.5, Table 2)")
    vitp = (0.396, 0.400, 0.404)   # VIT+ -40..125 C
    vitm = (0.387, 0.3945, 0.400)  # VIT-
    r1, r2 = 100e3, 9.53e3

    def th(v3):
        vals = [v * (a + b) / b for v, a, b in product((v3[0], v3[2]), rtol(r1), rtol(r2))]
        return min(vals), v3[1] * (r1 + r2) / r2, max(vals)

    line("V_detect (VBUS tang, VIT+)", *th(vitp), "V", note="DeepSeek 4.50/4.56/4.62")
    line("V_deassert (VBUS giam, VIT-)", *th(vitm), "V", note="DeepSeek 4.44/4.50/4.56; chua tinh R_H4")
    for vb in (4.4, 5.0, 5.5):
        vh = vb * 240 / (100 + 100 + 240)
        print(f"  Muc ra cao tai VBUS {vb} V: {vh:.3f} V (74LVC VIH 2.0 V @VCC 3-3.6 V)")
    print("  Dut day SENSE: R_D2 keo SENSE ve 0 -> OUT thap = 'VBUS vang' -> NOR o H-5 = 1 -> CHO PHEP bat (fail-ON).")


def h5_tmux():
    head("H-5 2x TMUX1511 (SCDS390B sec 5.5)")
    sel = 5 * 3.465 / 6e6     # 5 SEL dang cao qua 6 MOhm pull-down noi
    line("Dong tinh IDD + SEL", 2 * 37e-6 * 1e6, (2 * 37e-6 + sel) * 1e6, (2 * 70e-6 + sel) * 1e6, "uA",
         note="IDD 37/70 uA/IC")
    print(f"  Ro I/O sang mien tat (VDD=0, VS<=3.6 V): <= {5*2:.0f} uA tong (5 x IPOFF 2 uA)")
    print("  RON max 4.5 Ohm; 8 SEL co, 5 dung, 3 SEL du noi GND.")


def h6_adc():
    head("H-6 ADC1 settling (ESP32 datasheet v5.3 Table 4-3)")
    rs = 10e3 / 4 + 4.5
    n = math.log(2 ** 13)
    for c in (10e-12, 100e-12):
        print(f"  R_settle {rs:.1f} Ohm, C {c*1e12:.0f} pF: t = {n:.3f} tau = {n*rs*c*1e9:.1f} ns")
    print("  C lay mau ADC1 KHONG co trong datasheet v5.3 -> [CHUA XAC MINH]. Bang 4-3 do voi tu ngoai 100 nF.")
    print(f"  Neu dat 100 nF tai chan ADC: tau = {rs*100e-9*1e3:.3f} ms; buoc toan dai can {n*rs*100e-9*1e3:.2f} ms.")


def h7_mcp73833():
    head("H-7 MCP73833 (DS20002005C bang DC, 5.1.4.1, 6.1.1.3)")
    for vin in (4.75, 5.25):
        for vf in (1.8, 2.2):
            imax = (vin - vf) / (680 * 0.99)
            imin = (vin - vf - 1.0) / (680 * 1.01)
            print(f"  LED 680 Ohm, VIN {vin} V, VF {vf} V (gia dinh): {imin*1e3:.2f}-{imax*1e3:.2f} mA (VOL 0-1 V)")
    rc = [1.20 / 53e-6, 1.23 / 50e-6, 1.26 / 47e-6]   # VT1 / ITHERM
    rh = [0.235 / 53e-6, 0.25 / 50e-6, 0.265 / 47e-6]  # VT2 / ITHERM
    print(f"  R_NTC tai nguong lanh: {rc[0]/1e3:.2f}/{rc[1]/1e3:.2f}/{rc[2]/1e3:.2f} kOhm")
    print(f"  R_NTC tai nguong nong: {rh[0]/1e3:.3f}/{rh[1]/1e3:.3f}/{rh[2]/1e3:.3f} kOhm")
    tc = [t for r in rc for t in ntc_t_tol(r / 1e3)] + [ntc_t(rc[1] / 1e3)] * 2
    th = [t for r in rh for t in ntc_t_tol(r / 1e3)] + [ntc_t(rh[1] / 1e3)] * 2
    tc = [min(tc), ntc_t(rc[1] / 1e3), max(tc)]
    th = [min(th), ntc_t(rh[1] / 1e3), max(th)]
    print(f"  Nhiet do cat lanh (bang Semitec, NTC +/-1 %): {min(tc):.1f}..{max(tc):.1f} C (nom {tc[1]:.1f})")
    print(f"  Nhiet do cat nong: {min(th):.1f}..{max(th):.1f} C (nom {th[1]:.1f})")
    print(f"  R(0 C): TI 27.28 k; DeepSeek dung B3435 -> {ntc_r_b3435(0):.2f} k (lech {100*(ntc_r_b3435(0)/27.28-1):.1f} %)")
    print(f"  R(45 C) uoc tinh: {ntc_r(45):.3f} k (beta 25/60) vs B3435 {ntc_r_b3435(45):.3f} k (bang Semitec)")


def h8_usb():
    head("H-8 Dong USB-C tay cam (DS20002005C; r7 H3)")
    ireg_max = 1000 / (2.49 * 0.99) * 1.10 / 1000   # Eq 5-1, +/-10 %
    iss = 3e-3                                       # ISS max khi sac
    led = 2 * 5.25 / (680 * 0.99)                    # 2 LED sang khi sac (STAT1 + PG), VF=0 cuc xau
    det = 5.5 / (100e3 + 9.53e3) + 5.5 / 440e3 + 15e-6  # chia ap + level-shift + IDD TLV6703 (gia dinh 15 uA)
    tot = ireg_max + iss + led + det
    print(f"  IREG max {ireg_max:.4f} A; ISS {iss*1e3:.1f} mA; 2 LED (VF=0) {led*1e3:.2f} mA; detector {det*1e6:.0f} uA")
    print(f"  Tong steady-state cuc xau: {tot:.4f} A ; bien {1000*(0.5-tot):.1f} mA toi 0.5 A")
    print(f"  Inrush 4.7 uF: Q = {4.7e-6*5.25*1e6:.1f} uC")


def r1_bq25886():
    head("R-1 BQ25886 (SLUSD88A sec 6.5, 8.3.7.4, Fig 18)")
    k = 3810.0  # ICHG = RICHGSET / KICHGSET
    i = 1.91e3 / k
    line("ICHG R=1.91k", i * 0.85 * 0.99, i, i * 1.15 * 1.01, "A", note="+/-15 % @500 mA, +/-1 % R")
    print(f"  ICHGSET 7.68k (input spec) -> {7.68e3/k:.3f} A")

    def solve(r_cold, r_hot, k1=0.7325, k5=0.34375):
        b = ((1 / k5 - 1) - (1 / k1 - 1)) / (1 / r_hot - 1 / r_cold)
        a = (1 / k1 - 1) - b / r_cold
        return b, b / a

    rt1, rt2 = solve(27.28, 3.02)
    print(f"  Kiem phuong trinh voi vi du TI 0-60 C: RT1 {rt1:.2f}k RT2 {rt2:.2f}k (TI: 5.24k/30.31k)")

    def temp_at(a, b, kthr, nt=1.0):
        rp = kthr * a / (1 - kthr)
        return ntc_t(rp * b / (b - rp) / nt)

    def window(t1, t2):
        cold, warm, hot = [], [], []
        for a, b in product(rtol(t1), rtol(t2)):
            cold += [temp_at(a, b, x, n) for x in (0.7275, 0.7375) for n in (0.99, 1.01)]
            warm += [temp_at(a, b, x, n) for x in (0.4425, 0.4525) for n in (0.99, 1.01)]
            hot += [temp_at(a, b, x, n) for x in (0.33875, 0.34875) for n in (0.99, 1.01)]
        return (min(cold), max(cold)), (min(warm), max(warm)), (min(hot), max(hot))

    c, w, h = window(5.11, 26.7)
    print(f"  DeepSeek 5.11k/26.7k: dung sac T1 {c[0]:.1f}..{c[1]:.1f} C; T3 (VREG 8.0 V, VAN SAC) "
          f"{w[0]:.1f}..{w[1]:.1f} C; dung sac T5 {h[0]:.1f}..{h[1]:.1f} C")
    r45 = ntc_r(45)
    rt1n, rt2n = solve(27.28, r45)
    print(f"  Giai cho T1=0 C, T5=45 C (R45 uoc tinh {r45:.3f}k): RT1 {rt1n:.3f}k RT2 {rt2n:.2f}k")
    c, w, h = window(9.09, 324.0)
    t2 = [temp_at(a, b, x) for a, b in product(rtol(9.09), rtol(324.0)) for x in (0.6775, 0.6875)]
    print(f"  Ung vien E96 9.09k/324k: T2 (ICHG 20 %) {min(t2):.1f}..{max(t2):.1f} C")
    print(f"  Ung vien E96 9.09k/324k: T1 {c[0]:.1f}..{c[1]:.1f} C; T3 {w[0]:.1f}..{w[1]:.1f} C; T5 {h[0]:.1f}..{h[1]:.1f} C")
    for regn in (4.7, 5.15):
        v = regn * 900 / 1000
        print(f"  CE keo len REGN {regn} V qua 100k (900k noi): {v:.2f} V; OUT1 abs max VDD+0.3 = 3.6 V @VDD 3.3 -> vuot {v > 3.6}")
    for vdd in (3.3 * 0.985, 3.6 * 0.985):
        print(f"  CE keo len V3V3_USB {vdd:.3f} V qua 100k: {vdd*0.9:.2f} V (VIH_CE 1.3 V; <= VDD+0.3)")


def r2_uvlo():
    head("R-2 UVLO robot TLV6700 (SNVSAV2B sec 6.5)")
    vitm = (0.387, 0.3945, 0.400)
    vitp = (0.396, 0.400, 0.404)
    rt, rb, rh = 1.47e6 + 18.7e3, 97.6e3, 2.0e6
    vals = [v * (1 + a / b) + i * a for v, a, b, i in
            product((vitm[0], vitm[2]), rtol(rt, 0.001), rtol(rb, 0.001), (-25e-9, 25e-9))]
    line("V_fall (VIT-, OUTA high-Z)", min(vals), vitm[1] * (1 + rt / rb), max(vals), "V",
         note="DeepSeek dung VIT+ 0.396-0.404 -> 6.42/6.50/6.59")
    vals = [v * (1 + a / par(b, h)) for v, a, b, h in
            product((vitp[0], vitp[2]), rtol(rt, 0.001), rtol(rb, 0.001), rtol(rh))]
    line("V_rise (OUTA thap)", min(vals), vitp[1] * (1 + rt / par(rb, rh)), max(vals), "V")
    vals = []
    for v in (vitm[0], vitm[2]):
        g = 1 / rt + 1 / rb + 1 / (rh + 32e3)
        kk = (1 / rt + (47 / 147) / (rh + 32e3)) / g  # OUTA ~ VPACK*47/147 qua Thevenin 32k
        vals.append(v / kk)
    print(f"  Neu OUTA bi keo len (100k len VPACK, 47k xuong): V_fall = {min(vals):.3f}..{max(vals):.3f} V")
    # Founder chot 06/11/2026: V_fall 6.40-6.60 V tai pack. Kiem kha thi voi TLV6700 VIT- 0.387-0.400 V.
    lo_t, hi_t = 6.40, 6.60
    span_ic = vitm[2] / vitm[0]
    span_win = hi_t / lo_t
    print(f"  Founder chot V_fall {lo_t}-{hi_t} V: ty le cua so {span_win:.4f}; ty le VIT- max/min {span_ic:.4f} "
          f"-> {'KHA THI' if span_ic < span_win else 'KHONG KHA THI ke ca voi dien tro ly tuong'}")
    # Dung sai IC toi da cho phep (doi xung) khi dien tro 0.1 % va ISENSE +/-25 nA qua Thevenin 100 kOhm
    r_err = 0.001 * 2 + 25e-9 * 100e3 / 0.3945
    tol_ic = (span_win - 1) / 2 - r_err
    print(f"  Dung sai nguong falling toi da cua IC (doi xung, R 0.1 %, ISENSE qua 100 kOhm): +/-{100*tol_ic:.2f} %"
          f" (TLV6700: -{100*(1-vitm[0]/vitm[1]):.2f} / +{100*(vitm[2]/vitm[1]-1):.2f} %)")
    k = math.sqrt(lo_t * hi_t) / vitm[1]
    print(f"  Ty le chia can (danh nghia giua cua so, VIT- typ): {k:.3f}")


def r3_tps54302():
    head("R-3 TPS54302 (SLVSDG6C sec 6.5, 6.3.4 Eq 1-2, 6.3.8)")
    vfb = (0.581, 0.596, 0.611)
    line("VOUT 750k/100k", *vout_fb(vfb, 750e3, 100e3), "V", note="DeepSeek 4.96/5.07/5.17")
    line("VOUT 100k/13.3k (vi du TI)", *vout_fb(vfb, 100e3, 13.3e3), "V")
    ip = 0.7e-6  # typ (khong co min/max)
    for vp in (6.0, 6.4, 8.4):
        vals = [vp * b / (a + b) + ip * par(a, b) for a, b in product(rtol(383e3), rtol(100e3))]
        print(f"  V_EN tai VPACK {vp} V (gom Ip 0.7 uA typ): {min(vals):.3f}..{max(vals):.3f} V "
              f"(VENrising max 1.28 V; abs max 7 V; khuyen nghi <= 5.5 V)")
    print("  R_EN2 ho: EN bi kep boi BZT52C5V6, VZ 5.2-6.0 V @5 mA (DS18004); IR <= 1 uA @ VR 2 V")
    for fsw in (290e3, 400e3, 510e3):
        dil = (8.4 - 5.0) * (5.0 / 8.4) / (10e-6 * fsw)
        print(f"  L 10 uH, VIN 8.4 V, fSW {fsw/1e3:.0f} kHz: dIL {dil:.3f} App (dinh @0.9 A = {0.9+dil/2:.2f} A, HS limit min 4 A)")


def r4_tps63070():
    head("R-4 TPS63070 (SLVSC58B sec 6.5, 8.4.5)")
    line("VOUT 649k/100k PWM (+/-1 %, IFB 100 nA)", *vout_fb((0.792, 0.8, 0.808), 649e3, 100e3, ileak=100e-9), "V",
         note="DeepSeek 5.87/5.99/6.11")
    line("VOUT 649k/100k PFM (-1/+3 %)", *vout_fb((0.792, 0.8, 0.824), 649e3, 100e3, ileak=100e-9), "V")
    print("  Gioi han dong am trung binh vao IN (forced PWM): 1.1/1.8 A (VIN 5 V, VOUT 6.5 V).")


def r5_motor_en():
    head("R-5 MOTOR_EN (DRV8833 SLVSAR1E 6.5; SN74LVC1G08 6.x)")
    print("  nSLEEP VIH = 2.5 V, VIL = 0.5 V (khong phai 2.0 V); pull-down noi 500 k typ.")
    vals = [vp * b / (a + b) for a, b in product(rtol(383e3), rtol(100e3)) for vp in (6.0, 8.4)]
    print(f"  LOGIC_EN (= nut EN TPS54302 theo R-3) = {min(vals):.2f}..{max(vals):.2f} V; "
          f"74LVC1G08 VIH 2.0 V / VIL 0.8 V @VCC 3-3.6 V -> doc THAP hoac khong xac dinh")
    print(f"  Tai nSLEEP khi cao: {3.3/par(100e3, 500e3)*1e6:.1f} uA")


def r6_isen():
    head("R-6 ISEN (DRV8833 SLVSAR1E 6.1, 6.5)")
    r = 0.62
    print(f"  Chopping: VTRIP max 0.240 V -> ITRIP max {0.240/(r*0.99):.3f} A")
    for i in (2.0, 3.3):
        print(f"  Ngan mach ra-ra truoc OCP (IOCP {i} A, tDEG 4 us): V_ISEN = {i*r*1.01:.2f} V vs abs max 0.5 V")
    tau = 1e3 * 10e-9
    fc = 1 / (2 * math.pi * tau)
    print(f"  RC 1k/10nF: fc {fc/1e3:.1f} kHz; suy giam o 50 kHz PWM: x{1/math.sqrt(1+(50e3/fc)**2):.3f}")


def r7_vm_clamp():
    head("R-7 Kep VM (nang luong cuon day; DMP3098L DS31447 Rev 8)")
    for v0 in (6.0, 6.22, 6.29):
        for c in (100e-6, 150e-6, 220e-6):
            e = 2 * 0.5 * 10e-3 * 0.45 ** 2
            print(f"  V0 {v0:.2f} V, C {c*1e6:.0f} uF, L 10 mH: E {e*1e3:.3f} mJ -> Vpeak {math.sqrt(v0**2+2*e/c):.2f} V")
    print(f"  Brake 22 Ohm tai 8.2 V: {8.2/22:.3f} A, {8.2**2/22:.2f} W lien tuc (2512 thuong 1-2 W, khong phai 5 W)")


def r8_ldo():
    head("R-8 LDO cho TUSB320LAI (SBVS338H 5.5; SLLSEQ8D 6.1, 7.2)")
    for vn in (3.3, 3.6):
        vmin = vn * 0.985  # +/-1.5 % DBV
        print(f"  TPS7A20{int(round(vn*10))} DBV: VOUT min {vmin:.3f} V; (dieu kien VDD >= 3.5 V chi ap dung khi TUSB320 la DFP quang cao 3 A) -> "
              f"{'>=3.5' if vmin >= 3.5 else '<3.5, UFP van dung duoc'}; OUT1 abs max VDD+0.3 = {vmin+0.3:.2f} V")
        for vf in (0.3, 0.45):
            vin = 4.4 - vf
            print(f"     VBUS 4.4 V, VF {vf}: VIN {vin:.2f} V; dieu kien bang VIN >= VOUT+0.3 = {vn+0.3:.2f} V "
                  f"-> {'OK' if vin >= vn + 0.3 else 'THIEU'}; dropout max 145 mV @300 mA")


def r9_ctrl():
    head("R-9 Chan dieu khien (SN74LVC8T245 Table 7-1; TCA9517A 7.3.2)")
    print("  8T245: OE=L,DIR=H -> A->B ; OE=L,DIR=L -> B->A ; OE=H -> Hi-Z. DIR/OE tham chieu VCCA.")
    print("  DeepSeek: DIR keo xuong = 'A->B' -> SAI, thuc te B->A. OE keo len VCCB -> sai mien (phai VCCA).")
    print("  TCA9517A EN active-high, co pull-up noi len VCCB (gia tri khong cong bo).")
    # MAX98357A 19-6779 Rev 16: SD_MODE B0 0.08/0.16/0.355 V, RPD 92/100/108 k; GAIN_SLOT=GND 11.4/12/12.6 dB
    for rext in (None, 100e3):
        rpd = (92e3, 108e3) if rext is None else (par(92e3, rext * 0.99), par(108e3, rext * 1.01))
        for vddio in (3.3,):
            rs, rl = (94.0 * vddio - 100) * 1e3, (222.2 * vddio - 100) * 1e3
            v_small = [vddio * r / (r + rs) for r in rpd]
            v_large = [vddio * r / (r + rl) for r in rpd]
            tag = "chi RPD noi" if rext is None else "RPD noi // 100k ngoai"
            print(f"  MAX98357A {tag}: SD_MODE qua RSMALL {rs/1e3:.1f}k = {min(v_small):.3f}..{max(v_small):.3f} V; "
                  f"qua RLARGE {rl/1e3:.1f}k = {min(v_large):.3f}..{max(v_large):.3f} V (B1 0.65-0.825, B2 1.245-1.5 V)")


def r10_ipc():
    head("R-10 IPC-2221 (k=0.048/0.024, b=0.44, c=0.725 - [CHUA XAC MINH tu ban IPC])")
    for net, i in (("VPACK", 1.2), ("VPACK2", 2.5), ("VM", 1.0), ("V5", 1.0)):
        for k, lay in ((0.048, "ngoai"), (0.024, "trong")):
            a = (i / (k * 10 ** 0.44)) ** (1 / 0.725)
            print(f"  {net} {i} A lop {lay}: {a/1.378*0.0254:.3f} mm")


# ======================================================================
# PHAN 2 - THIET KE CHOT (07/11 yeu cau user). Dien tro 0.1 % chon tu day E192.
# ======================================================================
E192 = sorted(({round(10 ** (i / 192), 2) for i in range(192)} - {9.19}) | {9.20})
E96 = sorted(({round(10 ** (i / 96), 2) for i in range(96)} - {9.3}) | {9.31})


def series(vals, lo, hi):
    out = []
    for dec in (1e3, 1e4, 1e5, 1e6):
        for v in vals:
            x = v * dec
            if lo <= x <= hi:
                out.append(x)
    return sorted(out)


def nearest(vals, x):
    return min(vals, key=lambda v: abs(v - x))


def switched_divider(rt, rx, rb, vit_f, vit_r, tol, ileak, rds=0.4, vhys_max=0.0):
    """Chia ap 3 dien tro: Rx noi tiep NMOS song song Rt khi trang thai OK.
    Tra ve (Vfall min,max), (Vrise min,max)."""
    vf, vr = [], []
    for a, x, b, i in product(rtol(rt, tol), rtol(rx, tol), rtol(rb, tol), (-ileak, ileak)):
        top_ok = par(a, x + rds)
        for v in vit_f:
            vf.append((v + i * par(top_ok, b)) * (top_ok + b) / b)
        for v in vit_r:
            for h in (0.0, vhys_max):
                vr.append((v * (1 + h) + i * par(a, b)) * (a + b) / b)
    return (min(vf), max(vf)), (min(vr), max(vr))


def d_h3():
    head("D-H3 TPS3808G01 + NMOS chuyen mach hysteresis (DMN2075U-7 DS31837 Rev 7)")
    vit = (0.405 * 0.98, 0.405 * 1.02)
    best = None
    for rb in series(E192, 9.0e3, 11.5e3):
        for rt in series(E192, 7.6 * rb, 8.2 * rb):
            if par(rt, rb) > 10e3:
                continue
            rx_t = 1 / (1 / (7.25 * rb) - 1 / rt) if rt > 7.25 * rb else None
            if not rx_t or rx_t <= 0:
                continue
            rx = nearest(series(E192, rx_t * 0.9, rx_t * 1.1) or [rx_t], rx_t)
            k = 1 + par(rt, rx) / rb
            if abs(k / 8.25 - 1) > 0.0005:
                continue
            (f0, f1), (r0, r1) = switched_divider(rt, rx, rb, vit, vit, 0.001, 25e-9 + 100e-9, vhys_max=0.03)
            if r0 < 3.50:
                continue
            score = (r1, -f0)
            if best is None or score < best[0]:
                best = (score, rb, rt, rx, k, f0, f1, r0, r1)
    _, rb, rt, rx, k, f0, f1, r0, r1 = best
    print(f"  Chon: R_bot {rb/1e3:.2f}k, R_top {rt/1e3:.1f}k, Rx {rx/1e3:.0f}k (0.1 %, E192)")
    print(f"  He so OK = {k:.4f} (muc tieu 8.25 +/-0.2 %: {100*(k/8.25-1):+.3f} %); Thevenin {par(rt, rb)/1e3:.2f} kOhm")
    print(f"  V_fall {f0:.3f}..{f1:.3f} V (bien {1000*(f0-3.20):.0f} mV toi 3.20 V); V_rise {r0:.3f}..{r1:.3f} V (>= 3.50 V)")
    print(f"  Dong chia ap tu pack @4.2 V: {4.2/(rt+rb)*1e6:.1f} uA; NMOS IDSS 100 nA + ISENSE 25 nA da tinh")
    print("  CT de ho: tD 12/20/28 ms (SBVS050N 6.6). RESET keo len VPACK qua 100k; gate NMOS = RESET.")
    print(f"  Vgs NMOS khi OK: >= {3.20*0.98 - 0.42:.2f} V (VGS(th) max 1.0 V; RDS(on) <= 45 mOhm @2.5 V)")


def d_r2():
    head("D-R2 TLV6710 INA (SNVSAV4B 7.5) + NMOS chuyen mach, cua so founder 6.40-6.60 V")
    vf = (0.397, 0.403)   # VIT-(INA)
    vr = (0.400, 0.413)   # VIT+(INA)
    best = None
    for rb in series(E192, 9.0e3, 20.5e3):
        for rt in series(E192, 15.9 * rb, 17.6 * rb):
            if par(rt, rb) > 20e3:
                continue
            for rx in series(E192, 1e6, 10e6):
                kok = 1 + par(rt, rx) / rb
                if abs(kok * 0.400 - 6.50) > 0.03:
                    continue
                (f0, f1), (r0, r1) = switched_divider(rt, rx, rb, vf, vr, 0.001, 25e-9 + 100e-9)
                if f0 < 6.40 or f1 > 6.60 or r0 < f1 + 0.15:
                    continue
                score = (abs((f0 + f1) / 2 - 6.50), r1)
                if best is None or score < best[0]:
                    best = (score, rb, rt, rx, f0, f1, r0, r1)
    if best is None:
        print("  KHONG tim duoc to hop dat.")
        return
    _, rb, rt, rx, f0, f1, r0, r1 = best
    print(f"  Chon: R_bot {rb/1e3:.2f}k, R_top {rt/1e3:.1f}k, Rx {rx/1e6:.2f}M (0.1 %, E192); Thevenin {par(rt, rb)/1e3:.1f}k")
    print(f"  V_fall {f0:.3f}..{f1:.3f} V (cua so 6.40-6.60 V); V_rise {r0:.3f}..{r1:.3f} V")
    print(f"  Dong chia ap @8.4 V: {8.4/(rt+rb)*1e6:.1f} uA")
    # Nut EN_NODE: 100k tu VPACK2, 68k xuong GND (sua 07/11) -> gate NMOS, EN TPS54302, ngo vao AND MOTOR_EN
    vals = [vp * b / (a + b) for a, b in product(rtol(100e3), rtol(68e3)) for vp in (6.40, 8.4)]
    print(f"  EN_NODE (100k/68k): {min(vals):.2f}..{max(vals):.2f} V; EN TPS54302 rising max 1.28 V, abs max 7 V; "
          f"Vgs NMOS >= {min(vals)-0.403:.2f} V (DMN2075U-7 VGSS 8 V, VGS(th) max 1.0 V)")


def d_h4():
    head("D-H4 Detector VBUS fail-safe: TLV6710 kenh INB (OUTB thap khi INB > VIT+)")
    vitp = (0.397, 0.403)  # VIT+(INB)
    vitm = (0.387, 0.400)  # VIT-(INB)
    rbias, rfar, rdiv = 220e3, 10e3, 0.0
    s_abs = [vp * f / (b + f) for vp, b, f in product((3.20, 4.20), rtol(rbias), rtol(rfar))]
    print(f"  Day nguyen, VBUS vang: S = {min(s_abs):.3f}..{max(s_abs):.3f} V < VIT-(INB) min {vitm[0]} V -> cho phep")
    print(f"  Dut day sense hoac GND: S = VPACK 3.20..4.20 V > VIT+ max {vitp[1]} V -> chan (OUTB thap)")
    print(f"  VBUS co mat (>= {vitp[1]:.3f} V tai S): chan. VBUS 5.5 V < abs max INB 7 V")
    print(f"  Dong tu USB qua R_far: {5.25/rfar*1e3:.2f} mA; dong tu pack khi vang VBUS: {4.2/(rbias+rfar)*1e6:.1f} uA")
    print(f"  Bien nhieu muc thap: {1000*(vitm[0]-max(s_abs)):.0f} mV")
    # Robot: VPACK2 toi 8.4 V > abs max INB 7 V -> R_bias 470k tu VPACK2 + R_sd 100k tai S xuong GND
    rb2, rsd = 470e3, 100e3
    s_abs2 = [vp * par(sd, f) / (b + par(sd, f)) for vp, b, sd, f in product((6.24, 8.4), rtol(rb2), rtol(rsd), rtol(rfar))]
    s_brk2 = [vp * sd / (b + sd) for vp, b, sd in product((6.24, 8.4), rtol(rb2), rtol(rsd))]
    print(f"  Robot (470k tu VPACK2, 100k tai S): vang+nguyen S = {min(s_abs2):.3f}..{max(s_abs2):.3f} V; "
          f"dut day S = {min(s_brk2):.2f}..{max(s_brk2):.2f} V (can > 0.403 V, < 7 V)")


def d_h2():
    head("D-H2 TPS259474L (SLVSFC9C Eq 4)")
    for c in (2.2e-9,):
        sr = 2000e-12 / c  # V/ms
        print(f"  CdVdt {c*1e9:.1f} nF -> SR {sr:.2f} V/ms; 0->5 V trong {5/sr:.1f} ms; inrush voi 22 uF = {22e-6*sr*1e3*1e3:.1f} mA")
    print("  OVLO noi GND (khong de ho, SLVSFC9C Table 5-1). PG de ho, PGTH noi GND [box02 xac nhan].")
    # LOAD_EN: 100k len VPACK; tai: EN/UVLO qua 10k (ro +/-0.1 uA), SEL TMUX qua 100k (6 MOhm noi), boost EN
    rpu = 100e3
    vals = []
    for vp, r in product((3.20, 4.20), rtol(rpu)):
        i_load = vp / (6e6 + 100e3) + 0.1e-6 + 0.1e-6  # SEL path + IENLKG + du phong EN boost
        vals.append(vp - i_load * r)
    print(f"  LOAD_EN cao: {min(vals):.2f}..{max(vals):.2f} V (EN/UVLO can > 1.223 V, abs max 6.5 V, khuyen nghi <= 5 V;"
          f" TPS61023 EN > 1.2 V, abs max 7 V)")
    print(f"  LOAD_EN thap: dong chim {4.2/rpu*1e6:.0f} uA -> VOL << 0.45 V (VSD(F) min)")
    print("  Divider 267k/187k bi bo: voi pull-up 100k no keo LOAD_EN xuong ~0.81*VPACK -> V_EN min ~1.05 V < 1.223 V.")


def d_r1():
    head("D-R1 BQ25886 mang TS 3 dien tro (RT1, RT2, Rs noi tiep NTC)")
    rt1s = series(E96, 2e3, 20e3)
    rt2s = series(E96, 10e3, 2e6)
    rss = [0.0] + series(E96, 100, 10e3)

    def t_at(rt1, rt2, rs, k):
        p = k * rt1 / (1 - k)
        if p >= rt2:
            return None
        rbr = p * rt2 / (rt2 - p) - rs
        if rbr <= 0.05:
            return None
        t = ntc_t(rbr / 1e3)
        return None if math.isnan(t) else t

    cands = []
    for rt1 in rt1s:
        for rt2 in rt2s:
            for rs in rss:
                t1 = [t_at(rt1, rt2, rs, k) for k in (0.7275, 0.7375)]
                t5 = [t_at(rt1, rt2, rs, k) for k in (0.33875, 0.34875)]
                if None in t1 or None in t5:
                    continue
                if min(t1) < -1.5 or max(t1) > 2.5 or max(t5) > 45.0 or min(t5) < 42.0:
                    continue
                t3 = [t_at(rt1, rt2, rs, k) for k in (0.4425, 0.4525)]
                if None in t3:
                    continue
                cands.append((-min(t3), rt1, rt2, rs))
    cands.sort()
    best = None
    for _, rt1, rt2, rs in cands[:200]:
        res = {}
        ok = True
        for name, ks in (("T1", (0.7275, 0.7375)), ("T2", (0.6775, 0.6875)), ("T3", (0.4425, 0.4525)),
                         ("T5", (0.33875, 0.34875))):
            ts = [t_at(a, b, c, k * 1.0) for a, b, c in product(rtol(rt1), rtol(rt2), rtol(rs) if rs else (0.0,)) for k in ks]
            ts += [ntc_t(ntc_r(t) * f) if t is not None else None for t in list(ts) for f in (0.99, 1.01)]
            ts = [None if (t is None or math.isnan(t)) else t for t in ts]
            if None in ts:
                ok = False
                break
            res[name] = (min(ts), max(ts))
        if not ok or res["T5"][1] > 45.5 or res["T1"][0] < -2.0:
            continue
        if best is None or res["T3"][0] > best[1]["T3"][0]:
            best = ((rt1, rt2, rs), res)
    (rt1, rt2, rs), res = best
    print(f"  Chon E96: RT1 {rt1/1e3:.2f}k, RT2 {rt2/1e3:.1f}k, Rs {rs/1e3:.3f}k (noi tiep NTC)")
    for n, (a, b) in res.items():
        print(f"    {n}: {a:.1f}..{b:.1f} C")
    print("  So voi 2 dien tro 9.09k/324k: T3 31.7..33.5 C. NTC theo bang Semitec, dung sai +/-1 %.")
    print("  CE: 100k len REGN; Q_CE (DMN2075U-7) keo CE xuong khi Q_P (DMG2305UX-7) dan;")
    print("      Q_P source = V3V3_USB, gate = OUT1 (pull-up 100k len V3V3_USB). OUT1 <= VDD (abs max VDD+0.3) OK.")
    for vdd in (3.546, 3.654):
        print(f"      V3V3_USB {vdd:.2f} V: Vgs Q_P khi OUT1 thap = -{vdd-0.4:.2f} V (RDS(on) <= 100 mOhm @-2.5 V); "
              f"gate Q_CE = {vdd:.2f} V (VGS(th) max 1.0 V)")


def d_r5():
    head("D-R5 MOTOR_EN = AND3(EN_NODE, V5R_OK, MCU_MOT_EN), 74LVC1G11 VCC = V3V3_DEV (sua 07/11)")
    en = [vp * b / (a + b) for a, b in product(rtol(100e3), rtol(68e3)) for vp in (6.418, 8.4)]
    print(f"  EN_NODE khi cho phep: {min(en):.2f}..{max(en):.2f} V (VIH 2.0 V @VCC 3-3.6 V; ngo vao chiu 5.5 V)")
    print("  Veto (UVLO, USB, SW1) keo EN_NODE xuong -> MOTOR_EN thap ngay, khong phu thuoc tu tren V5_R.")
    vals = [v * b / (a + b) for v, a, b in product((4.852, 5.298), rtol(100e3), rtol(200e3))]
    print(f"  V5R_OK = V5_R qua 100k/200k: {min(vals):.2f}..{max(vals):.2f} V (giu: chi bat khi buck da len)")
    voh = 3.3 * 0.95 - 0.1
    iload = voh / par(100e3, 500e3)
    print(f"  VOH LVC1G11 @IOH -100 uA = VCC-0.1 >= {voh:.2f} V (VCC 3.135 V); tai nSLEEP {iload*1e6:.0f} uA "
          f"-> nSLEEP >= {voh:.2f} V > VIH 2.5 V")


def d_r6():
    head("D-R6 Loc ISEN -> ADC1: 10k / 100 nF")
    tau = 10e3 * 100e-9
    fc = 1 / (2 * math.pi * tau)
    print(f"  fc {fc:.0f} Hz; suy giam 50 kHz x{1/math.sqrt(1+(50e3/fc)**2):.4f}; tau {tau*1e3:.1f} ms")
    print(f"  Xung ISEN 2.07 V trong 4 us vao 10k/100nF: dV tai ADC = {2.07*(1-math.exp(-4e-6/tau))*1e3:.1f} mV")
    print("  Chan ISEN: van FAIL abs max khi ngan mach (R1 0.62 Ohm da chot). De xuat footprint Schottky DNP + hoi TI.")


def d_h6():
    head("D-H6 Tu 100 nF X7R tai moi chan ADC1 joystick (dieu kien do ESP32 Table 4-3)")
    rs = 10e3 / 4 + 4.5
    print(f"  tau {rs*100e-9*1e3:.3f} ms; 9.01 tau = {9.011*rs*100e-9*1e3:.2f} ms -> cho >= 5 ms sau khi mo TMUX")
    for cs in (10e-12, 100e-12):
        print(f"  Chia se dien tich voi C_lay_mau {cs*1e12:.0f} pF: sai so <= {cs/100e-9*4096:.2f} LSB (12 bit)")


def d_r9():
    head("D-R9 MAX98357A SD_MODE noi V5_R qua 10k (kenh trai), GAIN_SLOT = GND")
    v = [5.298 * r / (r + 10e3 * 0.99) for r in (92e3, 108e3)] + [4.852 * r / (r + 10e3 * 1.01) for r in (92e3, 108e3)]
    print(f"  SD_MODE = {min(v):.2f}..{max(v):.2f} V > B2 max 1.5 V -> trai; VDD = VDDIO = V5_R")


# ======================================================================
# PHAN 3 - SUA THEO REVIEW 07/11 (ILIM, eFuse pass VBUS, SEL TMUX)
# ======================================================================
def d_ilim_v2():
    head("D-ILIM2 TPS259474L ILIM 5.11k va dong quy ve pack (SLVSFC9C Eq 5, bang 6.5)")
    kmin = min(0.425 / 0.500, 0.850 / 1.007)
    kmax = max(0.575 / 0.500, 1.150 / 1.007)
    for r in (4.22e3, 5.11e3):
        inom = 3334 / r
        lo, hi = inom * kmin / 1.01, inom * kmax / 0.99
        p = [5.0 * i / (3.20 * 0.80) for i in (lo, hi)]
        print(f"  RILM {r/1e3:.2f}k: ILIM {lo:.3f}/{inom:.3f}/{hi:.3f} A -> dong pack @3.20 V, eta 0.8: "
              f"{p[0]:.2f}..{p[1]:.2f} A")
    print("  Yeu cau: ILIM min >= 0.50 A (ESP32-WROOM-32 can nguon >= 0.5 A).")
    print("  Qua ILIM lau hon tITIMER (0.46-1.60 ms) -> circuit breaker cat va latch (ban L).")


def d_pass():
    head("D-PASS eFuse pass VBUS Micro-USB -> DevKit (TPS259474LRPWR thu 2)")
    # EN_PASS = VBUS_PROG qua 100k/45.3k, Q5 (DMN2075U-7, G=LOAD_EN) keo EN_PASS xuong khi carrier ON
    vals = []
    for vb in (4.40, 5.50):
        for a, b in product(rtol(100e3), rtol(45.3e3)):
            vals.append(vb * b / (a + b))
    print(f"  EN_PASS khi carrier OFF, VBUS 4.40-5.50 V: {min(vals):.3f}..{max(vals):.3f} V "
          f"(VUVLO(R) max 1.223 V; EN khuyen nghi <= 5 V)")
    on = [1.183 * (a + b) / b for a, b in product(rtol(100e3), rtol(45.3e3))] + \
         [1.223 * (a + b) / b for a, b in product(rtol(100e3), rtol(45.3e3))]
    print(f"  Nguong bat theo VBUS: {min(on):.2f}..{max(on):.2f} V")
    tau = par(100e3, 45.3e3) * 100e-9
    for vb in (4.40, 5.0):
        vf = vb * 45.3 / 145.3
        t = -tau * math.log(1 - 1.223 / vf)
        print(f"  C_EN 100 nF: VBUS {vb} V -> EN_PASS cham 1.223 V sau {t*1e3:.2f} ms (tau {tau*1e3:.2f} ms)")
    print("  Thu tu khi cam Micro-USB voi carrier dang chay:")
    print("    LOAD_EN dang cao -> Q5 dan -> EN_PASS giu thap tu dau, pass khong the bat truoc carrier.")
    print("    Detector TLV6710 tpd 9.9 us typ -> LOAD_EN thap -> eFuse carrier tD,OFF <= 64 us;")
    print("    pass: Q5 tat, EN_PASS len trong >= 2.9 ms + tD,ON >= 0.09 ms -> khoang ho >= 2.8 ms.")
    print("  Mat pin: LOAD_EN = 0 -> pass bat khi co VBUS (nap DevKit duoc khi vang pack).")
    print("  Dut day sense: detector chan -> LOAD_EN thap -> carrier OFF, pass ON. An toan.")
    print("  RCB: chan nguoc khi VOUT > VIN + 29 mV (1 us); ro nguoc khi khong cap nguon 4.86 uA (@12 V).")
    kmin = min(0.425 / 0.500, 0.850 / 1.007)
    kmax = max(0.575 / 0.500, 1.150 / 1.007)
    inom = 3334 / 5.11e3
    print(f"  ILIM pass RILM 5.11k: {inom*kmin/1.01:.3f}..{inom*kmax/0.99:.3f} A (nguon USB 2.0 Default 500 mA)")


def d_sel_v2():
    head("D-SEL2 SEL TMUX1511 lai truc tiep tu LOAD_EN qua 10k (bo C 1 uF)")
    c_par = 10e-12 * 8 + 50e-12  # 8 SEL (gia dinh ~10 pF/chan) + duong mach
    tau = 10e3 * c_par
    t = tau * math.log(4.11 / 0.45)
    print(f"  Cu (100k/1 uF): ngat sau {0.1*math.log(4.11/0.45):.3f} s (SEL tu 4.11 V xuong VIL 0.45 V)")
    print(f"  Moi (10k, C ky sinh ~{c_par*1e12:.0f} pF gia dinh): ngat sau {t*1e9:.0f} ns + tpd detector 9.9 us")
    print("  Bat: TMUX chi dan khi VDD (V3V3_DEV) hop le; JOY_VCC cung qua mux -> khong co cap nguoc luc ramp.")


def d_latch():
    head("D-LATCH LOAD_EN tu giu: Q6 DMG2305UX-7 (P) + Q7 DMN2075U-7 (N) + nut SW4 ON")
    # Q6: S=VPACK, D->R10(100k)->LOAD_EN, G=LATCH_G (R57 100k len VPACK, khong tu ngoai)
    # Q7: D=LATCH_G, S=GND, G=LOAD_EN qua 1M/1M (R58/R59). SW4: LATCH_G->1k->GND khi nhan.
    vth_n = (0.4, 1.0)    # DMN2075U-7 DS31837
    vth_p = (-0.9, -0.5)  # DMG2305UX-7 DS36196
    hi = [vp - (vp / 6.1e6 + vp / 2e6 + 0.2e-6) * r for vp, r in product((3.20, 4.20), rtol(100e3))]
    g_hi = [v * b / (a + b) for v in hi for a, b in product(rtol(1e6), rtol(1e6))]
    print(f"  LOAD_EN cao {min(hi):.2f}..{max(hi):.2f} V -> gate Q7 {min(g_hi):.2f}..{max(g_hi):.2f} V "
          f"(VGS(th) max {vth_n[1]} V) -> Q7 dan, giu LATCH_G thap")
    print(f"  LOAD_EN bi keo xuong (VOL <= 0.4 V) -> gate Q7 <= {0.4/2*1.02:.2f} V < VGS(th) min {vth_n[0]} V -> Q7 tat")
    for ciss in (0.5e-9, 1.5e-9):
        tau = 100e3 * ciss
        t = tau * math.log(4.2 / 0.5)
        print(f"  Q7 tat -> R57 keo LATCH_G len; Ciss gia dinh {ciss*1e9:.1f} nF: Q6 tat sau <= {t*1e6:.0f} us")
    print("  -> Moi tin hieu chan dai hon ~0.4 ms deu xoa quyen bat. RESET TPS3808 giu thap >= tD 12 ms.")
    for vp in (3.20, 4.20):
        vg = vp * 1e3 / (100e3 + 1e3)
        print(f"  Nhan SW4 @VPACK {vp} V: LATCH_G = {vg:.3f} V, VGS Q6 = {vg-vp:.2f} V (can < {vth_p[0]} V; VGSS +/-8 V)")
    print("  Cam pack: LATCH_G = VPACK qua R57, VGS 0 -> OFF mac dinh. Chi bat lai khi nhan SW4.")
    print("  Nhan SW4 khi co USB/UV/dut sense: phan tu keo xuong thang 100k -> LOAD_EN van thap -> nha nut la OFF.")
    print(f"  Dong khi OFF: 0 qua R10/R57; khi ON: R57 {4.2/100e3*1e6:.0f} uA + chia ap gate Q7 {4.2/2e6*1e6:.1f} uA")


def d_robot_v2():
    head("D-ROBOT2 Latch EN_NODE, eFuse DevKit, pass VBUS robot, tre CE (07/11)")
    # Latch: Q6R P-MOS S=VPACK2, G=LATCH2_G; R57R 100k G-S; SW4R qua 100k xuong GND;
    # Q7R N-MOS D->100k->LATCH2_G, G=EN_NODE. VGS Q6R = -VPACK2/2 khi bat/giu.
    for vp in (6.24, 8.40):
        vgs = -vp * 100e3 / 200e3
        print(f"  VPACK2 {vp} V: VGS Q6R khi nhan/giu = {vgs:.2f} V (VGS(th) max -0.9 V, VGSS +/-8 V)")
    en = [vp * b / (a + b) for a, b in product(rtol(100e3), rtol(68e3)) for vp in (6.418, 8.4)]
    print(f"  EN_NODE khi giu: {min(en):.2f}..{max(en):.2f} V -> Q7R dan (VGS(th) max 1.0 V)")
    print(f"  Veto keo EN_NODE: dong chim {8.4/100e3*1e6:.0f} uA, VOL << 0.25 V (spec @5 mA) < VGS(th) min 0.4 V")
    print("  Q6R nha sau tau = 100k x Ciss (0.1-0.3 ms). Khong tu tren LATCH2_G.")
    # eFuse DevKit robot: TPS259474L IN=V5_R, OUT=V5_DEV, EN=EN_NODE qua 10k
    print(f"  eFuse DevKit robot: EN = EN_NODE {min(en):.2f}..{max(en):.2f} V (> 1.223 V, <= 5 V khuyen nghi); RILM 5.11k")
    # Tre bat CE: Q3 drain -> R63 10k -> gate Q2; R32 100k + C31 1 uF xuong GND
    tau = par(10e3, 100e3) * 1e-6
    for vdd in (3.25, 3.35):
        vf = vdd * 100 / 110
        t = -tau * math.log(1 - 1.0 / vf)
        print(f"  CE: V3V3_USB {vdd} V -> gate Q2 cuoi {vf:.2f} V; vuot VGS(th) max 1.0 V sau {t*1e3:.1f} ms")
    tmin = -tau * math.log(1 - 0.4 / (3.35 * 100 / 110))
    print(f"  Xung OUT1 thap ngan hon {tmin*1e3:.1f} ms khong the bat sac (gate chua toi VGS(th) min 0.4 V)")
    print("  Mat attach/VBUS: OUT1 = H hoac VDD = 0 -> Q3 tat -> C31 xa qua R32 -> CE len theo REGN; REGN mat thi IC khong sac.")


def d_delta_h():
    head("D-DELTA-H Delta tay cam theo review 06/11 (box02/box08)")
    ciss_n, ciss_p = 594.3e-12, 808e-12   # typ: DS31837 Rev 7, DS36196 Rev 8 (khong co max -> guard x2)
    # 1) LOAD_EN: R10 47k qua Q6; R_pd 220k; Q7 gate qua 1M/2M; PG pull-up 1M (khi PG thap)
    def load_en(vp, r10, extra):
        g = 1 / 220e3 + 1 / 3e6 + 1 / 6.1e6 + extra
        return vp * (1 / r10) / (1 / r10 + g)
    for tag, extra in (("PG da len", 0.0), ("PG con thap (khoi dong)", 1 / 1e6)):
        v = [load_en(vp, r, extra) for vp in (3.20, 4.20) for r in rtol(47e3)]
        print(f"  LOAD_EN cao ({tag}): {min(v):.2f}..{max(v):.2f} V; gate Q7 (x2/3) {min(v)*2/3:.2f}..{max(v)*2/3:.2f} V")
    print(f"  LOAD_EN khi Q6 tat: IDSS Q6 <= 1 uA x 205k = {1e-6*par(220e3, 3e6)*1e3:.0f} mV (< SEL VIL 0.45 V, < boost VEN_L 0.35 V)")
    print(f"  LOAD_EN khi bi veto: dong chim {4.2/47e3*1e6:.0f} uA; VOL <= 0.40 V (TPS3808 @1 mA) / 0.25 V (TLV6710 @3 mA)")
    print(f"  SEL khi veto: <= 0.40 V + 10k x 1 uA = 0.41 V < VIL 0.45 V (bien 40 mV, gioi han boi TPS3808)")
    # 2) SW4 kich theo suon: SW4 VPACK->A; A 1M xuong GND; C_t 22 nF A->G_trig; G_trig 100k xuong GND
    for c in (22e-9 * 0.9, 22e-9 * 1.1):
        tau = 100e3 * 1.01 * (c + ciss_n)
        ton_min = (100e3 * 0.99 * (c + ciss_n)) * math.log(3.20 / 1.0)
        ton_max = tau * math.log(4.20 / 0.4)
        print(f"  Xung kich C_t {c*1e9:.1f} nF: Q_trig dan {ton_min*1e3:.2f}..{ton_max*1e3:.2f} ms")
    t_latch = (par(1e6, 2e6) * ciss_n * 2) * math.log(1 / (1 - 1.0 / (2.6 * 2 / 3)))
    print(f"  Thoi gian Q7 bat (Ciss x2 guard): {t_latch*1e3:.2f} ms < xung kich min -> chot duoc")
    print("  Cam pack khi dang giu SW4: xung <= 5.8 ms < RESET TPS3808 tD min 12 ms -> RESET van giu LOAD_EN thap -> khong chot")
    print("  Giu SW4 xuyen qua veto roi het veto: khong co xung moi -> giu OFF. Can nha va nhan lai.")
    print(f"  Q6 nha sau veto: tau R57 x Ciss_p = {100e3*ciss_p*1e6:.0f} us typ (guard x2: {200e3*ciss_p*1e6:.0f} us)")
    # 3) PG timeout: X keo len LOAD_EN qua 1M, C 150 nF xuong GND; Q_pg (gate=PG_NODE) xa X khi PG cao
    for vle, rtol_, ctol in ((3.41, 0.99, 0.9), (2.60, 1.01, 1.1)):
        tau = 1e6 * rtol_ * 150e-9 * ctol
        vth = 0.403 if vle > 3 else 0.397
        t = tau * math.log(1 / (1 - vth / vle))
        print(f"  PG-timeout (LOAD_EN {vle} V): X vuot VIT+ sau {t*1e3:.1f} ms")
    sr = 2000e-12 / 2.2e-9
    print(f"  U6 bat: tD,ON <= 0.97 ms (2.7 V) .. 2.35 ms (12 V) + ramp toi PG 4.41 V / {sr:.2f} V/ms = {4.41/sr:.1f} ms -> <= ~7.2 ms typ")
    pg = [1.183 * (1 + a / b) for a, b in product(rtol(100e3), rtol(39.2e3))] + [1.223 * (1 + a / b) for a, b in product(rtol(100e3), rtol(39.2e3))]
    print(f"  PGTH 100k/39.2k: PG khi V5_DEV >= {min(pg):.2f}..{max(pg):.2f} V (V5_DEV min ~4.71 V)")
    # 4) Veto do thuc V5_BST cho pass (U10, VDD = VBUS_PROG)
    th = [v * (1 + a / b) for v in (0.397, 0.403) for a, b in product(rtol(100e3), rtol(68.1e3))]
    print(f"  U10 INB: V5_BST > {min(th):.2f}..{max(th):.2f} V -> chan EN_PASS")
    for c in (44e-6 * 0.8, 50e-6):
        t = 2.2e3 * c * math.log(5.165 / min(th))
        print(f"  Xa V5_BST qua 2.2k (C {c*1e6:.0f} uF): duoi nguong sau {t*1e3:.0f} ms; ton hao {5.0/2.2e3*1e3:.1f} mA @5 V")
    # 5) Ngan sach U9
    for r in (6.65e3,):
        lo, nom, hi = 0.425 / 1.01, 0.500, 0.575 / 0.99
        print(f"  U9 RILM 6.65k (diem bang 6.5): ILIM {lo:.3f}/{nom:.3f}/{hi:.3f} A; ITIMER 10 nF -> "
              f"{1.286*9e-9/2.5e-6*1e3:.1f}..{1.741*11e-9/1.2e-6*1e3:.1f} ms")
    # 6) Data USB
    print("  TS3USB221: OE H = ngat; IOFF <= 2 uA @VCC 0, VI/O 0-3.6 V (SCDS220M); VCC 2.3-3.6 V tu V3V3_DEV")
    vp = [v * b / (a + b) for v in (4.40, 5.50) for a, b in product(rtol(100e3), rtol(100e3))]
    print(f"  Q_D gate = VBUS_PASS/2: {min(vp):.2f}..{max(vp):.2f} V (> VGS(th) max 1.0 V) -> OE thap -> data noi")


def d_delta_r():
    head("D-DELTA-R Delta robot tuong ung delta tay cam (07/11)")
    ciss_n = 594.3e-12
    en_lo, en_hi = 2.57, 3.44   # EN_NODE khi cho phep (d_robot_v2)
    # 1) Veto do thuc V5_R cho pass U17 (U18 VDD = VBUS_PROG robot)
    th = [v * (1 + a / b) for v in (0.397, 0.403) for a, b in product(rtol(100e3), rtol(68.1e3))]
    print(f"  U18 INB: V5_R > {min(th):.2f}..{max(th):.2f} V -> chan EN2_PASS")
    for c in (44e-6 * 0.8, 60e-6):
        t = 2.2e3 * c * math.log(5.298 / min(th))
        print(f"  Xa V5_R qua 2.2k (C {c*1e6:.0f} uF): duoi nguong sau {t*1e3:.0f} ms; ton hao {5.0/2.2e3*1e3:.1f} mA")
    # 2) SW4R theo suon: VPACK2 -SW4R- 10k - A - 10k - GND; C_t 22 nF A->G; 100k G->GND
    for vp in (6.24, 8.40):
        step = vp / 2
        ton_min = 100e3 * 0.99 * (22e-9 * 0.9 + ciss_n) * math.log(step / 1.0)
        ton_max = 100e3 * 1.01 * (22e-9 * 1.1 + ciss_n) * math.log(step / 0.4)
        print(f"  SW4R @VPACK2 {vp} V: buoc gate {step:.2f} V (VGSS 8 V), xung {ton_min*1e3:.2f}..{ton_max*1e3:.2f} ms")
    tl = par(100e3, 68e3) * 3 * ciss_n * 2 * math.log(1 / (1 - 1.0 / en_lo))
    print(f"  EN_NODE len du de Q7R chot: {tl*1e6:.0f} us (3 gate, Ciss x2) << xung min")
    # 3) Giu OFF khi cam pack: C_p 1 uF VPACK2->P, R_p 22k P->GND, BZT52C5V6 kep P; Q_por keo EN_NODE
    t_hold = 22e3 * 0.99 * 1e-6 * 0.9 * math.log(5.2 / 1.0)
    print(f"  Q_por giu EN_NODE thap >= {t_hold*1e3:.0f} ms sau khi cam pack (> xung SW4R max 5.9 ms)")
    print("  VPACK2 ramp cham hon tau: P khong len -> khong giu; nhung SW4R chi tao xung khi nhan, khong khi giu.")
    # 4) PG-timeout U16 (U20), X tu EN_NODE qua 1M, C 150 nF
    for vle, rt, ct in ((en_hi, 0.99, 0.9), (en_lo, 1.01, 1.1)):
        tau = 1e6 * rt * 150e-9 * ct
        vth = 0.403 if vle > 3 else 0.397
        print(f"  PG-timeout U16 (EN_NODE {vle} V): {tau*math.log(1/(1-vth/vle))*1e3:.1f} ms")
    pg = [v * (1 + a / b) for v in (1.183, 1.223) for a, b in product(rtol(100e3), rtol(39.2e3))]
    print(f"  PGTH U16 100k/39.2k: PG khi V5_DEV >= {min(pg):.2f}..{max(pg):.2f} V (V5_R min 4.863 V - RON)")
    print("  U16 bat: tD,ON + ramp 0.91 V/ms toi 4.41 V ~ 6-7 ms typ (dVdT khong co min/max: TBD bench)")


if __name__ == "__main__":
    for f in (h1_tps61023, h2_tps25947, h3_tps3808, h4_detector, h5_tmux, h6_adc, h7_mcp73833, h8_usb,
              r1_bq25886, r2_uvlo, r3_tps54302, r4_tps63070, r5_motor_en, r6_isen, r7_vm_clamp,
              r8_ldo, r9_ctrl, r10_ipc,
              d_h2, d_h3, d_h4, d_h6, d_r1, d_r2, d_r5, d_r6, d_r9,
              d_ilim_v2, d_pass, d_sel_v2, d_latch, d_robot_v2, d_delta_h, d_delta_r):
        f()
