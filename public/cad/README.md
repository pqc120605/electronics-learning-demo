# CAD source files: Raspberry Pi boards

These ZIP files contain the manufacturer STEP board models downloaded from the Raspberry Pi Product Information Portal.

| Board | Source file | Official source |
| --- | --- | --- |
| Raspberry Pi Pico (R3) | `raspberry-pi-pico-r3-step.zip`; extracted viewer file `raspberry-pi-pico-r3.step` | https://pip.raspberrypi.com/categories/610-raspberry-pi-pico |
| Raspberry Pi Pico W | `raspberry-pi-pico-w-step.zip`; extracted viewer file `raspberry-pi-pico-w.stp` | https://pip.raspberrypi.com/categories/686-raspberry-pi-pico-w |
| Raspberry Pi Pico 2 | `raspberry-pi-pico-2-step.zip`; extracted viewer file `raspberry-pi-pico-2.step` | https://pip.raspberrypi.com/categories/1005-raspberry-pi-pico-2 |
| Raspberry Pi Pico 2 H | `raspberry-pi-pico-2-h-step.zip`; extracted viewer file `raspberry-pi-pico-2-h-step-source/rpi_pico2h.step` | https://pip.raspberrypi.com/categories/1264-raspberry-pi-pico-2-h |

Raspberry Pi states that the design files for these boards are openly available and permits use, copying, modification, and distribution with or without fee. The files are provided “as is”. See the [Raspberry Pi design-file licensing page](https://www.raspberrypi.com/licensing/) and the [Pico-series documentation](https://www.raspberrypi.com/documentation/microcontrollers/pico-series.html) for current terms.

The original ZIP archives and extracted STEP files are retained. The STEP models are converted locally to GLB and served by the app's own WebGL viewer; no third-party embedded viewer or cross-origin STEP import is used. The viewer supports rotation, backside inspection, zoom, and selection of named CAD geometry groups. It does not simulate circuitry, netlists, pin behavior, or firmware. Geometry with no useful CAD label is marked as unidentified rather than assigned an assumed function.

| Board | Source meshes | Selectable groups | GLB |
| --- | ---: | ---: | --- |
| Raspberry Pi Pico (R3) | 17 | 16 | `../models/raspberry-pi-pico.glb` |
| Raspberry Pi Pico W | 24 | 24 | `../models/raspberry-pi-pico-w.glb` |
| Raspberry Pi Pico 2 | 426 | 53 | `../models/raspberry-pi-pico-2.glb` |
| Raspberry Pi Pico 2 H | 433 | 55 | `../models/raspberry-pi-pico-2-h.glb` |

The clickable group list comes from STEP mesh/component names. Exact reference designators and electrical connectivity are not present for every source mesh; the on-screen copy distinguishes source-backed names from unverified role explanations.

To regenerate the local meshes after changing a STEP source, run `node scripts/convert-raspberry-pi-step-to-glb.mjs`. The converter uses `occt-import-js` (LGPL-2.1); its source package is vendored at `vendor/occt-import-js-0.0.23.tgz` and the license is copied to `occt-import-js-LICENSE.md`.

Raspberry Pi attribution/licensing terms for Pico, Pico W and Pico 2 are copied to `raspberry-pi-model-license.txt`. Pico 2 H ships its source archive (including original `LICENSE.txt` and accuracy disclaimer), extracted STEP, and a model-specific notice at `../models/raspberry-pi-pico-2-h.NOTICE.txt`. The board page links the source STEP and archive. The Pico 2 H model is a mechanical reference. The viewer exposes 40 selectable J0 header-pin references, with physical layout inherited from the Pico pinout documented by Raspberry Pi and transformed to this STEP model. This is not a Pico 2 H-specific Allegro pad extraction or physical-board measurement. Pin selection is informational only; there is no netlist, circuit simulation, or firmware support.

## Arduino CAD model coverage (2026-10-30)

The learner viewer indexes every footprint in the checked-in source-derived board manifests. A footprint is not automatically a populated physical component: DNP, fiducial, test-point, mounting and header footprints may not be installed. The component picker marks whether the reference has a matching named mesh node in its GLB. References without a matching GLB mesh remain visible as CAD footprint data; the viewer does not fabricate a 3D body for them.

| Reference board | CAD footprint refs | Named GLB mesh refs | Revision |
| --- | ---: | ---: | --- |
| Arduino Uno R3 | 120 | 33 | Arduino Uno Rev3 · source CAD import |
| Arduino Nano classic | 37 | 18 | Arduino Nano V3.3 · source CAD import |
| Arduino Mega 2560 R3 | 72 | 39 | Arduino Mega 2560 Rev3e · source CAD import |

Hashes and source links are stored in each board's `manifest.json`. These are reference CAD models, not revision-verified retail assemblies; a clone's BOM and fitted headers may differ.
