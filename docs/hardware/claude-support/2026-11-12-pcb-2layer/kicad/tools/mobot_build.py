# -*- coding: utf-8 -*-
"""MoBot EVT0 generator: schematic (net-label style), placement, grid router, board.
Run with KiCad's bundled Python:  python.exe mobot_build.py handset|robot [--noroute]
"""
import sys, os, json, uuid, math, heapq, time, importlib
import numpy as np
import pcbnew

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
KICAD = os.path.dirname(os.path.dirname(pcbnew.__file__)) if False else None
FPDIR = os.environ.get("KICAD_FP", r"D:\StartupOS\.tools\kicad-10.0.7\share\kicad\footprints")
MM = pcbnew.FromMM
TOMM = pcbnew.ToMM


def U():
    return str(uuid.uuid4())


# ------------------------------------------------------------------ footprints
def fp_dir(lib):
    if lib == "mobot":
        return os.path.join(ROOT, "lib", "mobot.pretty")
    return os.path.join(FPDIR, lib + ".pretty")


def load_fp(fpid):
    lib, name = fpid.split(":")
    fp = pcbnew.FootprintLoad(fp_dir(lib), name)
    if fp is None:
        raise SystemExit("footprint not found: " + fpid)
    return fp


def padkey(n):
    s = "".join(ch for ch in n if ch.isdigit())
    a = "".join(ch for ch in n if not ch.isdigit())
    return (a, int(s) if s else 0)


# ------------------------------------------------------------------ schematic
def q(s):
    return '"' + str(s).replace("\\", "\\\\").replace('"', '\\"') + '"'


FONT = "(effects (font (size 1.27 1.27)))"
FONTH = "(effects (font (size 1.27 1.27)) (hide yes))"


def sym_geometry(pins):
    """return dict pin -> (x, y, angle) in symbol coords (y up), and box"""
    n = len(pins)
    geo = {}
    if n == 0:
        return geo, (-2.54, 2.54, 2.54, -2.54)
    if n <= 2:
        geo[pins[0]] = (-5.08, 0, 0)
        if n == 2:
            geo[pins[1]] = (5.08, 0, 180)
        return geo, (-2.54, 1.27, 2.54, -1.27)
    nl = (n + 1) // 2
    top = 2.54 * (nl - 1) / 2.0
    top = round(top / 2.54) * 2.54 + (1.27 if (nl % 2 == 0) else 0)
    for i, p in enumerate(pins[:nl]):
        geo[p] = (-12.7, top - 2.54 * i, 0)
    for i, p in enumerate(pins[nl:]):
        geo[p] = (12.7, top - 2.54 * i, 180)
    return geo, (-10.16, top + 2.54, 10.16, top - 2.54 * (nl - 1) - 2.54)


def lib_symbol(name, pins, names):
    geo, box = sym_geometry(pins)
    o = ['(symbol %s (pin_names (offset 0.508)%s) (exclude_from_sim no) (in_bom yes) (on_board yes)' % (
        q("mobot:" + name), " (hide yes)" if len(pins) <= 2 else "")]
    o.append('(property "Reference" "U" (at 0 %.2f 0) %s)' % (box[1] + 1.27, FONT))
    o.append('(property "Value" "" (at 0 %.2f 0) %s)' % (box[3] - 1.27, FONT))
    o.append('(property "Footprint" "" (at 0 0 0) %s)' % FONTH)
    o.append('(property "Datasheet" "" (at 0 0 0) %s)' % FONTH)
    o.append('(property "Description" "" (at 0 0 0) %s)' % FONTH)
    o.append('(symbol %s (rectangle (start %.2f %.2f) (end %.2f %.2f) (stroke (width 0.254) (type default)) (fill (type background))))' % (
        q(name + "_0_1"), box[0], box[1], box[2], box[3]))
    o.append('(symbol %s' % q(name + "_1_1"))
    for p in pins:
        x, y, a = geo[p]
        o.append('(pin passive line (at %.2f %.2f %d) (length 2.54) (name %s %s) (number %s %s))' % (
            x, y, a, q(names.get(p, "~")), FONT, q(p), FONT))
    o.append('))')
    return "\n".join(o), geo, box


def write_schematic(design, parts, path, project):
    root = U()
    libs, out, symcache = [], [], {}
    paper = design.get("paper", "A1")
    PW = {"A0": 1189, "A1": 841, "A2": 594}[paper]
    PH = {"A0": 841, "A1": 594, "A2": 420}[paper]
    blocks = {}
    for p in parts:
        blocks.setdefault(p["block"], []).append(p)
    cx, cy, colw = 25.4, 30.48, 0
    maxy = PH - 25
    for bname, plist in blocks.items():
        # measure block
        cells = []
        for p in plist:
            pins = p["pins"]
            sig = (tuple(pins), tuple(sorted(p["names"].items())))
            if sig not in symcache:
                nm = "S%d_%d" % (len(pins), len(symcache))
                txt, geo, box = lib_symbol(nm, pins, p["names"])
                symcache[sig] = (nm, geo, box)
                libs.append(txt)
            nm, geo, box = symcache[sig]
            lab = max([len(str(p["nets"].get(k) or "")) for k in pins] + [4])
            L = 1.1 * lab + 4
            w = (box[2] - box[0]) + 2 * (2.54 + 2.54 + L) if len(pins) else 20
            h = (box[1] - box[3]) + 12.7
            w = math.ceil(w / 2.54) * 2.54
            h = math.ceil(h / 2.54) * 2.54
            cells.append((p, nm, geo, box, w, h))
        BW = 370.0
        rows, row, rw = [], [], 0
        for c in cells:
            if rw + c[4] > BW and row:
                rows.append(row); row, rw = [], 0
            row.append(c); rw += c[4]
        if row:
            rows.append(row)
        bh = sum(max(c[5] for c in r) for r in rows) + 12.7
        if cy + bh > maxy and cy > 31:
            cx += BW + 20; cy = 30.48
        out.append('(text %s (exclude_from_sim no) (at %.2f %.2f 0) (effects (font (size 3 3) (bold yes)) (justify left bottom)) (uuid %s))' % (
            q(bname), cx, cy - 2.54, q(U())))
        y = cy + 5.08
        for r in rows:
            rh = max(c[5] for c in r)
            x = cx
            for (p, nm, geo, box, w, h) in r:
                X = round((x + w / 2) / 2.54) * 2.54
                Y = round((y + rh / 2) / 2.54) * 2.54
                o = ['(symbol (lib_id %s) (at %.2f %.2f 0) (unit 1) (exclude_from_sim no) (in_bom %s) (on_board yes) (dnp %s) (uuid %s)' % (
                    q("mobot:" + nm), X, Y, "no" if p.get("nobom") else "yes", "yes" if p.get("dnp") else "no", q(U()))]
                o.append('(property "Reference" %s (at %.2f %.2f 0) %s)' % (q(p["ref"]), X, Y - box[1] - 1.9, FONT))
                o.append('(property "Value" %s (at %.2f %.2f 0) %s)' % (q(p["value"]), X, Y - box[3] + 1.9, FONT))
                o.append('(property "Footprint" %s (at %.2f %.2f 0) %s)' % (q(p["fp"]), X, Y, FONTH))
                o.append('(property "Datasheet" "" (at %.2f %.2f 0) %s)' % (X, Y, FONTH))
                o.append('(property "Description" %s (at %.2f %.2f 0) %s)' % (q(p.get("desc", "")), X, Y, FONTH))
                o.append('(property "MPN" %s (at %.2f %.2f 0) %s)' % (q(p.get("mpn", "")), X, Y, FONTH))
                for k in p["pins"]:
                    o.append('(pin %s (uuid %s))' % (q(k), q(U())))
                o.append('(instances (project %s (path %s (reference %s) (unit 1)))))' % (q(project), q("/" + root), q(p["ref"])))
                out.append("\n".join(o))
                for k in p["pins"]:
                    px, py, a = geo[k]
                    sx, sy = X + px, Y - py
                    net = p["nets"].get(k)
                    if not net:
                        out.append('(no_connect (at %.2f %.2f) (uuid %s))' % (sx, sy, q(U())))
                        continue
                    ex = sx - 2.54 if a == 0 else sx + 2.54
                    out.append('(wire (pts (xy %.2f %.2f) (xy %.2f %.2f)) (stroke (width 0) (type default)) (uuid %s))' % (sx, sy, ex, sy, q(U())))
                    out.append('(label %s (at %.2f %.2f %d) (effects (font (size 1.27 1.27)) (justify %s bottom)) (uuid %s))' % (
                        q(net), ex, sy, 180 if a == 0 else 0, "right" if a == 0 else "left", q(U())))
                x += w
            y += rh
        cy = y + 15.24
    txt = ['(kicad_sch (version 20250114) (generator "mobot_build") (generator_version "9.0") (uuid %s) (paper %s)' % (q(root), q(paper)),
           '(title_block (title %s) (date "2026-11-13") (rev %s) (comment 1 "Sinh tự động từ tools/design_*.py — schematic dạng nhãn net"))' % (q(design["title"]), q(design.get("rev", "r3"))),
           '(lib_symbols', "\n".join(libs), ')', "\n".join(out),
           '(sheet_instances (path "/" (page "1"))) (embedded_fonts no))']
    open(path, "w", encoding="utf-8").write("\n".join(txt))
    d = os.path.dirname(path)
    lib = ['(kicad_symbol_lib (version 20241209) (generator "mobot_build") (generator_version "9.0")'] + \
          [t.replace('(symbol "mobot:', '(symbol "', 1) for t in libs] + [')']
    open(os.path.join(d, "mobot.kicad_sym"), "w", encoding="utf-8").write("\n".join(lib))
    open(os.path.join(d, "sym-lib-table"), "w", encoding="utf-8").write(
        '(sym_lib_table\n  (version 7)\n  (lib (name "mobot")(type "KiCad")(uri "${KIPRJMOD}/mobot.kicad_sym")(options "")(descr "MoBot generated symbols"))\n)\n')


def write_project(path, name, rules):
    pro = {
        "board": {"design_settings": {"defaults": {}, "rules": {
            "min_clearance": rules["clearance"], "min_track_width": 0.2, "min_via_diameter": 0.6,
            "min_through_hole_diameter": 0.3, "min_via_annular_width": 0.13, "min_copper_edge_clearance": 0.3,
            "min_hole_clearance": 0.15, "min_hole_to_hole": 0.25, "solder_mask_to_copper_clearance": 0.0}}},
        "net_settings": {"classes": [{"name": "Default", "clearance": rules["clearance"], "track_width": 0.2,
                                       "via_diameter": 0.6, "via_drill": 0.3, "microvia_diameter": 0.3,
                                       "microvia_drill": 0.1, "diff_pair_width": 0.2, "diff_pair_gap": 0.25,
                                       "diff_pair_via_gap": 0.25, "wire_width": 6, "bus_width": 12,
                                       "line_style": 0, "pcb_color": "rgba(0, 0, 0, 0.000)",
                                       "schematic_color": "rgba(0, 0, 0, 0.000)"}],
                         "meta": {"version": 3}},
        "meta": {"filename": name + ".kicad_pro", "version": 3},
        "schematic": {"legacy_lib_dir": "", "legacy_lib_list": []},
        "sheets": [], "text_variables": {}}
    json.dump(pro, open(path, "w", encoding="utf-8"), indent=1)
    open(os.path.join(os.path.dirname(path), "fp-lib-table"), "w", encoding="utf-8").write(
        '(fp_lib_table\n  (version 7)\n  (lib (name "mobot")(type "KiCad")(uri "${KIPRJMOD}/../lib/mobot.pretty")(options "")(descr "MoBot custom footprints"))\n)\n')


# ------------------------------------------------------------------ router
G = 0.05
CLS = {"s": 0.2, "m": 0.4, "w": 0.8}
VIA_D, VIA_DRILL = 0.6, 0.3


class Router:
    def __init__(self, W, H, clearance):
        self.nx = int(round(W / G)) + 1
        self.ny = int(round(H / G)) + 1
        self.c = clearance
        self.infl = {k: clearance + v / 2 + 0.03 for k, v in CLS.items()}
        self.infl["v"] = clearance + VIA_D / 2 + 0.03
        self.maps = {(k, l): np.zeros((self.ny, self.nx), np.int16) for k in self.infl for l in (0, 1)}
        self.tracks, self.vias, self.failed = [], [], []
        self.vmask = np.zeros((self.ny, self.nx), bool)
        self.nocorr = np.zeros((self.ny, self.nx), bool)
        self.hard = {(k, l): np.zeros((self.ny, self.nx), np.int16) for k in self.infl for l in (0, 1)}

    def vblock(self, x, y, r):
        ix0 = max(0, int((x - r) / G)); ix1 = min(self.nx - 1, int((x + r) / G) + 1)
        iy0 = max(0, int((y - r) / G)); iy1 = min(self.ny - 1, int((y + r) / G) + 1)
        self.vmask[iy0:iy1 + 1, ix0:ix1 + 1] = True

    def cell(self, x, y):
        return int(round(x / G)), int(round(y / G))

    def stamp(self, layers, x0, y0, x1, y1, net, hard=False):
        for k, r in self.infl.items():
            ix0 = max(0, int(math.floor((x0 - r) / G))); ix1 = min(self.nx - 1, int(math.ceil((x1 + r) / G)))
            iy0 = max(0, int(math.floor((y0 - r) / G))); iy1 = min(self.ny - 1, int(math.ceil((y1 + r) / G)))
            if ix1 < ix0 or iy1 < iy0:
                continue
            for l in layers:
                sub = self.maps[(k, l)][iy0:iy1 + 1, ix0:ix1 + 1]
                if net < 0:
                    sub[:] = -1
                else:
                    sub[(sub != 0) & (sub != net)] = -1
                    sub[sub == 0] = net
                if hard:
                    hs = self.hard[(k, l)][iy0:iy1 + 1, ix0:ix1 + 1]
                    hs[(hs != 0) & (hs != net)] = -1
                    hs[hs == 0] = net

    def free(self, k, l, ix, iy, net):
        v = self.maps[(k, l)].item(iy, ix)
        return v == 0 or v == net

    def astar(self, net, k, starts, goals, own, targets, limit=1200000):
        nx, ny = self.nx, self.ny
        mk = [self.maps[(k, 0)], self.maps[(k, 1)]]
        mv = [self.maps[("v", 0)], self.maps[("v", 1)]]
        hk = [self.hard[(k, 0)], self.hard[(k, 1)]]
        T = targets[:6]
        vm = self.vmask

        def h(ix, iy):
            b = 1 << 30
            for (tx, ty) in T:
                dx = abs(ix - tx); dy = abs(iy - ty)
                d = 10 * max(dx, dy) + 4 * min(dx, dy)
                if d < b:
                    b = d
            return b
        heap, best, prev = [], {}, {}
        for s in starts:
            best[s] = 0
            heapq.heappush(heap, (h(s[1], s[2]), 0, s))
        DIRS = ((1, 0, 10), (-1, 0, 10), (0, 1, 10), (0, -1, 10), (1, 1, 14), (1, -1, 14), (-1, 1, 14), (-1, -1, 14))
        n = 0
        while heap:
            f, g, s = heapq.heappop(heap)
            if best.get(s, 1 << 30) < g:
                continue
            if s in goals:
                path = [s]
                while s in prev:
                    s = prev[s]; path.append(s)
                return path[::-1]
            n += 1
            if n > limit:
                return None
            l, ix, iy = s
            m = mk[l]
            mul = 10 if l == 0 else 16
            for dx, dy, c in DIRS:
                jx, jy = ix + dx, iy + dy
                if jx < 0 or jy < 0 or jx >= nx or jy >= ny:
                    continue
                t = (l, jx, jy)
                v = m.item(jy, jx)
                if not (v == 0 or v == net):
                    if t not in own:
                        continue
                    hv = hk[l].item(jy, jx)
                    if not (hv == 0 or hv == net):
                        continue
                ng = g + c * mul // 10
                if ng < best.get(t, 1 << 30):
                    best[t] = ng; prev[t] = s
                    heapq.heappush(heap, (ng + h(jx, jy), ng, t))
            # via
            t = (1 - l, ix, iy)
            v0 = mv[0].item(iy, ix); v1 = mv[1].item(iy, ix); v2 = mk[1 - l].item(iy, ix)
            if (v0 == 0 or v0 == net) and (v1 == 0 or v1 == net) and (v2 == 0 or v2 == net) and not vm.item(iy, ix):
                ng = g + 500
                if ng < best.get(t, 1 << 30):
                    best[t] = ng; prev[t] = s
                    heapq.heappush(heap, (ng + h(ix, iy), ng, t))
        return None

    def commit(self, net, k, path, cells):
        w = CLS[k]
        segs, i = [], 0
        while i < len(path) - 1:
            a = path[i]; j = i + 1
            if path[j][0] != a[0]:
                x, y = a[1] * G, a[2] * G
                self.vias.append((net, x, y))
                self.vblock(x, y, 0.62)
                self.stamp((0, 1), x - VIA_D / 2, y - VIA_D / 2, x + VIA_D / 2, y + VIA_D / 2, net, True)
                i = j
                continue
            d = (path[j][1] - a[1], path[j][2] - a[2])
            while j + 1 < len(path) and path[j + 1][0] == a[0] and (path[j + 1][1] - path[j][1], path[j + 1][2] - path[j][2]) == d:
                j += 1
            b = path[j]
            self.tracks.append((net, a[0], a[1] * G, a[2] * G, b[1] * G, b[2] * G, w))
            if d[0] == 0 or d[1] == 0:
                self.stamp((a[0],), min(a[1], b[1]) * G - w / 2, min(a[2], b[2]) * G - w / 2,
                           max(a[1], b[1]) * G + w / 2, max(a[2], b[2]) * G + w / 2, net, True)
            else:
                steps = abs(b[1] - a[1])
                for t in range(0, steps + 1, 2):
                    x = (a[1] + d[0] * t) * G; y = (a[2] + d[1] * t) * G
                    self.stamp((a[0],), x - w / 2, y - w / 2, x + w / 2, y + w / 2, net, True)
                x, y = b[1] * G, b[2] * G
                self.stamp((a[0],), x - w / 2, y - w / 2, x + w / 2, y + w / 2, net, True)
            i = j
        for s in path:
            cells.add(s)


# ------------------------------------------------------------------ board
def courtyard_box(fp):
    xs, ys = [], []
    try:
        fp.BuildCourtyardCaches()
        for lay in (pcbnew.F_CrtYd, pcbnew.B_CrtYd):
            bb = fp.GetCourtyard(lay).BBox()
            if bb.GetWidth() > 0:
                xs += [bb.GetLeft(), bb.GetRight()]; ys += [bb.GetTop(), bb.GetBottom()]
    except Exception:
        pass
    for p in fp.Pads():
        bb = p.GetBoundingBox()
        xs += [bb.GetLeft() - MM(0.25), bb.GetRight() + MM(0.25)]; ys += [bb.GetTop() - MM(0.25), bb.GetBottom() + MM(0.25)]
    return TOMM(min(xs)), TOMM(min(ys)), TOMM(max(xs)), TOMM(max(ys))


def build(design_name, do_route=True):
    D = importlib.import_module("design_" + design_name).DESIGN
    outdir = os.path.join(ROOT, design_name)
    os.makedirs(outdir, exist_ok=True)
    proj = "mobot-" + design_name
    W, H = design_size = D["size"]
    clearance = D.get("clearance", 0.15)
    # resolve parts
    parts, fps = [], {}
    for p in D["parts"]:
        fp = load_fp(p["fp"])
        nums = sorted(set(pd.GetNumber() for pd in fp.Pads() if pd.GetNumber() != ""), key=padkey)
        for k in p["nets"]:
            if k not in nums:
                raise SystemExit("%s: pad %s not in footprint %s (has %s)" % (p["ref"], k, p["fp"], nums))
        p = dict(p); p["pins"] = nums; p.setdefault("names", {}); p.setdefault("block", "Khác")
        parts.append(p); fps[p["ref"]] = fp
    write_schematic(D, parts, os.path.join(outdir, proj + ".kicad_sch"), proj)
    write_project(os.path.join(outdir, proj + ".kicad_pro"), proj, {"clearance": clearance})
    # ---- board
    board = pcbnew.BOARD()
    board.GetDesignSettings().SetCopperLayerCount(2)
    nets = {}
    unets = {}

    def net(n):
        if n not in nets:
            ni = pcbnew.NETINFO_ITEM(board, "/" + n); board.Add(ni); nets[n] = ni
        return nets[n]
    # placement
    pos = dict(D["fixed"])
    for (x0, y0, x1, y1, refs, gap) in D["regions"]:
        cx, cy, rowh = x0, y0, 0
        for r in refs:
            rot = 0
            if isinstance(r, tuple):
                r, rot = r
            fp = fps[r]
            fp.SetPosition(pcbnew.VECTOR2I(0, 0)); fp.SetOrientationDegrees(rot)
            a = courtyard_box(fp)
            if r.startswith("U"):
                a = (a[0] - 1.0, a[1] - 1.0, a[2] + 1.0, a[3] + 1.0)
            w, h = a[2] - a[0], a[3] - a[1]
            if cx + w > x1 and cx > x0:
                cx = x0; cy += rowh + gap; rowh = 0
            if cy + h > y1 + 0.01:
                print("WARN region overflow", r, (x0, y0, x1, y1))
            pos[r] = (round((cx - a[0]) / G) * G, round((cy - a[1]) / G) * G, rot)
            cx += w + gap; rowh = max(rowh, h)
    for p in parts:
        fp = fps[p["ref"]]
        if p["ref"] not in pos:
            raise SystemExit("no position for " + p["ref"])
        x, y, rot = pos[p["ref"]]
        fp.SetOrientationDegrees(rot)
        fp.SetPosition(pcbnew.VECTOR2I(MM(x), MM(y)))
        fp.SetReference(p["ref"]); fp.SetValue(p["value"])
        lib, name = p["fp"].split(":")
        fp.SetFPID(pcbnew.LIB_ID(lib, name))
        fp.SetField("MPN", p.get("mpn", ""))
        try:
            fp.GetField("MPN").SetVisible(False)
        except Exception:
            pass
        if p.get("dnp"):
            try:
                fp.SetDNP(True)
            except Exception:
                pass
        board.Add(fp)
        for pd in fp.Pads():
            n = p["nets"].get(pd.GetNumber())
            if n:
                pd.SetNet(net(n))
            elif pd.GetNumber() != "":
                nm_ = p["names"].get(pd.GetNumber(), "")
                un = "unconnected-(%s-%sPad%s)" % (p["ref"], (nm_ + "-") if nm_ and nm_ != "~" else "", pd.GetNumber())
                if un not in unets:
                    ni_ = pcbnew.NETINFO_ITEM(board, un); board.Add(ni_); unets[un] = ni_
                pd.SetNet(unets[un])
    # outline
    pts = [(0, 0), (W, 0), (W, H), (0, H)]
    for i in range(4):
        s = pcbnew.PCB_SHAPE(board); s.SetShape(pcbnew.SHAPE_T_SEGMENT)
        s.SetStart(pcbnew.VECTOR2I(MM(pts[i][0]), MM(pts[i][1]))); s.SetEnd(pcbnew.VECTOR2I(MM(pts[(i + 1) % 4][0]), MM(pts[(i + 1) % 4][1])))
        s.SetLayer(pcbnew.Edge_Cuts); s.SetWidth(MM(0.1)); board.Add(s)
    for (txt, x, y, sz) in D.get("silk", []):
        t = pcbnew.PCB_TEXT(board); t.SetText(txt); t.SetPosition(pcbnew.VECTOR2I(MM(x), MM(y)))
        t.SetLayer(pcbnew.F_SilkS); t.SetTextSize(pcbnew.VECTOR2I(MM(sz), MM(sz))); t.SetTextThickness(MM(sz * 0.15)); board.Add(t)
    # ---- router setup
    R = Router(W, H, clearance)
    e = 0.45
    for (x0, y0, x1, y1) in ((0, 0, W, e), (0, H - e, W, H), (0, 0, e, H), (W - e, 0, W, H)):
        R.stamp((0, 1), x0, y0, x1, y1, -1)
    for (x0, y0, x1, y1) in D.get("keepout", []):
        R.stamp((0, 1), x0 + 0.3, y0 + 0.3, x1 - 0.3, y1 - 0.3, -1)
    nets.update({k: v for k, v in unets.items()})
    netid = {n: i + 1 for i, n in enumerate(sorted(nets))}
    padinfo = {}   # net -> list of dict
    for p in parts:
        for pd in fps[p["ref"]].Pads():
            bb = pd.GetBoundingBox()
            x0, y0, x1, y1 = TOMM(bb.GetLeft()), TOMM(bb.GetTop()), TOMM(bb.GetRight()), TOMM(bb.GetBottom())
            layers = tuple(l for l, L in ((0, pcbnew.F_Cu), (1, pcbnew.B_Cu)) if pd.IsOnLayer(L))
            nm = pd.GetNetname().lstrip("/")
            if not layers and pd.GetAttribute() != pcbnew.PAD_ATTRIB_NPTH:
                continue
            if pd.GetAttribute() == pcbnew.PAD_ATTRIB_NPTH:
                d = TOMM(pd.GetDrillSize().x) / 2 + 0.1
                c = pd.GetPosition()
                R.stamp((0, 1), TOMM(c.x) - d, TOMM(c.y) - d, TOMM(c.x) + d, TOMM(c.y) + d, -1)
                continue
            nid = netid.get(nm, -1)
            R.stamp(layers, x0, y0, x1, y1, nid)
            if len(layers) == 2:
                c = pd.GetPosition(); R.vblock(TOMM(c.x), TOMM(c.y), TOMM(pd.GetDrillSize().x) / 2 + 0.45)
            if nid > 0:
                c = pd.GetPosition()
                padinfo.setdefault(nm, []).append(dict(x=TOMM(c.x), y=TOMM(c.y), box=(x0, y0, x1, y1), layers=layers,
                                                         dim=min(x1 - x0, y1 - y0), ref=p["ref"], num=pd.GetNumber()))
    log = []
    for nm_, lst in padinfo.items():
        if nm_ == D.get("gnd", "GND"):
            continue
        for a in lst:
            if a["dim"] < 0.45 and len(a["layers"]) == 1:
                x0, y0, x1, y1 = a["box"]
                if (x1 - x0) >= (y1 - y0):
                    x0 -= 1.2; x1 += 1.2
                else:
                    y0 -= 1.2; y1 += 1.2
                R.nocorr[max(0, int((y0 - 0.5) / G)):int((y1 + 0.5) / G) + 1, max(0, int((x0 - 0.5) / G)):int((x1 + 0.5) / G) + 1] = True

    def own_cells(pads):
        s = set()
        for a in pads:
            x0, y0, x1, y1 = a["box"]
            if a["dim"] < 0.45 and len(a["layers"]) == 1:
                if (x1 - x0) >= (y1 - y0):
                    x0 -= 0.7; x1 += 0.7
                else:
                    y0 -= 0.7; y1 += 0.7
            for l in a["layers"]:
                for ix in range(int(math.ceil((x0 + 0.02) / G)), int(math.floor((x1 - 0.02) / G)) + 1):
                    for iy in range(int(math.ceil((y0 + 0.02) / G)), int(math.floor((y1 - 0.02) / G)) + 1):
                        s.add((l, ix, iy))
        return s
    t0 = time.time()
    if do_route:
        gnd = D.get("gnd", "GND")
        def gnd_pass(sel):
            # GND: via next to each SMD ground pad
            gid = netid.get(gnd)
            for a in padinfo.get(gnd, []):
                if len(a["layers"]) == 2 or not sel(a) or a.get("gdone"):
                    continue
                a["gdone"] = True
                own = own_cells([a])
                ix, iy = R.cell(a["x"], a["y"])
                k = "m" if a["dim"] >= 0.4 else "s"
                goals = set()
                r = int(4.0 / G)
                mv0, mv1, mb = R.maps[("v", 0)], R.maps[("v", 1)], R.maps[(k, 1)]
                sub = ((mv0[max(0, iy - r):iy + r, max(0, ix - r):ix + r] == 0) | (mv0[max(0, iy - r):iy + r, max(0, ix - r):ix + r] == gid)) & \
                      ((mv1[max(0, iy - r):iy + r, max(0, ix - r):ix + r] == 0) | (mv1[max(0, iy - r):iy + r, max(0, ix - r):ix + r] == gid))
                sub = sub & ~R.vmask[max(0, iy - r):iy + r, max(0, ix - r):ix + r] & ~R.nocorr[max(0, iy - r):iy + r, max(0, ix - r):ix + r]
                ys, xs = np.nonzero(sub)
                for yy, xx in zip(ys.tolist(), xs.tolist()):
                    goals.add((1, max(0, ix - r) + xx, max(0, iy - r) + yy))
                if not goals:
                    R.failed.append((gnd, a["ref"], a["num"])); log.append("FAIL GNDVIA(no via site) %s.%s" % (a["ref"], a["num"])); continue
                path = R.astar(gid, k, [(a["layers"][0], ix, iy)], goals, own, [(ix, iy)], limit=250000)
                if path is None:
                    R.failed.append((gnd, a["ref"], a["num"])); log.append("FAIL GNDVIA %s.%s" % (a["ref"], a["num"])); continue
                R.commit(gid, k, path, set())
                R.tracks.append((gid, path[0][0], a["x"], a["y"], path[0][1] * G, path[0][2] * G, CLS[k]))
        gnd_pass(lambda a: a["dim"] < 0.6 or a["ref"].startswith("U"))
        order = sorted((n for n in padinfo if n != gnd and len(padinfo[n]) > 1),
                       key=lambda n: (0 if min(a["dim"] for a in padinfo[n]) < 0.45 else 1000) + (max(a["x"] for a in padinfo[n]) - min(a["x"] for a in padinfo[n])) +
                                     (max(a["y"] for a in padinfo[n]) - min(a["y"] for a in padinfo[n])))
        for n in order:
            pads = padinfo[n]; nid = netid[n]
            nw = CLS[D.get("netclass", {}).get(n, "s")]
            own = own_cells(pads)
            pads = sorted(pads, key=lambda a: -a["dim"])
            conn = [pads[0]]; rest = pads[1:]
            cells = set()
            while rest:
                # nearest unconnected pad to connected set
                bi, bd = 0, 1e9
                for i, a in enumerate(rest):
                    d = min(abs(a["x"] - b["x"]) + abs(a["y"] - b["y"]) for b in conn)
                    if d < bd:
                        bi, bd = i, d
                a = rest.pop(bi)
                k = "s"
                for kk in ("w", "m", "s"):
                    if CLS[kk] <= min(nw, a["dim"]) + 1e-6:
                        k = kk; break
                ix, iy = R.cell(a["x"], a["y"])
                starts = [(l, ix, iy) for l in a["layers"]]
                goals = set(cells)
                for b in conn:
                    if b["dim"] + 1e-6 >= CLS[k] or not cells:
                        jx, jy = R.cell(b["x"], b["y"])
                        for l in b["layers"]:
                            goals.add((l, jx, jy))
                targets = [R.cell(b["x"], b["y"]) for b in sorted(conn, key=lambda b: abs(a["x"] - b["x"]) + abs(a["y"] - b["y"]))]
                path = R.astar(nid, k, starts, goals, own, targets)
                if path is None and k != "s":
                    k = "s"; path = R.astar(nid, k, starts, goals, own, targets)
                if path is None:
                    R.failed.append((n, a["ref"], a["num"]))
                    log.append("FAIL %s %s.%s" % (n, a["ref"], a["num"]))
                else:
                    R.commit(nid, k, path, cells)
                    R.tracks.append((nid, path[0][0], a["x"], a["y"], path[0][1] * G, path[0][2] * G, CLS[k]))
                conn.append(a)
    if do_route:
        gnd_pass(lambda a: True)
    idnet = {v: k for k, v in netid.items()}
    LAY = (pcbnew.F_Cu, pcbnew.B_Cu)
    for (nid, l, x0, y0, x1, y1, w) in R.tracks:
        if abs(x0 - x1) < 1e-6 and abs(y0 - y1) < 1e-6:
            continue
        t = pcbnew.PCB_TRACK(board)
        t.SetStart(pcbnew.VECTOR2I(MM(x0), MM(y0))); t.SetEnd(pcbnew.VECTOR2I(MM(x1), MM(y1)))
        t.SetWidth(MM(w)); t.SetLayer(LAY[l]); t.SetNet(nets[idnet[nid]]); board.Add(t)
    for (nid, x, y) in sorted(set((n_, round(x_, 3), round(y_, 3)) for (n_, x_, y_) in R.vias)):
        v = pcbnew.PCB_VIA(board); v.SetPosition(pcbnew.VECTOR2I(MM(x), MM(y)))
        v.SetViaType(pcbnew.VIATYPE_THROUGH); v.SetLayerPair(pcbnew.F_Cu, pcbnew.B_Cu)
        try:
            v.SetWidth(pcbnew.F_Cu, MM(VIA_D))
        except Exception:
            v.SetWidth(MM(VIA_D))
        v.SetDrill(MM(VIA_DRILL)); v.SetNet(nets[idnet[nid]]); board.Add(v)
    # zones
    gnd = D.get("gnd", "GND")
    for lay in LAY:
        z = pcbnew.ZONE(board); z.SetLayer(lay); z.SetNetCode(nets[gnd].GetNetCode())
        o = z.Outline(); o.NewOutline()
        for (x, y) in ((0.4, 0.4), (W - 0.4, 0.4), (W - 0.4, H - 0.4), (0.4, H - 0.4)):
            o.Append(MM(x), MM(y))
        z.SetMinThickness(MM(0.25)); z.SetLocalClearance(MM(0.25)); z.SetAssignedPriority(0)
        z.SetThermalReliefGap(MM(0.25)); z.SetThermalReliefSpokeWidth(MM(0.4)); z.SetPadConnection(pcbnew.ZONE_CONNECTION_THT_THERMAL)
        board.Add(z)
    for (x0, y0, x1, y1) in D.get("keepout", []):
        z = pcbnew.ZONE(board); z.SetIsRuleArea(True)
        ls = pcbnew.LSET(); ls.AddLayer(pcbnew.F_Cu); ls.AddLayer(pcbnew.B_Cu); z.SetLayerSet(ls)
        z.SetDoNotAllowZoneFills(True); z.SetDoNotAllowTracks(True); z.SetDoNotAllowVias(True)
        z.SetDoNotAllowPads(False); z.SetDoNotAllowFootprints(False)
        o = z.Outline(); o.NewOutline()
        for (x, y) in ((x0, y0), (x1, y0), (x1, y1), (x0, y1)):
            o.Append(MM(x), MM(y))
        board.Add(z)
    try:
        pcbnew.ZONE_FILLER(board).Fill(board.Zones())
    except Exception as ex:
        log.append("zone fill error: %r" % ex)
    pcbnew.SaveBoard(os.path.join(outdir, proj + ".kicad_pcb"), board)
    os.makedirs(os.path.join(ROOT, "..", "reports"), exist_ok=True)
    rep = os.path.join(ROOT, "..", "reports", design_name + "-route-log.txt")
    with open(rep, "w", encoding="utf-8") as f:
        f.write("parts %d nets %d tracks %d vias %d failed %d time %.0fs\n" % (len(parts), len(nets), len(R.tracks), len(R.vias), len(R.failed), time.time() - t0))
        f.write("\n".join(log) + "\n")
    print(open(rep, encoding="utf-8").read()[:3000])


if __name__ == "__main__":
    sys.path.insert(0, HERE)
    build(sys.argv[1], "--noroute" not in sys.argv)
