"""Attach known KiCad package bodies to selected imported Arduino footprints.

The source Eagle designs remain untouched. Outputs are separate KiCad boards;
the linked 3D bodies depict package geometry, not manufacturer-specific scans.
"""
from pathlib import Path
import math
import re

ROOT = Path(__file__).parent
KICAD_FOOTPRINTS = Path(r"C:\Program Files\KiCad\9.0\share\kicad\footprints")
BOARDS = {
    "arduino-uno-r3-official-import.kicad_pcb": {
        "U1": "Package_TO_SOT_SMD.3dshapes/SOT-223.step",
        "U2": "Package_TO_SOT_SMD.3dshapes/SOT-23-5.step",
        "U3": "Package_DFN_QFN.3dshapes/QFN-32-1EP_5x5mm_P0.5mm_EP3.45x3.45mm.step",
        "ZU4": "Package_DIP.3dshapes/DIP-28_W7.62mm.step",
        "U5": "Package_SO.3dshapes/MSOP-8_3x3mm_P0.65mm.step",
        # The official PCB CAD defines solder-pad footprints for headers but
        # does not prove that a male/female header is fitted. Keep these pads
        # bare rather than rendering unsupported floating connector bodies.
        "RX0": "LED_SMD.3dshapes/LED_0805_2012Metric.step",
        "ON0": "LED_SMD.3dshapes/LED_0805_2012Metric.step",
        "TX0": "LED_SMD.3dshapes/LED_0805_2012Metric.step",
        "L0": "LED_SMD.3dshapes/LED_0805_2012Metric.step",
    },
    "arduino-nano-classic-official-import.kicad_pcb": {
        "IC1": "Package_SO.3dshapes/SSOP-28_3.9x9.9mm_P0.635mm.step",
        "IC2": "Package_TO_SOT_SMD.3dshapes/SOT-223.step",
        "IC3": "Package_DFN_QFN.3dshapes/QFN-32-1EP_5x5mm_P0.5mm_EP3.45x3.45mm.step",
        "J3": "Connector_USB.3dshapes/USB_Mini-B_Lumberg_2486_01_Horizontal.step",
        # J1/J2/J4 are unpopulated header solder-pad footprints in this CAD;
        # keep pads visible and don't invent installed connector bodies.
        "RX0": "LED_SMD.3dshapes/LED_0805_2012Metric.step",
        "TX0": "LED_SMD.3dshapes/LED_0805_2012Metric.step",
        "L0": "LED_SMD.3dshapes/LED_0805_2012Metric.step",
        "PWR0": "LED_SMD.3dshapes/LED_0805_2012Metric.step",
    },
    "arduino-mega-2560-r3-official-import.kicad_pcb": {
        "IC1": "Package_TO_SOT_SMD.3dshapes/SOT-223.step",
        "IC3": "Package_QFP.3dshapes/TQFP-100_14x14mm_P0.5mm.step",
        "IC4": "Package_DFN_QFN.3dshapes/QFN-32-1EP_5x5mm_P0.5mm_EP3.45x3.45mm.step",
        "IC6": "Package_TO_SOT_SMD.3dshapes/SOT-23-5.step",
        "IC7": "Package_SO.3dshapes/MSOP-8_3x3mm_P0.65mm.step",
        # Header locations are pads in the board CAD, not fitted headers.
        "RX0": "LED_SMD.3dshapes/LED_0805_2012Metric.step",
        "ON0": "LED_SMD.3dshapes/LED_0805_2012Metric.step",
        "TX0": "LED_SMD.3dshapes/LED_0805_2012Metric.step",
        "L0": "LED_SMD.3dshapes/LED_0805_2012Metric.step",
    },
}
PACKAGE_MODELS = {
    "C0603-ROUND": "Capacitor_SMD.3dshapes/C_0603_1608Metric.step",
    "R0603-ROUND": "Resistor_SMD.3dshapes/R_0603_1608Metric.step",
    # Eagle package names used by the official Arduino layouts. These map to
    # generic package envelopes with matching pad frames; they are not claims
    # about exact manufacturer markings or values.
    "0805": "Resistor_SMD.3dshapes/R_0805_2012Metric.step",
    "0603-1608X90N": "Resistor_SMD.3dshapes/R_0603_1608Metric.step",
    "CHIP-LED0805": "LED_SMD.3dshapes/LED_0805_2012Metric.step",
    "CHIPLED_0805": "LED_SMD.3dshapes/LED_0805_2012Metric.step",
    "DIL28-3": "Package_DIP.3dshapes/DIP-28_W7.62mm.step",
    "MLF32": "Package_DFN_QFN.3dshapes/QFN-32-1EP_5x5mm_P0.5mm_EP3.45x3.45mm.step",
    "VQFN32": "Package_DFN_QFN.3dshapes/QFN-32-1EP_5x5mm_P0.5mm_EP3.45x3.45mm.step",
    "MSOP08": "Package_SO.3dshapes/MSOP-8_3x3mm_P0.65mm.step",
    "TQFP100": "Package_QFP.3dshapes/TQFP-100_14x14mm_P0.5mm.step",
    "SOT23-DBV": "Package_TO_SOT_SMD.3dshapes/SOT-23-5.step",
    "SOT223": "Package_TO_SOT_SMD.3dshapes/SOT-223.step",
    "LINEAR_SOT223": "Package_TO_SOT_SMD.3dshapes/SOT-223.step",
    "L1812": "Inductor_SMD.3dshapes/L_1812_4532Metric.step",
    "CAY16": "Resistor_SMD.3dshapes/R_Array_Concave_4x0603.step",
    "MINIMELF": "Diode_SMD.3dshapes/D_MiniMELF.step",
    "PANASONIC_D": "Capacitor_Tantalum_SMD.3dshapes/CP_EIA-7343-31_Kemet-D.step",
}
PAD_ALIASES = {"A": "2", "C": "1", "+": "1", "-": "2"}


def footprint_blocks(text: str):
    cursor = 0
    while True:
        match = re.search(r'\(footprint "', text[cursor:])
        if not match:
            return
        start = cursor + match.start()
        depth, quoted, escaped = 0, False, False
        for end in range(start, len(text)):
            char = text[end]
            if quoted:
                if escaped:
                    escaped = False
                elif char == "\\":
                    escaped = True
                elif char == '"':
                    quoted = False
            elif char == '"':
                quoted = True
            elif char == "(":
                depth += 1
            elif char == ")":
                depth -= 1
                if depth == 0:
                    break
        block = text[start:end + 1]
        ref = re.search(r'\(property "Reference" "([^"]+)"', block)
        yield start, end + 1, ref.group(1) if ref else "", block
        cursor = end + 1


def pad_positions(block: str, *, normalize_aliases: bool = False):
    """Read pad-number to local XY coordinate mapping from a KiCad footprint."""
    positions = {}
    for number, x, y in re.findall(
        r'\(pad\s+"([^"\n]+)"[^)]*?\(at\s+([-+\d.eE]+)\s+([-+\d.eE]+)',
        block,
    ):
        if normalize_aliases:
            number = PAD_ALIASES.get(number, number)
        positions[number] = (float(x), float(y))
    return positions


def footprint_block(text: str):
    """Return the first complete footprint S-expression from a library file."""
    start = text.find('(footprint "')
    if start < 0:
        return None
    depth, quoted, escaped = 0, False, False
    for end in range(start, len(text)):
        char = text[end]
        if quoted:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == '"':
                quoted = False
        elif char == '"':
            quoted = True
        elif char == "(":
            depth += 1
        elif char == ")":
            depth -= 1
            if depth == 0:
                return text[start:end + 1]
    return None


def model_alignment(block: str, model: str):
    """Map the installed KiCad model footprint's pad frame onto imported pads."""
    model_path = Path(model)
    library_name = model_path.parent.name.replace(".3dshapes", ".pretty")
    footprint_path = KICAD_FOOTPRINTS / library_name / f"{model_path.stem}.kicad_mod"
    if not footprint_path.exists():
        raise SystemExit(f"Missing reference footprint for {model}: {footprint_path}")
    reference_block = footprint_block(footprint_path.read_text(encoding="utf-8"))
    source_pads = pad_positions(block, normalize_aliases=True)
    reference_pads = pad_positions(reference_block or "")
    common = sorted(set(source_pads) & set(reference_pads), key=lambda value: (not value.isdigit(), int(value) if value.isdigit() else value))
    if len(common) < 2:
        raise SystemExit(f"Not enough matching pad numbers to align {model}: {common}")

    source = [source_pads[number] for number in common]
    reference = [reference_pads[number] for number in common]
    candidates = []
    # Imported Eagle footprints may reverse their local Y axis. Compare both
    # frames so pad 1 stays aligned instead of guessing orientation by eye.
    for mirror_y in (False, True):
        framed = [(x, -y if mirror_y else y) for x, y in reference]
        sx = sum(x for x, _ in source) / len(source)
        sy = sum(y for _, y in source) / len(source)
        rx = sum(x for x, _ in framed) / len(framed)
        ry = sum(y for _, y in framed) / len(framed)
        cosine_term = sum((x - rx) * (u - sx) + (y - ry) * (v - sy) for (x, y), (u, v) in zip(framed, source))
        sine_term = sum((x - rx) * (v - sy) - (y - ry) * (u - sx) for (x, y), (u, v) in zip(framed, source))
        angle = math.atan2(sine_term, cosine_term)
        cos_a, sin_a = math.cos(angle), math.sin(angle)
        offset_x = sx - (cos_a * rx - sin_a * ry)
        offset_y = sy - (sin_a * rx + cos_a * ry)
        residual = max(
            math.hypot(cos_a * x - sin_a * y + offset_x - u, sin_a * x + cos_a * y + offset_y - v)
            for (x, y), (u, v) in zip(framed, source)
        )
        candidates.append((residual, offset_x, offset_y, math.degrees(angle), mirror_y))
    residual, offset_x, offset_y, angle, mirror_y = min(candidates)
    allowed_residual = (
        0.98 if model.startswith("Package_SO.3dshapes/SSOP-")
        else 0.35 if model.startswith("Package_QFP.3dshapes/TQFP-")
        else 0.80 if model.startswith("Capacitor_Tantalum_SMD.3dshapes/")
        else 0.20 if model.startswith("Resistor_SMD.3dshapes/R_Array_")
        else 0.15 if model.startswith(("LED_SMD.3dshapes/", "Capacitor_SMD.3dshapes/C_0603_", "Resistor_SMD.3dshapes/R_0603_"))
        else 0.22
    )
    if residual > allowed_residual:
        raise SystemExit(f"Pad geometry mismatch for {model}: max residual {residual:.3f} mm")
    return offset_x, offset_y, angle, mirror_y


for filename, references in BOARDS.items():
    source = ROOT / filename
    text = source.read_text(encoding="utf-8")
    updates = []
    found = set()
    for start, end, reference, block in footprint_blocks(text):
        footprint_name = re.match(r'\(footprint "([^"]+)"', block)
        model = references.get(reference) or PACKAGE_MODELS.get(footprint_name.group(1) if footprint_name else "")
        if not model:
            continue
        found.add(reference)
        if "\n\t\t(model " in block:
            raise SystemExit(f"Existing model entry in {filename}:{reference}; refusing duplicate")
        # Imported CAD origins and rotations differ from KiCad library origins.
        # Align every mapped model to its numbered pads, not just pin headers.
        if model.startswith("Connector_USB."):
            # USB shell geometry uses mechanical tabs, cut-outs and anchors that
            # differ between vendor variants; retain the centered footprint origin.
            model_x, model_y, model_rotation_z, mirror_y = 0.0, 0.0, 0.0, False
        else:
            model_x, model_y, model_rotation_z, mirror_y = model_alignment(block, model)
        entry = (
            '\n\t\t(model "${KICAD9_3DMODEL_DIR}/' + model + '"\n'
	            f'\t\t\t(offset (xyz {model_x:g} {model_y:g} 0))\n'
            f'\t\t\t(scale (xyz 1 {-1 if mirror_y else 1} 1))\n'
            f'\t\t\t(rotate (xyz 0 0 {model_rotation_z:g}))\n'
            '\t\t)'
        )
        updates.append((end - 1, entry))
    missing = set(references) - found
    if missing:
        raise SystemExit(f"Could not find references in {filename}: {', '.join(sorted(missing))}")
    for offset, entry in reversed(updates):
        text = text[:offset] + entry + text[offset:]
    output = ROOT / filename.replace("-official-import.kicad_pcb", "-viewer.kicad_pcb")
    output.write_text(text, encoding="utf-8")
    print(f"{output.name}: linked {len(found)} package models")
