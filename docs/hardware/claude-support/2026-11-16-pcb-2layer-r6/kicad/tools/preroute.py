# -*- coding: utf-8 -*-
"""r6 (R5-01/R5-05): di tay cac duong nguon/sense TRUOC Freerouting.
DESIGN["preroute"] = [(net, "REF:PAD", "REF:PAD", width_mm, layers)], layers "F" hoac "FB" (cho phep via).
Moi doan: A* tren luoi 0,05 mm trong cua so quanh hai dau, khoang ho CLR toi moi dong khac net da co
(pad + track da pre-route truoc do). Thu tu trong danh sach = thu tu uu tien.
Ket qua ghi vao <board>/preroute.json; rip_ic.py doc file nay de KHONG go cac doan pre-route."""
import os, sys, json, math, heapq
import numpy as np
import pcbnew
M, F = pcbnew.ToMM, pcbnew.FromMM
G, VD, VIA_COST, CLR = 0.05, 0.6, 3.0, 0.19


def _route(b, D, net, sa, sb, TW, layers):
    W, H = D["size"]
    ni = b.FindNet("/" + net)
    if ni is None:
        return None, "khong co net"
    nc = ni.GetNetCode()
    pads = {(f.GetReference(), p.GetNumber()): p for f in b.GetFootprints() for p in f.Pads()}

    def ep(s):
        if "@" in s:     # diem cuoi track cung net: "x,y@F" hoac "x,y@B"
            xy, l = s.split("@"); x, y = map(float, xy.split(","))
            return x, y, [0 if l == "F" else 1], None
        p = pads[tuple(s.split(":"))]; c = p.GetPosition()
        ls = [k for k, L in ((0, pcbnew.F_Cu), (1, pcbnew.B_Cu)) if p.IsOnLayer(L) and (k == 0 or "B" in layers)]
        return M(c.x), M(c.y), ls, p
    ax, ay, al, pa = ep(sa); bx, by, bl, pb = ep(sb)
    if (pa and pa.GetNetCode() != nc) or (pb and pb.GetNetCode() != nc):
        return None, "pad khong thuoc net %s" % net
    x0, y0 = max(0.5, min(ax, bx) - 4), max(0.5, min(ay, by) - 4)
    x1, y1 = min(W - 0.5, max(ax, bx) + 4), min(H - 0.5, max(ay, by) + 4)
    nx, ny = int((x1 - x0) / G) + 1, int((y1 - y0) / G) + 1
    XX, YY = np.meshgrid(x0 + np.arange(nx) * G, y0 + np.arange(ny) * G)
    blocked = [np.zeros((ny, nx), bool), np.zeros((ny, nx), bool)]
    vblock = np.zeros((ny, nx), bool)
    edge = (XX < 0.5 + TW / 2) | (YY < 0.5 + TW / 2) | (XX > W - 0.5 - TW / 2) | (YY > H - 0.5 - TW / 2)
    blocked[0] |= edge; blocked[1] |= edge; vblock |= edge

    def seg(l, sx, sy, ex, ey, half):
        dx, dy = ex - sx, ey - sy; L = dx * dx + dy * dy
        u = np.zeros_like(XX) if L == 0 else np.clip(((XX - sx) * dx + (YY - sy) * dy) / L, 0, 1)
        d = np.hypot(XX - sx - u * dx, YY - sy - u * dy)
        blocked[l] |= d < half + TW / 2 + CLR; vblock[...] |= d < half + VD / 2 + CLR

    def rect(l, rx0, ry0, rx1, ry1, ex=0.0):
        d = np.hypot(np.maximum(np.maximum(rx0 - XX, 0), XX - rx1), np.maximum(np.maximum(ry0 - YY, 0), YY - ry1))
        blocked[l] |= d < TW / 2 + CLR + ex; vblock[...] |= d < VD / 2 + CLR + ex
    for t in b.GetTracks():
        if t.GetNetCode() == nc:
            continue
        if t.Type() == pcbnew.PCB_VIA_T:
            c = t.GetPosition()
            for l in (0, 1):
                seg(l, M(c.x), M(c.y), M(c.x), M(c.y), M(t.GetWidth(pcbnew.F_Cu)) / 2)
        else:
            s, e = t.GetStart(), t.GetEnd()
            seg(0 if t.GetLayer() == pcbnew.F_Cu else 1, M(s.x), M(s.y), M(e.x), M(e.y), M(t.GetWidth()) / 2)
    for p in pads.values():
        if p.GetNetCode() == nc and nc > 0:
            continue
        bb = p.GetBoundingBox()
        for l, L in ((0, pcbnew.F_Cu), (1, pcbnew.B_Cu)):
            if p.IsOnLayer(L):
                rect(l, M(bb.GetLeft()), M(bb.GetTop()), M(bb.GetRight()), M(bb.GetBottom()))
        if p.GetAttribute() == pcbnew.PAD_ATTRIB_NPTH:
            c = p.GetPosition(); r = M(p.GetDrillSize().x) / 2
            for l in (0, 1):
                seg(l, M(c.x), M(c.y), M(c.x), M(c.y), r)
    # khong di track F.Cu duoi than IC (giua cac hang chan): chan loi ben trong vung pad cua moi U*
    for f in (b.GetFootprints() if os.environ.get("NOCORE") != "1" else []):
        if not f.GetReference().startswith("U"):
            continue
        xs, ys = [], []
        for p in f.Pads():
            if p.IsOnLayer(pcbnew.F_Cu):
                bb = p.GetBoundingBox(); xs += [M(bb.GetLeft()), M(bb.GetRight())]; ys += [M(bb.GetTop()), M(bb.GetBottom())]
        if xs:
            rect(0, min(xs) + 0.4, min(ys) + 0.4, max(xs) - 0.4, max(ys) - 0.4, ex=-(TW / 2 + CLR) + 1e-3)
    # giu lan thoat cho moi chan IC (U*) thuoc net khac: keo dai pad 0,8 mm ra ngoai theo truc dai cua pad
    ESC = 0.8
    routed_pts = {}
    for t in b.GetTracks():
        if t.Type() == pcbnew.PCB_TRACE_T:
            routed_pts.setdefault(t.GetNetCode(), []).extend([(M(t.GetStart().x), M(t.GetStart().y)), (M(t.GetEnd().x), M(t.GetEnd().y))])

    def pad_routed(p):
        bb = p.GetBoundingBox(); a0, b0, a1, b1 = M(bb.GetLeft()), M(bb.GetTop()), M(bb.GetRight()), M(bb.GetBottom())
        return any(a0 - 1e-3 <= x <= a1 + 1e-3 and b0 - 1e-3 <= y <= b1 + 1e-3 for (x, y) in routed_pts.get(p.GetNetCode(), []))
    for f in b.GetFootprints():
        if not f.GetReference().startswith("U"):
            continue
        fc = f.GetPosition(); fx, fy = M(fc.x), M(fc.y)
        for p in f.Pads():
            if p.GetNetCode() == nc or not p.IsOnLayer(pcbnew.F_Cu) or pad_routed(p):
                continue      # chan da co duong ra: khong can giu lan
            bb = p.GetBoundingBox(); px0, py0, px1, py1 = M(bb.GetLeft()), M(bb.GetTop()), M(bb.GetRight()), M(bb.GetBottom())
            cx_, cy_ = (px0 + px1) / 2, (py0 + py1) / 2
            if (px1 - px0) > 1.2 and (py1 - py0) > 1.2:
                continue          # EP / pad lon: khong can lan thoat
            if (px1 - px0) >= (py1 - py0):
                if cx_ > fx: px1 += ESC
                else: px0 -= ESC
            else:
                if cy_ > fy: py1 += ESC
                else: py0 -= ESC
            rect(0, px0, py0, px1, py1)
    for (kx0, ky0, kx1, ky1) in D.get("b_track_keepout", []):
        rect(1, kx0, ky0, kx1, ky1, ex=-CLR)
    for (kx0, ky0, kx1, ky1) in D.get("keepout", []):
        for l in (0, 1):
            rect(l, kx0, ky0, kx1, ky1, ex=-CLR)
    if "B" not in layers:
        blocked[1][:] = True; vblock[:] = True

    def cell(x, y):
        return min(ny - 1, max(0, int(round((y - y0) / G)))), min(nx - 1, max(0, int(round((x - x0) / G))))
    # ben trong pad cung net: cho phep di (tam pad -> mep pad)
    for (p, px, py, pl) in ((pa, ax, ay, al), (pb, bx, by, bl)):
        if p is None:
            j, i = cell(px, py)
            for l in pl:
                blocked[l][max(0, j - 1):j + 2, max(0, i - 1):i + 2] = False
            continue
        bb = p.GetBoundingBox()
        j0, i0 = cell(M(bb.GetLeft()), M(bb.GetTop())); j1, i1 = cell(M(bb.GetRight()), M(bb.GetBottom()))
        for l, L in ((0, pcbnew.F_Cu), (1, pcbnew.B_Cu)):
            if p.IsOnLayer(L):
                blocked[l][j0:j1 + 1, i0:i1 + 1] = False
    sj, si = cell(ax, ay); gj, gi = cell(bx, by)
    goal = {(l, gj, gi) for l in bl}
    starts = [(l, sj, si) for l in al]
    dist = {s: 0.0 for s in starts}; prev = {}
    pq = [(G * math.hypot(gj - sj, gi - si), 0.0, s) for s in starts]; heapq.heapify(pq)
    D8 = [(1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1)]
    found = None
    while pq:
        f_, g_, s = heapq.heappop(pq)
        if s in goal:
            found = s; break
        if g_ > dist.get(s, 1e18):
            continue
        l, j, i = s
        nb = []
        for (dj, di) in D8:
            jj, ii = j + dj, i + di
            if 0 <= jj < ny and 0 <= ii < nx and not blocked[l][jj, ii]:
                fcost, bcost = (3.0, 1.0) if layers == "BF" else (1.0, 1.5)   # "BF": uu tien B.Cu (ISEN qua via)
                nb.append(((l, jj, ii), G * math.hypot(dj, di) * (fcost if l == 0 else bcost)))
        if "B" in layers and not vblock[j, i] and not blocked[1 - l][j, i]:
            nb.append(((1 - l, j, i), VIA_COST))
        for (n_, c) in nb:
            ng = g_ + c
            if ng < dist.get(n_, 1e18):
                dist[n_] = ng; prev[n_] = s
                heapq.heappush(pq, (ng + G * math.hypot(n_[1] - gj, n_[2] - gi), ng, n_))
    if not found:
        return None, "khong tim duoc duong (mo rong %d o; start blocked=%s; goal blocked=%s)" % (
            len(dist), [bool(blocked[l][sj, si]) for l in (0, 1)], [bool(blocked[l][gj, gi]) for l in (0, 1)])
    seq = [found]
    while seq[-1] in prev:
        seq.append(prev[seq[-1]])
    seq.reverse()
    pts = [(x0 + s[2] * G, y0 + s[1] * G, s[0]) for s in seq]
    pts[0] = (ax, ay, pts[0][2]); pts[-1] = (bx, by, pts[-1][2])

    def visible(l, p, q):
        n_ = max(1, int(math.hypot(q[0] - p[0], q[1] - p[1]) / (G / 2)))
        for k in range(1, n_):
            j, i = cell(p[0] + (q[0] - p[0]) * k / n_, p[1] + (q[1] - p[1]) * k / n_)
            if blocked[l][j, i]:
                return False
        return True
    sm = [pts[0]]; k = 0
    while k < len(pts) - 1:
        nxt = k + 1
        for m in range(len(pts) - 1, k, -1):
            if all(pts[t][2] == pts[k][2] for t in range(k, m + 1)) and visible(pts[k][2], pts[k], pts[m]):
                nxt = m; break
        sm.append(pts[nxt]); k = nxt
    out, vias = [], []
    for a, c in zip(sm, sm[1:]):
        if a[2] != c[2]:
            vias.append((a[0], a[1])); continue
        if math.hypot(c[0] - a[0], c[1] - a[1]) > 1e-6:
            out.append((a[2], a[0], a[1], c[0], c[1]))
    added = []
    for (l, sx, sy, ex, ey) in out:
        t = pcbnew.PCB_TRACK(b); t.SetStart(pcbnew.VECTOR2I(F(sx), F(sy))); t.SetEnd(pcbnew.VECTOR2I(F(ex), F(ey)))
        t.SetWidth(F(TW)); t.SetLayer(pcbnew.F_Cu if l == 0 else pcbnew.B_Cu); t.SetNet(ni); t.SetLocked(True); b.Add(t)
        added.append(["F" if l == 0 else "B", round(sx, 4), round(sy, 4), round(ex, 4), round(ey, 4), TW])
    for (x, y) in vias:
        v = pcbnew.PCB_VIA(b); v.SetPosition(pcbnew.VECTOR2I(F(x), F(y))); v.SetViaType(pcbnew.VIATYPE_THROUGH)
        v.SetLayerPair(pcbnew.F_Cu, pcbnew.B_Cu); v.SetWidth(pcbnew.F_Cu, F(VD)); v.SetDrill(F(0.3)); v.SetNet(ni); v.SetLocked(True); b.Add(v)
        added.append(["V", round(x, 4), round(y, 4)])
    L = sum(math.hypot(e[3] - e[1], e[4] - e[2]) for e in added if e[0] in "FB")
    return added, "ok %.2f mm, %d via" % (L, len(vias))


def apply(b, D, outdir):
    log, reg = [], []
    for (net, a, c, w, layers) in D.get("preroute", []):
        added, msg = _route(b, D, net, a, c, w, layers)
        log.append("%-10s %-8s -> %-8s w%.2f %s" % (net, a, c, w, msg))
        if added:
            reg.append(dict(net=net, a=a, b=c, w=w, items=added))
    json.dump(reg, open(os.path.join(outdir, "preroute.json"), "w", encoding="utf-8"), indent=1)
    print("\n".join("PRE " + x for x in log))
    return log


def key_of(t):
    if t.Type() == pcbnew.PCB_VIA_T:
        c = t.GetPosition(); return ("V", round(M(c.x), 3), round(M(c.y), 3))
    s, e = t.GetStart(), t.GetEnd()
    return ("F" if t.GetLayer() == pcbnew.F_Cu else "B", round(M(s.x), 3), round(M(s.y), 3), round(M(e.x), 3), round(M(e.y), 3))


def load_keys(outdir):
    p = os.path.join(outdir, "preroute.json")
    keys = set()
    if os.path.exists(p):
        for r in json.load(open(p, encoding="utf-8")):
            for it in r["items"]:
                keys.add(("V", round(it[1], 3), round(it[2], 3)) if it[0] == "V" else (it[0],) + tuple(round(v, 3) for v in it[1:5]))
    return keys
