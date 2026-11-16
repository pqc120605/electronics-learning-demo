"""Attach KiCad library 3D bodies to imported footprints by fitting numbered pads.

usage: python scripts/attach-board-bodies.py board.kicad_pcb out.kicad_pcb config.json report.json

Writes only `out.kicad_pcb` and `report.json`; the input board is never modified.
Convention (verified 2026-11-14 on Uno ZU4 and ESP32-S3 U4 with kicad-cli 10.0.7): footprint
pads are Y-down while KiCad 3D model offset/rotate are Y-up. A fit `source = R(theta)*ref + t`
in the Y-down frame becomes model `rotate z = theta` (KiCad rotates models in the same sense
as footprints) and `offset = (tx, -ty)` (model offset Y points up). Checked by exporting 1xN headers:
with `-theta` each body grew from pin 1 the wrong way and sat one full header length off its pads.
`assets/boards/arduino-reference/attach_reference_models.py` writes `+ty`, which misplaced the
Uno DIP-28 socket by 7.62 mm; packages with symmetric pads hide that sign error.
"""
import json
import math
import re
import sys

LIB = 'D:/StartupOS/.tools/kicad-10.0.7/share/kicad/footprints'
MODELDIR = 'D:/StartupOS/.tools/kicad-10.0.7/share/kicad/3dmodels'


def pads_of(block):
    return [(name, float(x), float(y)) for name, x, y in re.findall(r'\(pad "([^"]*)" \w+ \w+\s*\(at ([-\d.]+) ([-\d.]+)', block)]


def fit(src, ref):
    best = None
    for mirror in (False, True):
        r = [(x, -y if mirror else y) for x, y in ref]
        sx = sum(x for x, _ in src) / len(src)
        sy = sum(y for _, y in src) / len(src)
        rx = sum(x for x, _ in r) / len(r)
        ry = sum(y for _, y in r) / len(r)
        c = sum((x - rx) * (u - sx) + (y - ry) * (v - sy) for (x, y), (u, v) in zip(r, src))
        s = sum((x - rx) * (v - sy) - (y - ry) * (u - sx) for (x, y), (u, v) in zip(r, src))
        a = math.atan2(s, c)
        ca, sa = math.cos(a), math.sin(a)
        tx = sx - (ca * rx - sa * ry)
        ty = sy - (sa * rx + ca * ry)
        res = max(math.hypot(ca * x - sa * y + tx - u, sa * x + ca * y + ty - v) for (x, y), (u, v) in zip(r, src))
        cand = (res, tx, ty, math.degrees(a), mirror)
        if best is None or cand < best:
            best = cand
    return best


def main():
    board_path, out_path, config_path, report_path = sys.argv[1:5]
    text = open(board_path, encoding='utf8').read()
    config = json.load(open(config_path, encoding='utf8'))
    blocks = re.split(r'(?m)^(?=\t\(footprint )', text)
    report = {}
    for i, block in enumerate(blocks):
        m = re.search(r'\(property "Reference" "([^"]+)"', block)
        if not m or m.group(1) not in config:
            continue
        ref = m.group(1)
        if '\n\t\t(model ' in block:
            raise SystemExit(f'{ref} already has a model')
        src_pads = {name: (x, y) for name, x, y in pads_of(block)}
        tried = []
        for cand in config[ref]:
            lib, name = cand['fp'].split('/')
            with open(f'{LIB}/{lib}.pretty/{name}.kicad_mod', encoding='utf8') as handle:
                mod = handle.read()
            ref_pads = {}
            for pname, x, y in pads_of(mod):
                ref_pads.setdefault(pname, (x, y))
            mapping = cand.get('map') or {p: p for p in src_pads if p in ref_pads}
            # A mapping value may be a pad name or explicit [x, y] (for footprints that repeat pad names).
            pairs = [(src_pads[s], tuple(r) if isinstance(r, list) else ref_pads[r]) for s, r in mapping.items() if s in src_pads and (isinstance(r, list) or r in ref_pads)]
            if len(pairs) < 2:
                tried.append((name, 'too few pads'))
                continue
            res, tx, ty, ang, mirror = fit([p[0] for p in pairs], [p[1] for p in pairs])
            tried.append((name, round(res, 3)))
            if res <= cand.get('tolerance', 0.35):
                model = cand['model']
                open(f'{MODELDIR}/{model}', 'rb').close()
                entry = ('\n\t\t(model "${KICAD10_3DMODEL_DIR}/' + model + '"\n'
                         f'\t\t\t(offset (xyz {tx:.4f} {-ty:.4f} {cand.get("z", 0)}))\n'
                         # rotateX 180 (body under the board) also negates model Y; undo that with scale Y.
                         f'\t\t\t(scale (xyz 1 {(-1 if mirror else 1) * (-1 if cand.get("rotateX", 0) == 180 else 1)} 1))\n'
                         f'\t\t\t(rotate (xyz {cand.get("rotateX", 0)} 0 {ang:.3f}))\n\t\t)')
                end = block.rstrip().rfind(')')
                blocks[i] = block[:end].rstrip() + entry + '\n\t)\n'
                report[ref] = {'footprint': cand['fp'], 'model': model, 'residualMm': round(res, 3), 'offset': [round(tx, 3), round(-ty, 3)], 'rotateZ': round(ang, 2), 'mirrorY': mirror}
                break
        else:
            report[ref] = {'error': 'no candidate within tolerance', 'tried': tried}
    with open(out_path, 'w', encoding='utf8', newline='') as handle:
        handle.write(''.join(blocks))
    with open(report_path, 'w', encoding='utf8') as handle:
        json.dump(report, handle, indent=1, ensure_ascii=False)
    print(json.dumps(report, ensure_ascii=False))


main()
