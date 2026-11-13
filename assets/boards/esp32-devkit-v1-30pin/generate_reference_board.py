"""Build the generic 30-pin ESP32 DevKit reference PCB from KiCad footprints."""

from pathlib import Path
import pcbnew


ROOT = Path(__file__).resolve().parent
BOARD_PATH = ROOT / "esp32-devkit-v1-30pin.kicad_pcb"
FOOTPRINT_ROOT = Path(r"C:\Program Files\KiCad\9.0\share\kicad\footprints")
MM = pcbnew.FromMM


def add_outline(board: pcbnew.BOARD) -> None:
    corners = [(-14.0, -27.5), (14.0, -27.5), (14.0, 27.5), (-14.0, 27.5)]
    for index, (x1, y1) in enumerate(corners):
        x2, y2 = corners[(index + 1) % len(corners)]
        edge = pcbnew.PCB_SHAPE()
        edge.SetShape(pcbnew.SHAPE_T_SEGMENT)
        edge.SetStart(pcbnew.VECTOR2I(MM(x1), MM(y1)))
        edge.SetEnd(pcbnew.VECTOR2I(MM(x2), MM(y2)))
        edge.SetLayer(pcbnew.Edge_Cuts)
        edge.SetWidth(MM(0.05))
        board.Add(edge)


def place_footprint(
    board: pcbnew.BOARD,
    loader: pcbnew.PCB_IO_KICAD_SEXPR,
    library: str,
    footprint_name: str,
    reference: str,
    value: str,
    x: float,
    y: float,
    rotation: float = 0,
) -> None:
    library_path = str(FOOTPRINT_ROOT / f"{library}.pretty")
    footprint = loader.FootprintLoad(library_path, footprint_name)
    if footprint is None:
        raise RuntimeError(f"Cannot load {library}:{footprint_name} from {library_path}")

    footprint.SetReference(reference)
    footprint.SetValue(value)
    footprint.SetPosition(pcbnew.VECTOR2I(MM(x), MM(y)))
    footprint.SetOrientationDegrees(rotation)
    # Keep reference designators on the silkscreen so learners can match the
    # 3D model to the component list. Hide values to avoid a crowded board.
    footprint.Reference().SetVisible(True)
    footprint.Value().SetVisible(False)
    board.Add(footprint)


def add_header_row(board: pcbnew.BOARD, loader: pcbnew.PCB_IO_KICAD_SEXPR, x: float, reference: str) -> None:
    place_footprint(
        board,
        loader,
        "Connector_PinHeader_2.54mm",
        "PinHeader_1x15_P2.54mm_Vertical",
        reference,
        "15-pin header",
        x,
        -17.78,
    )


def add_pin_holes(board: pcbnew.BOARD) -> None:
    """Add plated 2.54 mm pitch through-hole pads for the two 15-pin rows."""
    footprint = pcbnew.FOOTPRINT(board)
    footprint.SetReference("PADS")
    footprint.SetValue("30 plated header positions")
    footprint.Reference().SetVisible(False)
    footprint.Value().SetVisible(False)
    footprint.SetPosition(pcbnew.VECTOR2I(MM(0), MM(0)))

    for row, x in (("L", -11.43), ("R", 11.43)):
        for index, y in enumerate([round(-17.78 + i * 2.54, 3) for i in range(15)], start=1):
            pad = pcbnew.PAD(footprint)
            pad.SetNumber(f"{row}{index}")
            pad.SetAttribute(pcbnew.PAD_ATTRIB_PTH)
            pad.SetShape(pcbnew.PAD_SHAPE_CIRCLE)
            pad.SetSize(pcbnew.VECTOR2I(MM(1.9), MM(1.9)))
            pad.SetDrillSize(pcbnew.VECTOR2I(MM(0.9), MM(0.9)))
            pad.SetLayerSet(pcbnew.LSET.AllCuMask())
            pad.SetPosition(pcbnew.VECTOR2I(MM(x), MM(y)))
            footprint.Add(pad)

    board.Add(footprint)


def add_silkscreen_text(board: pcbnew.BOARD, text: str, x: float, y: float, rotation: float = 0) -> None:
    label = pcbnew.PCB_TEXT(board)
    label.SetText(text)
    label.SetPosition(pcbnew.VECTOR2I(MM(x), MM(y)))
    label.SetLayer(pcbnew.F_SilkS)
    label.SetTextSize(pcbnew.VECTOR2I(MM(0.48), MM(0.48)))
    label.SetTextThickness(MM(0.08))
    label.SetTextAngleDegrees(rotation)
    board.Add(label)


def add_header_pin_labels(board: pcbnew.BOARD) -> None:
    """Label the common DOIT-style 30-pin reference order at the headers."""
    left = ["VIN", "GND", "D13", "D12", "D14", "D27", "D26", "D25", "D33", "D32", "D35", "D34", "VN", "VP", "EN"]
    right = ["3V3", "GND", "D15", "D2", "D4", "RX2", "TX2", "D5", "D18", "D19", "D21", "RX0", "TX0", "D22", "D23"]
    y_positions = [round(-17.78 + index * 2.54, 3) for index in range(15)]
    for labels, x, rotation in ((left, -13.12, 90), (right, 13.12, 270)):
        for label, y in zip(labels, y_positions):
            add_silkscreen_text(board, label, x, y, rotation)
    add_silkscreen_text(board, "MACH MO · ESP32 DEVKIT · 30P", 0, 25.4)
    add_silkscreen_text(board, "WROOM-32", 0, 12.9)
    add_silkscreen_text(board, "USB / UART", 0, -16.4)
    add_silkscreen_text(board, "3V3 REG", -9.2, -21.1)


def make_board() -> None:
    board = pcbnew.BOARD()
    board.GetDesignSettings().SetBoardThickness(MM(1.6))
    loader = pcbnew.PCB_IO_KICAD_SEXPR()
    add_outline(board)

    # The outline and spacing represent a common 30-pin DevKit form factor;
    # this is a learning reference, not a production board for a named vendor.
    add_header_row(board, loader, -11.43, "J1")
    add_header_row(board, loader, 11.43, "J2")
    place_footprint(board, loader, "RF_Module", "ESP32-WROOM-32", "U1", "ESP32-WROOM-32", 0, -0.5)
    place_footprint(board, loader, "Connector_USB", "USB_Micro-B_Molex_47346-0001", "J3", "USB Micro-B", 0, -25.2)
    place_footprint(board, loader, "Package_TO_SOT_SMD", "SOT-223-3_TabPin2", "U2", "3.3 V regulator", -7.5, -20.0)
    place_footprint(board, loader, "Package_DFN_QFN", "QFN-28-1EP_5x5mm_P0.5mm_EP3.35x3.35mm", "U3", "USB-UART interface", 5.3, -19.8)
    place_footprint(board, loader, "Button_Switch_THT", "SW_PUSH_6mm_H7.3mm", "SW1", "BOOT", -6.0, -24.0)
    place_footprint(board, loader, "Button_Switch_THT", "SW_PUSH_6mm_H7.3mm", "SW2", "EN / RESET", 6.0, -24.0)
    place_footprint(board, loader, "LED_SMD", "LED_0603_1608Metric", "D1", "POWER", 9.7, -21.2)
    place_footprint(board, loader, "LED_SMD", "LED_0603_1608Metric", "D2", "STATUS", 9.7, -23.0)
    place_footprint(board, loader, "Diode_SMD", "D_SOD-323", "D3", "USB ESD", -2.1, -20.3)
    place_footprint(board, loader, "Package_TO_SOT_SMD", "SOT-23", "Q1", "BOOT control", 8.0, -20.5)
    place_footprint(board, loader, "Package_TO_SOT_SMD", "SOT-23", "Q2", "RESET control", 8.0, -22.4)

    for reference, x, y in (
        ("C1", -10.0, -19.7),
        ("C2", -4.3, -19.7),
        ("C3", 9.4, -18.7),
        ("C4", 1.2, -18.7),
        ("R1", -2.8, -22.2),
        ("R2", 3.0, -22.2),
        ("C5", -9.3, -17.3),
        ("C6", -4.6, -16.7),
        ("C7", 3.0, -16.8),
        ("C8", 7.6, -16.8),
        ("R3", -9.4, -15.8),
        ("R4", -7.1, -15.8),
        ("R5", 7.0, -15.8),
        ("R6", 9.3, -15.8),
    ):
        library = "Resistor_SMD" if reference.startswith("R") else "Capacitor_SMD"
        name = "R_0603_1608Metric" if reference.startswith("R") else "C_0603_1608Metric"
        place_footprint(board, loader, library, name, reference, "0603", x, y)

    add_header_pin_labels(board)

    pcbnew.SaveBoard(str(BOARD_PATH), board)
    print(f"Generated {BOARD_PATH}")
    print(f"Footprints: {len(board.GetFootprints())}; plated pads: {sum(len(fp.Pads()) for fp in board.GetFootprints())}")


if __name__ == "__main__":
    make_board()
