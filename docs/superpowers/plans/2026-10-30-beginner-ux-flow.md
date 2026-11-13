# Beginner UX Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the electronics learning demo understandable to first-time learners by clarifying navigation and turning the circuit workspace into a guided, skippable sequence.

**Architecture:** Preserve existing routes and lesson/circuit data. Add a compact native navigation with expandable groups, then split the builder experience into four UI steps backed by the existing state. Keep 2D/3D/PCB as views of the same circuit and make advanced controls available without forcing the guide on returning users.

**Tech Stack:** React 19, TypeScript 6, React Router 7, CSS, Vite 8.

**Spec:** `docs/superpowers/specs/2026-10-30-beginner-ux-flow-design.md`

## Global Constraints

- Preserve current routes and deep links: `/`, `/boards`, `/components`, `/build`, `/topics`, `/projects`, `/learn/esp32-led`.
- The four builder stages are **Chọn bài → Lắp mạch → Viết code → Chạy và quan sát**.
- Keep free navigation: learners can skip or jump between stages and enter 2D, 3D, PCB or C++ directly.
- Changing stage must not clear the circuit, code, board, component selection or virtual inputs.
- Do not imply that the concept flow, 3D board or copper view is electrical simulation or firmware execution.
- Prioritize visible keyboard focus, keyboard-accessible navigation and a mobile layout without horizontal overflow.
- Do not add or run automated tests unless the user asks; use TypeScript/Vite production build and manual interaction review when browser access is available.
- Do not commit because the workspace contains unrelated changes.

## Review Focus

1. A learner opening a deep link to `/build` or `/learn/esp32-led` must still understand where they are and find a way back to the overall learning flow.
2. Keyboard users must be able to open/close the navigation menus, activate their links, and use all four builder stages without hover-only behavior.
3. Switching stages, board profiles or view tabs must preserve the current circuit/code/input state except where the existing board-change behavior intentionally reloads the board-specific sample code; explain that behavior before applying it.
4. Unsupported Blockly/code behaviors must not appear enabled or claim that firmware runs; preserve existing limitation copy near the action.
5. At 320–680 px viewport widths, navigation and the builder action bar must remain usable without horizontal scrolling or controls covering the circuit.

---

### Task 1: Clarify the global navigation

**Files:**
- Create: `src/components/SiteNavigation.tsx`
- Create: `src/styles/site-navigation.css`
- Modify: `src/components/SiteShell.tsx`
- Modify: `src/styles/app.css`

**Interfaces:**
- `SiteNavigation` renders four primary destinations: Bắt đầu học, Thư viện, Phòng thử, Lộ trình.
- Thư viện exposes direct links to `/boards` and `/components`.
- Lộ trình exposes direct links to `/topics` and `/projects`.
- Use native `<details>/<summary>` disclosure for grouped links so click, keyboard, and touch do not depend on hover.

- [ ] **Step 1: Extract the current header links into `SiteNavigation`**
  - Keep route link targets exactly as defined above.
  - Use visible text labels; do not use icon-only navigation.
  - Show an active state when any child route in a group is active.
- [ ] **Step 2: Add disclosure and focus behavior**
  - Implement each grouped menu using `<details>` and `<summary>`.
  - Ensure menu links close their containing `<details>` after navigation.
  - Keep focus outlines visible and apply `aria-current="page"` via `NavLink`.
- [ ] **Step 3: Wire it into `SiteShell` and style responsive states**
  - Replace the current flat five-link nav.
  - Keep the existing brand link and “Bắt đầu học” CTA, but clarify its destination in the CTA text as “Bài đầu tiên”.
  - On narrow layouts, allow menu wrapping/stacking; do not create horizontal scrolling.
- [ ] **Step 4: Run the production build**
  - Run: `npm.cmd run build` from `electronics-learning-demo`.
  - Expected: TypeScript and Vite production build complete successfully.

### Task 2: Make the home page a clear starting point

**Files:**
- Modify: `src/pages/ExplorePage.tsx`
- Modify: `src/styles/app.css`

**Interfaces:**
- Keep the existing single “Làm dự án đầu tiên” path and make its label explicitly identify a beginner LED project.
- Keep direct access to boards, components and the builder, with short outcome-oriented descriptions.

- [ ] **Step 1: Rewrite the primary action and supporting choices**
  - Name the first action “Bắt đầu bài LED cho người mới”.
  - Name the supporting links by their outcome: “So sánh board”, “Tra linh kiện”, “Tự lắp mạch”.
  - Add one sentence that states no account or prior experience is required.
- [ ] **Step 2: Remove duplicate or ambiguous entry points**
  - Keep one primary CTA to `/learn/esp32-led`.
  - Keep no more than four secondary paths in the home link area; combine the topic/project paths under the clearly labeled “Lộ trình học”.
- [ ] **Step 3: Check the home layout at desktop and mobile CSS breakpoints**
  - Ensure CTA labels wrap naturally and no card requires hover to reveal its destination.
- [ ] **Step 4: Run the production build**
  - Run: `npm.cmd run build`.
  - Expected: build succeeds with the home route and existing links intact.

### Task 3: Add a reusable four-stage builder stepper

**Files:**
- Create: `src/components/builder/BuilderStepper.tsx`
- Modify: `src/pages/CircuitBuilderPage.tsx`
- Modify: `src/lib/lessonProgramIr.ts`
- Modify: `src/styles/app.css`

**Interfaces:**
- Define `type BuilderStep = 'choose' | 'assemble' | 'code' | 'run'`.
- `BuilderStepper` receives `{ step: BuilderStep; onChange: (step: BuilderStep) => void; completed: Partial<Record<BuilderStep, boolean>> }`.
- Step order and labels are fixed: choose/Chọn bài, assemble/Lắp mạch, code/Viết code, run/Chạy và quan sát.
- Steps are navigable buttons with `aria-current="step"` for the current step; do not disable step skipping.
- For the supported `blink` lesson, “Viết code” starts in the existing block workspace and can switch to C++; other lessons use the existing C++/sample-code experience and state their supported behavior.

- [ ] **Step 1: Add the step type and stepper component**
  - Render four labeled controls, current state, prior completion markers and a plain-text step count such as “Bước 2/4”.
  - Provide focus-visible styles and keyboard operation through native buttons.
- [ ] **Step 2: Add builder step state without changing saved circuit data**
  - Start new sessions at `choose`.
  - Keep step state as view state; do not serialize it over saved circuit/code fields.
  - For `blink`, persist a separately typed `LedProgramIr` and code mode alongside the existing C++ draft; migrate old workspace records without discarding their `code` field.
  - Returning from another step must retain all current workspace state.
- [ ] **Step 3: Add a single contextual next action**
  - `choose` advances to `assemble`; `assemble` advances to `code`; `code` advances to `run`.
  - Keep a visible way to go back and jump directly to another step.
- [ ] **Step 4: Run the production build**
  - Run: `npm.cmd run build`.
  - Expected: stepper types and builder integration compile successfully.

### Task 4: Stage the existing builder tools by task

**Files:**
- Create: `src/components/builder/BuilderStepIntro.tsx`
- Modify: `src/pages/CircuitBuilderPage.tsx`
- Modify: `src/lib/lessonProgramIr.ts`
- Modify: `src/components/lesson/BlockCodeWorkspace.tsx` only if a small accessible label/prop adjustment is required to embed it in the builder
- Modify: `src/styles/app.css`

**Interfaces:**
- `BuilderStepIntro` receives `{ title: string; instruction: string; helper?: string }` and renders one step title, one action sentence and optional helper text.
- Keep current `placed`, `wires`, `board`, `pressed`, `detected`, `distanceCm`, `workspaceView`, and simulation state as the source of truth.
- Use the existing `LedProgramIr` for the supported blink blocks; `generateLedCpp(program)` produces the exact C++ text passed to the existing parser/simulator in block mode.
- Keep an independent C++ draft when the user switches to self-writing mode; clearly state that manually edited C++ does not sync backward into blocks.

- [ ] **Step 1: Move lesson and board selection into the “Chọn bài” stage**
  - Show lesson title, objective, board profile, preparation summary and one “Tiếp tục lắp mạch” action.
  - Keep links to advanced board catalog and custom workspace visible but secondary.
- [ ] **Step 2: Move palette, circuit canvas, inspector and view tabs into “Lắp mạch”**
  - Keep 2D, assembly 3D, PCB and board 3D destinations available as subviews.
  - Put the selected part explanation beside the canvas; maintain selection when switching subviews.
  - Place wiring-mode instructions and endpoint hints next to the wiring controls.
- [ ] **Step 3: Place code controls in “Viết code”**
  - In `blink`, show a “Khối kéo thả” / “Tự viết C++” mode switch; default new sessions to blocks and embed `BlockCodeWorkspace` with `LedProgramIr` state.
  - Generate C++ from blocks through `generateLedCpp` and pass that string to the existing `parseEducationalProgram` path; keep mode-specific drafts when switching back and forth.
  - When switching from C++ back to blocks, show a short notice that manual C++ edits remain saved separately and do not convert to blocks.
  - In other lessons, show the current C++ editor/sample and label whether the selected lesson parses editable code or only uses a fixed concept script. Keep the existing link to the dedicated Blockly lesson where applicable.
  - Label C++ as self-practice; show parser limits and board-pin mapping status beside the editor. Do not change parser scope or add new supported syntax.
- [ ] **Step 4: Place simulator inputs, run/step controls, output, active trace and diagnostics in “Chạy và quan sát”**
  - Make Run the primary action and Step/Reset secondary actions.
  - Show virtual input controls only when relevant to the selected lesson.
  - Keep warning and simulation-limit notices near the output and active trace.
- [ ] **Step 5: Run the production build**
  - Run: `npm.cmd run build`.
  - Expected: staged panels render and the existing educational simulation code compiles without behavior changes.

### Task 5: Improve route-level orientation and contextual help

**Files:**
- Modify: `src/pages/LessonPage.tsx`
- Modify: `src/pages/BoardCatalogPage.tsx`
- Modify: `src/pages/ComponentsPage.tsx`
- Modify: `src/pages/TopicsPage.tsx`
- Modify: `src/pages/ProjectsPage.tsx`
- Modify: `src/styles/app.css`

**Interfaces:**
- Add consistent breadcrumb/return links without changing any existing route or content schema.
- Use the same action vocabulary as the global navigation and builder stepper.

- [ ] **Step 1: Add route context and next action to lesson/catalog headings**
  - Lesson page has a clear return link to learning paths and a direct link to the builder.
  - Board/component pages offer one direct action to open the builder and explicitly label reference-only profiles.
  - Topic/project pages link to current relevant lesson or builder route and state when content is reference-only.
- [ ] **Step 2: Add inline help entry point to the builder**
  - Provide a persistent “Hướng dẫn sử dụng” control that opens the existing beginner instructions at the relevant section.
  - Keep the help dismissible and do not show a blocking tutorial modal.
- [ ] **Step 3: Run the production build**
  - Run: `npm.cmd run build`.
  - Expected: every existing route compiles and links target valid existing paths.

### Task 6: Responsive, accessibility and interaction acceptance review

**Files:**
- Modify: `src/styles/app.css`
- Modify: `src/styles/site-navigation.css`
- Modify: `README.md`
- Modify: `docs/MACH-MO-MVP-STATUS.md`

**Interfaces:**
- No behavior-engine interfaces change in this task.

- [ ] **Step 1: Apply reduced-motion and focus-visible treatments**
  - Ensure step transitions respect `prefers-reduced-motion: reduce`.
  - Ensure links, summary controls, step buttons, canvas controls and simulator buttons have visible focus styles.
- [ ] **Step 2: Review responsive CSS at widths 320, 390, 680, 950 and 1280 px**
  - Inspect menu open/closed states, builder stepper, palette, workspace views, inspector and primary actions.
  - If browser access remains unavailable, record the exact blocker rather than claiming visual verification.
- [ ] **Step 3: Review the critical interaction sequence manually**
  - Open home → start beginner lesson → enter `/build` → move through all four steps → change 2D/3D view → return to code → run/step.
  - Confirm board, code, wires, component selection and virtual inputs persist across step/view changes.
  - Verify deep links and each grouped navigation link reach the existing route.
- [ ] **Step 4: Run final production build and update status documentation**
  - Run: `npm.cmd run build`.
  - Update README and MVP status with the new grouped navigation, four builder stages and remaining simulation limitations.
  - Expected: successful build; docs do not claim firmware/analog/SPICE simulation or complete board CAD coverage.

## Self-review

- **Spec coverage:** global navigation is Task 1; home starting point Task 2; four stage controls Task 3; stage content/state preservation Task 4; route orientation and local help Task 5; keyboard, responsive, reduced motion and truthfulness Task 6.
- **Placeholder scan:** no TBD/TODO implementation placeholders. Each task names files, behavior, acceptance and a build or manual check.
- **Type consistency:** `BuilderStep` and `BuilderStepper` signature are defined once in Task 3; the builder page consumes them in Tasks 3–4.
- **Review focus coverage:** deep links are covered in Tasks 1, 5 and 6; keyboard menus in Tasks 1 and 6; state preservation in Tasks 3, 4 and 6; unsupported code limits in Task 4; narrow viewport behavior in Tasks 1 and 6.
- **Automated test constraint:** no automated tests are planned or executed unless the user separately asks; validation uses production build and direct manual interaction review.
