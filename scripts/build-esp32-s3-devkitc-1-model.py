#!/usr/bin/env python3
"""Build a reproducible educational reconstruction from Espressif's V1.1 PADS import.

This script preserves the vendor source and imported PCB. It writes derived KiCad
geometry plus a BOM/CAD inventory consumed by the board viewer. The imported
PADS board has known DRC defects and must not be used for fabrication.
"""
from __future__ import annotations

import hashlib
import json
import math
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BOARD_ID = "esp32-s3-devkitc-1"
ASSET = ROOT / "assets/boards/vendor/esp32-s3-devkitc-1"
SOURCE_ASC = ASSET / "work/ESP32-S3-DevKitC-1/02_PCB/PCB_ESP32-S3-DevKitC-1_V1.1_20220429.asc"
SOURCE_BOM = ASSET / "work/ESP32-S3-DevKitC-1/05_BOM/BOM(V0.3)_ESP32-S3-DevKitC-1_XX_TTNNVV.xlsx"
SOURCE_ARCHIVE = ASSET / "source/ESP32-S3-DevKitC-1_Reference_Design.zip"
IMPORTED_PCB = ASSET / "work/kicad-import/ESP32-S3-DevKitC-1_V1.1.kicad_pcb"
DERIVED = ASSET / "derived"
OUT_PCB = DERIVED / "ESP32-S3-DevKitC-1_V1.1-educational.kicad_pcb"
INVENTORY = ROOT / "src/data/esp32-s3-devkitc-1.inventory.json"
PIN_ANCHORS = ROOT / "src/data/esp32-s3-devkitc-1.pin-anchors.json"

K = 2.0 / 3.0 / 1_000_000.0  # Imported PADS coordinates are 2/3 scale; raw units are µm.
SOURCE_WIDTH_MM = 38.1
SOURCE_HEIGHT_MM = 94.2975
SOURCE_CORNER_RADIUS_MM = 1.0
BOARD_THICKNESS_MM = 1.6
BOARD_TOP_MM = BOARD_THICKNESS_MM - 0.05  # KiCad board model top surface in this GLB export.

MODEL_BY_VALUE = {
    "C0402": "Capacitor_SMD.3dshapes/C_0402_1005Metric.step",
    "C0603": "Capacitor_SMD.3dshapes/C_0603_1608Metric.step",
    "R0402": "Resistor_SMD.3dshapes/R_0402_1005Metric.step",
    "R0603": "Resistor_SMD.3dshapes/R_0603_1608Metric.step",
    "SOD123": "Diode_SMD.3dshapes/D_SOD-123.step",
    "SOD523": "Diode_SMD.3dshapes/D_SOD-523.step",
    "LED0603": "LED_SMD.3dshapes/LED_0603_1608Metric.step",
    "LED3535B": "LED_SMD.3dshapes/LED_WS2812B-Mini_PLCC4_3.5x3.5mm.step",
    "SOT23-3": "Package_TO_SOT_SMD.3dshapes/SOT-23.step",
    "SOT223": "Package_TO_SOT_SMD.3dshapes/SOT-223.step",
    "QFN28_0P5_5": "Package_DFN_QFN.3dshapes/QFN-28-1EP_5x5mm_P0.5mm_EP3.35x3.35mm.step",
    "USB_5P_MICRO_F_ML": "Connector_USB.3dshapes/USB_Micro-B_Molex_47346-0001.step",
    "CON22X1_2P54_OBLATE": "Connector_PinHeader_2.54mm.3dshapes/PinHeader_1x22_P2.54mm_Vertical.step",
    "SW4-4P2X3P2X2P5-SMT": "Button_Switch_SMD.3dshapes/SW_Push_1P1T_NO_CK_PTS125Sx73SMTR.step",
    "ESP32-S3-WROOM_NEW": "RF_Module.3dshapes/ESP32-S3-WROOM-1.step",
}

ROLE_BY_REF = {
    "U4": ("MCU module ESP32-S3-WROOM-1", "Compute and wireless module; package family from CAD/BOM, memory variant depends on installed module.", "source-backed"),
    "U3": ("USB-to-UART bridge CP2102N", "USB serial bridge identified by BOM; exact pin behavior should be checked against its datasheet.", "source-backed"),
    "U2": ("3.3 V LDO regulator SGM2212", "Regulates the board's 5 V rail to 3.3 V according to the reference design.", "source-backed"),
    "J1": ("Header J1 · 22 pins", "One of the two 1×22 2.54 mm breakout headers.", "source-backed"),
    "J3": ("Header J3 · 22 pins", "One of the two 1×22 2.54 mm breakout headers.", "source-backed"),
    "J2": ("Micro-USB connector J2", "USB-to-UART connector; generic package mesh, not an exact manufacturer-specific body.", "source-backed"),
    "J4": ("Micro-USB connector J4", "Native USB connector; generic package mesh, not an exact manufacturer-specific body.", "source-backed"),
    "SW1": ("BOOT button", "Boot-mode button per the official board guide.", "source-backed"),
    "SW2": ("RESET button", "Reset/enable button per the official board guide.", "source-backed"),
    "D6": ("Addressable RGB LED · GPIO38", "V1.1 board guide identifies the RGB LED on GPIO38; package mesh is a 3.5 mm generic outline.", "source-backed"),
    "D5": ("Red indicator LED", "Red indicator LED per BOM; do not infer electrical behavior beyond the CAD/BOM.", "source-backed"),
    "D1": ("Schottky diode · SOD-123", "Part family from BOM; generic package mesh.", "source-backed"),
    "D2": ("ESD protection diode · SOD-523", "BOM identifies a 5 V ESD diode; generic package mesh.", "source-backed"),
    "D3": ("ESD protection diode · SOD-523", "BOM identifies a 5 V ESD diode; generic package mesh.", "source-backed"),
    "D4": ("ESD protection diode · SOD-523", "BOM identifies a 5 V ESD diode; generic package mesh.", "source-backed"),
    "D7": ("Schottky diode · SOD-123", "Part family from BOM; generic package mesh.", "source-backed"),
    "D8": ("ESD protection diode · SOD-523", "BOM identifies a 5 V ESD diode; generic package mesh.", "source-backed"),
    "D9": ("ESD protection diode · SOD-523", "BOM identifies a 5 V ESD diode; generic package mesh.", "source-backed"),
    "D10": ("ESD protection diode · SOD-523", "BOM identifies a 5 V ESD diode; generic package mesh.", "source-backed"),
    "Q1": ("NPN transistor · L8050", "Part family from BOM; generic SOT-23 package mesh; pinout should be checked against the exact datasheet.", "source-backed"),
    "Q2": ("NPN transistor · L8050", "Part family from BOM; generic SOT-23 package mesh; pinout should be checked against the exact datasheet.", "source-backed"),
}

PIN_LABELS = {
    "J1": ["3V3", "3V3", "EN", "GPIO4", "GPIO5", "GPIO6", "GPIO7", "GPIO15", "GPIO16", "GPIO17", "GPIO18", "GPIO8", "GPIO3", "GPIO46", "GPIO9", "GPIO10", "GPIO11", "GPIO12", "GPIO13", "GPIO14", "5V", "GND"],
    "J3": ["GND", "TX/GPIO43", "RX/GPIO44", "GPIO1", "GPIO2", "GPIO42", "GPIO41", "GPIO40", "GPIO39", "GPIO38", "GPIO37", "GPIO36", "GPIO35", "GPIO0", "GPIO45", "GPIO48", "GPIO47", "GPIO21", "GPIO20", "GPIO19", "GND", "GND"],
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def workbook_rows(path: Path) -> list[list[str]]:
    ns = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main", "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships"}
    with zipfile.ZipFile(path) as archive:
        workbook = ET.fromstring(archive.read("xl/workbook.xml"))
        relationships = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
        targets = {item.attrib["Id"]: item.attrib["Target"] for item in relationships}
        sheet = workbook.find("m:sheets", ns)[0]
        sheet_path = "xl/" + targets[sheet.attrib["{" + ns["r"] + "}id"]]
        shared: list[str] = []
        if "xl/sharedStrings.xml" in archive.namelist():
            shared_root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
            shared = ["".join(node.text or "" for node in item.iter("{" + ns["m"] + "}t")) for item in shared_root]
        root = ET.fromstring(archive.read(sheet_path))
        output = []
        for row in root.findall(".//m:sheetData/m:row", ns):
            values = []
            for cell in row.findall("m:c", ns):
                value = cell.find("m:v", ns)
                raw = value.text if value is not None and value.text else ""
                if cell.attrib.get("t") == "s" and raw:
                    raw = shared[int(raw)]
                values.append(raw.strip())
            output.append(values)
        return output


def bom_by_reference() -> dict[str, dict[str, object]]:
    rows = workbook_rows(SOURCE_BOM)
    header_index = next(index for index, row in enumerate(rows) if "Part Reference" in row)
    headers = rows[header_index]
    records: dict[str, dict[str, object]] = {}
    previous_refs: list[str] = []
    for row in rows[header_index + 1:]:
        item = {headers[index]: row[index] if index < len(row) else "" for index in range(len(headers))}
        refs = [value.strip() for value in str(item.get("Part Reference", "")).split(",") if value.strip()]
        if refs:
            previous_refs = refs
        if not previous_refs:
            continue
        for ref in previous_refs:
            record = records.setdefault(ref, {"alternates": []})
            if refs:
                record.update({
                    "bomValue": item.get("Value", ""),
                    "bomFootprint": item.get("PCB Footprint", ""),
                    "partType": item.get("Part Type", ""),
                    "description": item.get("Description", ""),
                    "manufacturer": item.get("Manufacturer", ""),
                    "manufacturerPartNumber": item.get("Manufacturer Part #", ""),
                })
            elif item.get("Manufacturer Part #"):
                record["alternates"].append({
                    "partType": item.get("Part Type", ""),
                    "description": item.get("Description", ""),
                    "manufacturer": item.get("Manufacturer", ""),
                    "manufacturerPartNumber": item.get("Manufacturer Part #", ""),
                })
    return records


def pads_for(fp: object) -> list[dict[str, str | None]]:
    rows = []
    for pad in fp.Pads():
        net = pad.GetNetname()
        rows.append({"number": pad.GetNumber(), "net": net or None})
    return rows


def add_rounded_outline(board: object, pcbnew: object, left: float, top: float) -> None:
    right = left + SOURCE_WIDTH_MM * (2.0 / 3.0)
    bottom = top + SOURCE_HEIGHT_MM * (2.0 / 3.0)
    radius = SOURCE_CORNER_RADIUS_MM * (2.0 / 3.0)
    corners = [
        (right - radius, top + radius, -90, 0),
        (right - radius, bottom - radius, 0, 90),
        (left + radius, bottom - radius, 90, 180),
        (left + radius, top + radius, 180, 270),
    ]
    points: list[tuple[float, float]] = []
    for cx, cy, start, end in corners:
        for degree in range(start, end + 1, 10):
            angle = math.radians(degree)
            points.append((cx + radius * math.cos(angle), cy + radius * math.sin(angle)))
    if points[-1] != points[0]:
        points.append(points[0])
    for start, end in zip(points, points[1:]):
        segment = pcbnew.PCB_SHAPE(board)
        segment.SetShape(pcbnew.SHAPE_T_SEGMENT)
        segment.SetStart(pcbnew.VECTOR2I(pcbnew.FromMM(start[0]), pcbnew.FromMM(start[1])))
        segment.SetEnd(pcbnew.VECTOR2I(pcbnew.FromMM(end[0]), pcbnew.FromMM(end[1])))
        segment.SetLayer(pcbnew.Edge_Cuts)
        segment.SetWidth(pcbnew.FromMM(0.05))
        board.Add(segment)


def main() -> int:
    for required in (SOURCE_ASC, SOURCE_BOM, SOURCE_ARCHIVE, IMPORTED_PCB):
        if not required.exists():
            raise FileNotFoundError(required)
    sys.path.insert(0, str(Path(r"D:\StartupOS\.tools\kicad-10.0.7\bin")))
    import pcbnew  # type: ignore[import-not-found]

    archive_hash = sha256(SOURCE_ARCHIVE)
    source_hash = sha256(SOURCE_ASC)
    bom_hash = sha256(SOURCE_BOM)
    board = pcbnew.LoadBoard(str(IMPORTED_PCB))
    footprints = {fp.GetReference(): fp for fp in board.GetFootprints()}
    if len(footprints) != 48:
        raise RuntimeError(f"Expected 48 imported footprints; found {len(footprints)}")
    if "J1" not in footprints or "J3" not in footprints:
        raise RuntimeError("Imported board is missing J1/J3 header anchors")

    # Derive board coordinate transform from the source PADS placement and its
    # corresponding KiCad-imported header center. The PADS importer scales 2/3.
    source_j1 = (1.905, 91.95)
    j1 = footprints["J1"].GetPosition()
    left = j1.x / 1_000_000.0 - source_j1[0] * (2.0 / 3.0)
    top = j1.y / 1_000_000.0 - (SOURCE_HEIGHT_MM - source_j1[1]) * (2.0 / 3.0)
    if board.GetBoardEdgesBoundingBox().GetWidth() > 0:
        for drawing in list(board.GetDrawings()):
            if drawing.GetLayer() == pcbnew.Edge_Cuts:
                board.Remove(drawing)
    add_rounded_outline(board, pcbnew, left, top)

    model_root = "${KICAD10_3DMODEL_DIR}/"
    model_library = Path(r"D:\StartupOS\.tools\kicad-10.0.7\share\kicad\3dmodels")
    bom = bom_by_reference()
    components = []
    pin_headers = []
    for ref, fp in sorted(footprints.items()):
        value = fp.GetValue().strip()
        model = MODEL_BY_VALUE.get(value)
        if model and not (model_library / model).exists():
            raise FileNotFoundError(model_library / model)
        model_path = model_root + model if model else None
        existing_paths = []
        if hasattr(fp, "Models"):
            existing_paths = [entry.m_Filename for entry in fp.Models()]
        if model_path and model_path not in existing_paths:
            item = pcbnew.FP_3DMODEL()
            item.m_Filename = model_path
            fp.Add3DModel(item)
        pos = fp.GetPosition()
        item_bom = bom.get(ref, {})
        role, role_description, evidence = ROLE_BY_REF.get(ref, ("", "", "source-backed" if ref in bom else "unverified"))
        if not role:
            type_labels = {"Capacitor": "Tụ SMD", "Resistor": "Điện trở SMD", "Inductor": "Cuộn cảm SMD", "Connector": "Đầu nối", "Ferrite Bead": "Hạt ferrite", "Fuse": "Cầu chì SMD"}
            part_type = str(item_bom.get("partType") or "Linh kiện")
            role = f"{type_labels.get(part_type, part_type)} · {value}"
            bom_description = str(item_bom.get("description") or "")
            mpn = str(item_bom.get("manufacturerPartNumber") or "")
            maker = str(item_bom.get("manufacturer") or "")
            detail_parts = [part_type, str(item_bom.get("bomValue") or value), bom_description]
            if maker or mpn:
                detail_parts.append(" ".join(part for part in (maker, mpn) if part))
            role_description = " · ".join(part for part in detail_parts if part)
        pads = pads_for(fp)
        component = {
            "reference": ref,
            "label": role,
            "role": role_description,
            "description": role_description,
            "value": item_bom.get("bomValue") or value,
            "manufacturerPartNumber": item_bom.get("manufacturerPartNumber") or "",
            "manufacturer": item_bom.get("manufacturer") or "",
            "alternates": item_bom.get("alternates", []),
            "partType": item_bom.get("partType") or "",
            "bomDescription": item_bom.get("description") or "",
            "footprint": str(fp.GetFPID().GetLibItemName()),
            "x": round(pos.x / 1_000_000.0, 6),
            "y": round(pos.y / 1_000_000.0, 6),
            "rotation": round(fp.GetOrientationDegrees(), 3),
            "side": "back" if fp.GetLayer() == pcbnew.B_Cu else "front",
            "dnp": bool(fp.IsDNP()),
            "bomPresent": ref in bom,
            "packageModel": model,
            "has3dBody": bool(model),
            "modelNodeNames": [],
            "pads": pads,
            "evidence": evidence,
        }
        components.append(component)
        if ref in PIN_LABELS:
            pins = []
            pad_positions = {pad.GetNumber(): pad.GetPosition() for pad in fp.Pads()}
            for number, label in enumerate(PIN_LABELS[ref], start=1):
                pad = next((pad for pad in fp.Pads() if pad.GetNumber() == str(number)), None)
                if pad is None:
                    raise RuntimeError(f"Missing {ref}.{number} in imported CAD")
                anchor = pad.GetPosition()
                pins.append({
                    "id": f"{ref.lower()}-{number}",
                    "position": number,
                    "padNumber": str(number),
                    "label": label,
                    "netName": pad.GetNetname() or None,
                    "xMm": round(anchor.x / 1_000_000.0, 6),
                    "zMm": round(anchor.y / 1_000_000.0, 6),
                })
            pin_headers.append({"headerReference": ref, "side": "left" if ref == "J1" else "right", "pins": pins})

    DERIVED.mkdir(parents=True, exist_ok=True)
    board.SetFileName(str(OUT_PCB))
    pcbnew.SaveBoard(str(OUT_PCB), board)
    inventory = {
        "boardId": BOARD_ID,
        "revision": "Espressif ESP32-S3-DevKitC-1 · PCB V1.1 · PADS reference import",
        "sourceFile": str(IMPORTED_PCB.relative_to(ROOT)).replace("\\", "/"),
        "sourcePcbSha256": sha256(IMPORTED_PCB),
        "sourceArchiveSha256": archive_hash,
        "sourcePadsSha256": source_hash,
        "sourceBomSha256": bom_hash,
        "derivedPcbFile": str(OUT_PCB.relative_to(ROOT)).replace("\\", "/"),
        "modelSha256": "pending-glb-export",
        "units": "mm",
        "boardOutline": {"widthMm": 25.4, "heightMm": 62.865, "cornerRadiusMm": 0.666667, "sourceNativeWidthMm": SOURCE_WIDTH_MM, "sourceNativeHeightMm": SOURCE_HEIGHT_MM, "officialDimensionPdfHeightMm": 62.74, "heightDifferenceMm": 0.125, "note": "Rounded outline converted from Espressif PADS ASCII at the KiCad importer 2/3 scale; differs by 0.125 mm from the dimension PDF."},
        "components": components,
    }
    anchors = {
        "boardId": BOARD_ID,
        "revision": inventory["revision"],
        "sourcePcb": inventory["sourceFile"],
        "sourcePcbSha256": inventory["sourcePcbSha256"],
        "sourceArchiveSha256": archive_hash,
        "sourcePadsSha256": source_hash,
        "sourceGlb": "public/models/esp32-s3-devkitc-1-v1.1.glb",
        "sourceGlbSha256": "pending-glb-export",
        "coordinateDerivation": "Header pad centers are copied from the PADS-imported KiCad footprint geometry; GLB uses x/z as PCB x/y and y at top copper plane; not physically measured.",
        "boardTopMm": BOARD_TOP_MM,
        "headers": pin_headers,
    }
    INVENTORY.write_text(json.dumps(inventory, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    PIN_ANCHORS.write_text(json.dumps(anchors, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {OUT_PCB.relative_to(ROOT)}; {len(components)} CAD footprints; {sum(len(h['pins']) for h in pin_headers)} header anchors.")
    print(f"Board outline: {25.4:.3f} × {62.865:.3f} mm; source-PADS height differs from official dimension PDF by 0.125 mm.")
    print(f"Footprints with attached 3D package models: {sum(item['has3dBody'] for item in components)} / {len(components)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
