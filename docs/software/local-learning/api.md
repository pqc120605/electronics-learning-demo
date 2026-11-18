# Beginner course contract

Implementation files belong to the engine task. The UI consumes these exports.

## src/data/beginnerCourse.ts

- BEGINNER_ACTIVITIES is a readonly array. Each entry has id, title, goal, instruction, explanationQuestion, explanationChoices (array of {id,label}), correctExplanationId and hints (readonly string array).
- BeginnerActivityId is 'closed-loop' | 'breadboard' | 'led-polarity' | 'button-logic' | 'sensor-threshold'.
- getBeginnerActivity(id) returns the matching entry, falling back to the first entry for navigation only.

## src/lib/beginnerCourse.ts

- createBeginnerSession() returns BeginnerSession.
- BeginnerSession has schema:1, courseVersion:1, activityId:BeginnerActivityId, boardId:string|null, controls:BeginnerControls, prediction:BeginnerPrediction|null, observations:BeginnerObservation[], explanations:Partial<Record<BeginnerActivityId,string>>, hintsUsed:Partial<Record<BeginnerActivityId,number>>.
- BeginnerControls has returnConnected:boolean, ledForward:boolean, resistorPresent:boolean, holePair:'same-strip'|'across-trench', pressed:boolean, inverted:boolean, inputPercent:number, threshold:number.
- BeginnerPrediction is 'on' | 'off' | 'connected' | 'separate' | 'blocked'.
- BeginnerResult has status:'ready'|'ungradable', outcome:BeginnerPrediction|null, message:string, trace:readonly string[], code:string|null, caseKey:string, signature:string, evidenceKind:'topology-check'|'lesson-model', doc:CircuitDocV2|null.
- BeginnerObservation has activityId, boardId, controls (copy), prediction, outcome, caseKey, signature, evidenceKind. Records are bounded and validated when read.
- getBeginnerResult(session) calculates the current result through the existing topology/parser. UI only shows it after an explicit observation action.
- observeBeginnerSession(session) returns {session:BeginnerSession,result:BeginnerResult}. It records only a ready result with a prediction. It does not change learner input.
- getBeginnerAssessment(session,activityId) returns {status:'not-started'|'in-progress'|'met',observed:number,required:number,missing:readonly string[],explanationCorrect:boolean}.
- getBeginnerCode(session) returns string|null. Board support fails closed. Use this to show code before observing.
- getBeginnerBoardOptions() returns SimulationTarget[] supporting BOTH button and analog-potentiometer.
- getBeginnerFoundationDoc(controls) returns CircuitDocV2.
- getBeginnerCaseOptions(session) returns readonly {label:string,controls:Partial<BeginnerControls>}[] for explicit required cases. Controls reflect this activity's current board/program grouping.

Controls, board, activity or prediction edits clear the visible result in UI. Keep historic observations, whose assessment recomputes against their own controls and current board/program grouping.

## src/lib/beginnerCourseStorage.ts

- BEGINNER_COURSE_KEY and BEGINNER_COURSE_CHANGED_EVENT are exported strings.
- readBeginnerSession(storage?:Pick<Storage,'getItem'>) returns {kind:'empty'|'ready'|'invalid'|'unsupported'|'unavailable',raw:string|null,session:BeginnerSession|null,message:string}.
- saveBeginnerSession(session,expectedRaw,storage?:Pick<Storage,'getItem'|'setItem'>) returns {kind:'saved'|'conflict'|'protected'|'unavailable',raw:string|null,message:string}. No automatic old-data replacement. On saved, raw is the exact serialized value. expectedRaw comes from the last read/save.
- parseBeginnerSession(value:unknown) returns BeginnerSession|null. Validates bounds and recomputes observations, ignores no unknown schema.
- formatBeginnerBackup(session) returns JSON text.

The browser hook and UI own memory state and show explicit durability. Invalid or unsupported storage disables persistence for the new in-memory session and exposes raw backup plus reload actions. A conflict preserves both versions and offers reload or download. Read does not mutate storage.
