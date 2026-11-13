# Rev 2 follow-on lesson inventory

Date: 2026-11-12

## Evidence inspected

- `src/data/builderLessons.ts`
- `src/data/curriculumSchema.ts`
- `src/data/lessonCircuits.ts`
- `src/data/lessonCircuitDocs.ts`
- `src/data/componentRegistry.ts`
- `src/data/component-models.manifest.json`
- `src/pages/LessonPage.tsx`
- `src/pages/LessonPreflightPage.tsx`
- `src/lib/simulationProviders.ts`
- `src/components/lesson/LessonCircuitWorkspace.tsx`

## Coverage matrix

The application has 11 builder/curriculum lessons. The Rev 2 canonical CircuitDocV2 lesson projector currently returns a document only for `blink`; the older `lessonCircuits.ts` still supplies legacy component-and-wire presets for the other entries (and a default preset for `blink`). The full information-rich lesson page remains hard-wired to the ESP32 LED blink lesson. The curriculum’s provider modes are explicit: eight `code-subset` lessons and three `fixed-scenario` lessons.

| Lesson ID | Curriculum provider | Legacy preset | Canonical Rev 2 lesson document | Main next concern |
| --- | --- | --- | --- | --- |
| `blink` | code subset | default LED preset | Yes | Rev 2 reference slice; supported with educational-trace limits |
| `button-led` | code subset | explicit button + LED preset | No | Best next slice: input polarity, button contact grouping and input-to-output flow |
| `analog-potentiometer` | code subset | explicit preset | No | Analog input is normalized educational input, not physical ADC counts |
| `analog-ldr` | code subset | explicit preset | No | Divider behavior is a declared model; no lux or measured resistance claim |
| `ir-alert` | code subset | explicit preset | No | Sensor is a bench-mounted parametric module; module polarity varies |
| `ultrasonic-distance` | code subset | explicit preset | No | ECHO voltage-level caution; no acoustic or physical pulse timing model |
| `seven-segment-counter` | code subset | explicit preset | No | Many-pin topology and shared/common pin semantics |
| `source-led` | code subset | default LED preset | No | Overlaps blink; useful as a component-role/polarity lesson rather than another code-flow duplicate |
| `buck-boost-concept` | fixed scenario | explicit preset | No | Concept illustration only; electrical conversion is not solved |
| `dc-motor-driver` | fixed scenario | explicit preset | No | Driver/motor state is illustrative; no current, torque, RPM or heat solution |
| `mosfet-switch` | fixed scenario | explicit preset | No | Low-side switching concept only; no load transient or thermal solution |

`component-models.manifest.json` has source-CAD models for the button, LED and resistor used by `button-led`. The button footprint `SW_PUSH_6mm` has four physical leads but maps them to two logical contacts (`contactA` and `contactB`); the next slice must retain that grouping rather than show four independent electrical pins. The ESP32 board profile is maintained separately from this component mesh manifest. Breadboard rail spacing remains an unverified model assumption, and an educational trace cannot verify real pin voltage or switch bounce.

## Recommended sequence

1. **`button-led`** — directly follows `blink` in the curriculum prerequisites, has an existing supported code-subset provider, and has a legacy circuit preset plus source-CAD button/LED/resistor geometry. It exercises the missing digital-input behavior without introducing analog, acoustic or motor models.
2. **`analog-potentiometer` and `analog-ldr`** — plan together at the learning-model level, but implement as separately testable slices; both depend on normalized analog input and must keep the non-ADC/ non-lux limitation visible.
3. **`ir-alert`, `ultrasonic-distance`, and `seven-segment-counter`** — plan after the input-flow contract is stable; each has distinct module/pin or topology hazards.
4. **`source-led`, `buck-boost-concept`, `dc-motor-driver`, and `mosfet-switch`** — keep explicit educational/concept-only scope. Do not turn fixed scenarios into electrical-simulation claims.

The next implementation plan is `docs/superpowers/plans/2026-11-12-interactive-button-led-lesson.md`. It should be reviewed as its own slice before source implementation; no code for the next lesson is included in the Rev 2 completion snapshot.
