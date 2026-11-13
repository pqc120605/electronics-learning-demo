"""Prepare the supplied 30-pin ESP32 Dev Kit design for reproducible GLB export.

The upstream project points the CP2102 STEP model at a machine-specific path.
This creates a normalized copy and substitutes KiCad's generic matching QFN-28
package shell, while preserving the actual board, nets, placements, and routing.
The generic shell does not show the CP2102 top marking.
"""

from pathlib import Path
import pcbnew

ROOT = Path(__file__).resolve().parent
UPSTREAM = ROOT / "upstream" / "ESP32 Dev Kit.kicad_pcb"
OUTPUT = ROOT / "esp32-devkit-v1-30pin.kicad_pcb"
MODEL = (
    "${KICAD9_3DMODEL_DIR}/Package_DFN_QFN.3dshapes/"
    "QFN-28-1EP_5x5mm_P0.5mm_EP3.35x3.35mm.wrl"
)


def main() -> None:
    if not UPSTREAM.exists():
        raise FileNotFoundError(f"Missing upstream PCB: {UPSTREAM}")
    board = pcbnew.LoadBoard(str(UPSTREAM))
    cp2102 = next(
        (fp for fp in board.GetFootprints() if str(fp.GetReference()) == "U3"),
        None,
    )
    if cp2102 is None or len(cp2102.Models()) != 1:
        raise ValueError("Expected one 3D model on CP2102 reference U3")
    model = cp2102.Models()[0]
    model.m_Filename = MODEL
    # The upstream vendor model uses a non-KiCad axis convention and carries
    # an X=-90 degree rotation. The replacement is a stock KiCad package body,
    # which already uses KiCad's board coordinate frame. Keep the PCB footprint
    # placement, but clear the obsolete model transform so the package sits flat.
    model.m_Offset = pcbnew.VECTOR3D(0, 0, 0)
    model.m_Rotation = pcbnew.VECTOR3D(0, 0, 0)
    model.m_Scale = pcbnew.VECTOR3D(1, 1, 1)
    pcbnew.SaveBoard(str(OUTPUT), board)
    print(f"Prepared {OUTPUT}")


if __name__ == "__main__":
    main()
