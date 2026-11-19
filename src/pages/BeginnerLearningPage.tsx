import { useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { BEGINNER_ACTIVITIES, getBeginnerActivity, type BeginnerActivityId } from '../data/beginnerCourse'
import { PRODUCT_ROUTES } from '../data/productRoutes'
import {
  getBeginnerAssessment, getBeginnerBoardOptions, getBeginnerCaseOptions,
  getBeginnerCode, getBeginnerFoundationDoc,
  type BeginnerControls, type BeginnerPrediction, type BeginnerResult,
} from '../lib/beginnerCourse'
import { GuideContextBridge } from '../components/guide/GuideContext'
import { getBeginnerGuideSnapshot } from '../lib/beginnerGuide'
import { useProductRoute } from '../lib/useProductRoute'
import { useBeginnerCourse } from '../lib/useBeginnerCourse'
import { BeginnerTeacherPack } from '../components/learning/BeginnerTeacherPack'
import {
  BEGINNER_REPAIRS, getBeginnerRepair, newRepairAttempt, observeRepair, repairControls,
  type BeginnerRepairId, type RepairAttempt,
} from '../lib/beginnerRepair'
import './BeginnerLearningPage.css'

const outcomeLabels: Record<BeginnerPrediction, string> = {
  on: 'LED sáng', off: 'LED tắt', connected: 'Có nối điện', separate: 'Tách rời',
  blocked: 'Cần thêm điện trở trước khi chạy',
}
const durabilityLabels = {
  stored: 'Đã lưu trên trình duyệt này',
  'memory-only': 'Chỉ trong bộ nhớ của tab',
  protected: 'Đang bảo vệ dữ liệu cũ',
  conflict: 'Có bản lưu khác trong trình duyệt',
}

type ToggleKey = 'returnConnected' | 'ledForward' | 'resistorPresent' | 'pressed' | 'inverted'
function Toggle({ label, checked, change }: { label: string; checked: boolean; change: (checked: boolean) => void }) {
  return <label className="beginner-toggle">
    <input type="checkbox" checked={checked} onChange={event => change(event.target.checked)} />
    {label}
  </label>
}

function FoundationCircuit({ controls }: { controls: BeginnerControls }) {
  const doc = getBeginnerFoundationDoc(controls)
  return <figure className="beginner-circuit">
    <svg viewBox="0 0 520 230" role="img" aria-labelledby="beginner-circuit-title beginner-circuit-desc">
      <title id="beginner-circuit-title">Nguồn, điện trở, LED và đường về</title>
      <desc id="beginner-circuit-desc">
        {`Đường về ${controls.returnConnected ? 'nối kín' : 'đang hở'}. LED ${controls.ledForward ? 'thuận' : 'đảo chiều'}. ${controls.resistorPresent ? 'Có' : 'Thiếu'} điện trở nối tiếp.`}
      </desc>
      <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round">
        <path d="M70 92 V55 H195 M255 55 H345 M405 55 H455 V175 H305 M215 175 H70 V109" />
        <path d="M46 92 H94 M55 109 H85" stroke="var(--mm-power)" />
        {controls.resistorPresent
          ? <path d="M195 55 l5 -12 10 24 10 -24 10 24 10 -24 10 24 5 -12" />
          : <path d="M195 55 H255" strokeDasharray="5 5" stroke="var(--mm-error)" />}
        <g transform={controls.ledForward ? '' : 'translate(750 0) scale(-1 1)'}>
          <path d="M345 38 L380 55 L345 72 Z M380 55 H385 M385 35 V75 M385 55 H405" />
          <path d="M368 30 l15 -15 m-9 0 h9 v9 M386 35 l15 -15 m-9 0 h9 v9" strokeWidth="2" />
        </g>
        <path
          d={controls.returnConnected ? 'M215 175 H305' : 'M215 175 H230 M290 175 H305 M230 175 L280 150'}
          stroke={controls.returnConnected ? 'var(--mm-signal)' : 'var(--mm-error)'}
        />
      </g>
      <g fill="currentColor" fontSize="15" textAnchor="middle">
        <text x="70" y="60">Nguồn</text>
        <text x="33" y="88">+</text>
        <text x="33" y="122">−</text>
        <text x="225" y="104">{controls.resistorPresent ? 'R nối tiếp' : 'Thiếu R'}</text>
        <text x="345" y="88" fontSize="12">{controls.ledForward ? 'A (+)' : 'K (−)'}</text>
        <text x="407" y="88" fontSize="12">{controls.ledForward ? 'K (−)' : 'A (+)'}</text>
        <text x="375" y="110">{controls.ledForward ? 'LED thuận' : 'LED ngược'}</text>
        <text x="260" y="210">{controls.returnConnected ? 'Đường về nối kín' : 'Đường về đang hở'}</text>
      </g>
    </svg>
    <figcaption>Sơ đồ kết nối khái niệm. Không biểu diễn điện áp hay dòng điện đo được.</figcaption>
    <details>
      <summary>Định danh mạch đang kiểm tra</summary>
      <ul>{doc.parts.map(part => <li key={part.id}>{part.id}: {part.type}</li>)}</ul>
      <ul>{doc.wires.map(wire => <li key={wire.id}>
        {wire.id}: {[wire.from, wire.to].map(endpoint => endpoint.kind === 'pin'
          ? `${endpoint.partId}/${endpoint.pinId}` : endpoint.holeId).join(' ↔ ')}
      </li>)}</ul>
    </details>
  </figure>
}

function BreadboardStrip({ value, change }: {
  value: BeginnerControls['holePair']; change: (value: BeginnerControls['holePair']) => void
}) {
  return <figure className="beginner-breadboard">
    <p>Mốc: <strong>{value === 'same-strip' ? 'bb1:10a' : 'bb1:10e'}</strong>. Chọn lỗ thứ hai:</p>
    <div className="beginner-hole-grid" role="group" aria-label="Lỗ breadboard cột 10">
      {'abcdefghij'.split('').map(row => <span key={row} className={row === 'f' ? 'beginner-trench' : ''}>
        {row === 'e' || row === 'f'
          ? <button
              type="button"
              aria-pressed={value === (row === 'e' ? 'same-strip' : 'across-trench')}
              onClick={() => change(row === 'e' ? 'same-strip' : 'across-trench')}
            >{`bb1:10${row}`}{row === 'e' && value === 'across-trench' ? ' ●' : ''}</button>
          : <span>{`10${row}`}{row === 'a' && value === 'same-strip' ? ' ●' : ''}</span>}
      </span>)}
    </div>
    <figcaption>Cột 10: a–e chung dải; f–j chung dải khác. Khe giữa e và f tách hai dải. Mô hình breadboard 400 lỗ giả định; không xác nhận rail của board thật.</figcaption>
  </figure>
}

function ObservationResult({ result, prediction }: {
  result: BeginnerResult | null; prediction: BeginnerPrediction | null
}) {
  return <div className="beginner-result" role="status" aria-live="polite" data-testid="beginner-result">
    {result ? <>
      <h3>{result.outcome ? outcomeLabels[result.outcome] : 'Chưa thể đánh giá'}</h3>
      <p>{result.message}</p>
      {result.status === 'ready' && <p><strong>
        {prediction === result.outcome
          ? 'Dự đoán khớp quan sát.'
          : 'Quan sát khác dự đoán. Thử giải thích rồi dự đoán lại.'}
      </strong></p>}
      <p>Nguồn: {result.evidenceKind === 'topology-check' ? 'kiểm tra kết nối' : 'trace mô hình bài học'}.</p>
      <ol>{result.trace.map((line, index) => <li key={index}>{line}</li>)}</ol>
    </> : <p>Chưa có kết quả cho lựa chọn hiện tại. Dự đoán rồi bấm “Quan sát mô hình”.</p>}
  </div>
}

function RepairLab({ repair, attempt, save }: {
  repair: NonNullable<ReturnType<typeof getBeginnerRepair>>
  attempt: RepairAttempt
  save: (attempt: RepairAttempt) => void
}) {
  const [prediction, setPrediction] = useState<BeginnerPrediction | null>(null)
  const [result, setResult] = useState<BeginnerResult | null>(null)
  const controls = repairControls(repair, attempt.fixed)
  const choices = [repair.expectedBefore, repair.expectedAfter]

  function selectPosition(fixed: boolean) {
    save({ ...attempt, fixed })
    setPrediction(null)
    setResult(null)
  }

  function observe() {
    if (!prediction) return
    const observed = observeRepair(repair, attempt, prediction)
    setResult(observed.result)
    save(observed.evidence)
  }

  return <section className="beginner-repair-lab" aria-labelledby="repair-title">
    <GuideContextBridge snapshot={{ owner: 'beginner-repair', priority: 110, lesson: repair.title,
      status: attempt.after ? 'Đã ghi bằng chứng trước và sau khi sửa' : 'Đang tìm lỗi kết nối',
      next: !attempt.before ? 'Dự đoán rồi kiểm tra mạch ở vị trí ban đầu.' : !attempt.after ? 'Đổi vị trí đầu nối hoặc linh kiện, rồi dự đoán và kiểm tra lại.' : 'Đối chiếu kết quả trước và sau khi sửa.',
    }} />
    <h2 id="repair-title" tabIndex={-1}>{repair.title}</h2>
    <p>{repair.goal}</p>
    <div className="beginner-lab-layout">
      <div>
        {repair.id === 'breadboard-strip'
          ? <figure className="beginner-breadboard">
            <div className="beginner-repair-strip" aria-label="Dải cắm 10a đến 10f">
              <span className={attempt.fixed ? 'is-connected' : ''}>10a{attempt.fixed && ' · Đầu dây'}</span>
              <span>10e · Mốc</span><span>Rãnh</span>
              <span className={!attempt.fixed ? 'is-connected' : ''}>10f{!attempt.fixed && ' · Đầu dây'}</span>
            </div>
            <figcaption>Sơ đồ dải nối của mô hình 400 lỗ.</figcaption>
          </figure>
          : <FoundationCircuit controls={controls} />}
        <fieldset>
          <legend>Vị trí đầu nối hoặc linh kiện</legend>
          <label className="beginner-choice"><input type="radio" name="repair-position" checked={!attempt.fixed} onChange={() => selectPosition(false)} />{repair.faultyOption}</label>
          <label className="beginner-choice"><input type="radio" name="repair-position" checked={attempt.fixed} onChange={() => selectPosition(true)} />{repair.fixedOption}</label>
        </fieldset>
      </div>
      <div>
        <fieldset>
          <legend>Dự đoán kết quả</legend>
          {choices.map(choice => <label className="beginner-choice" key={choice}>
            <input type="radio" name="repair-prediction" checked={prediction === choice} onChange={() => { setPrediction(choice); setResult(null) }} />
            {outcomeLabels[choice]}
          </label>)}
        </fieldset>
        <button className="beginner-observe" type="button" disabled={!prediction} onClick={observe}>Kiểm tra kết nối</button>
        {result && <ObservationResult result={result} prediction={prediction} />}
        <aside className="beginner-hints" aria-label="Gợi ý sửa mạch">
          <button type="button" disabled={attempt.hints >= repair.hints.length} onClick={() => save({ ...attempt, hints: attempt.hints + 1 })}>Xem gợi ý ({attempt.hints}/{repair.hints.length})</button>
          {attempt.hints > 0 && <ol>{repair.hints.slice(0, attempt.hints).map(hint => <li key={hint}>{hint}</li>)}</ol>}
        </aside>
      </div>
    </div>
    <section className="beginner-assessment" aria-label="Bằng chứng sửa mạch" aria-live="polite">
      <h3>{attempt.after ? `Đã thực hành: ${repair.skill}` : 'Kết quả trước và sau khi sửa'}</h3>
      <dl className="beginner-repair-evidence">
        <div><dt>Trước khi sửa</dt><dd>{attempt.before ? outcomeLabels[attempt.before] : 'Cần dự đoán đúng và kiểm tra mạch ban đầu'}</dd></div>
        <div><dt>Sau khi sửa</dt><dd>{attempt.after ? outcomeLabels[attempt.after] : 'Cần kiểm tra lại với cách cắm đã sửa'}</dd></div>
      </dl>
      {attempt.after && <p>{repair.explanation}</p>}
    </section>
  </section>
}

export function BeginnerLearningPage() {
  const course = useBeginnerCourse()
  const route = useProductRoute()
  const [params, setParams] = useSearchParams()
  const activityHeading = useRef<HTMLHeadingElement>(null)
  const { session, result } = course
  const activity = getBeginnerActivity(session.activityId)
  const assessment = getBeginnerAssessment(session, activity.id)
  const activityIndex = BEGINNER_ACTIVITIES.findIndex(item => item.id === activity.id)
  const nextActivity = BEGINNER_ACTIVITIES[activityIndex + 1]
  const completed = BEGINNER_ACTIVITIES.filter(item => getBeginnerAssessment(session, item.id).status === 'met').length
  const boardRequired = activity.id === 'button-logic' || activity.id === 'sensor-threshold'
  const boardOptions = getBeginnerBoardOptions()
  const activeRepair = getBeginnerRepair(params.get('repair'))
  const nextRepair = BEGINNER_REPAIRS.find(repair => !session.repairs?.attempts[repair.id]?.after)
  const repairsDone = BEGINNER_REPAIRS.length - BEGINNER_REPAIRS.filter(repair => !session.repairs?.attempts[repair.id]?.after).length
  const code = getBeginnerCode(session)
  const choices: BeginnerPrediction[] = activity.id === 'breadboard'
    ? ['connected', 'separate']
    : activity.id === 'led-polarity' ? ['on', 'off', 'blocked'] : ['on', 'off']
  const hints = session.hintsUsed[activity.id] ?? 0
  const canObserve = Boolean(session.prediction)
    && (!boardRequired || boardOptions.some(board => board.boardId === session.boardId))

  function patchControls(controls: Partial<BeginnerControls>) {
    course.update(previous => ({ ...previous, controls: { ...previous.controls, ...controls }, prediction: null }))
  }
  function navigate(activityId: BeginnerActivityId) {
    course.update(previous => ({ ...previous, activityId, prediction: null,
      ...(previous.repairs && { repairs: { ...previous.repairs, active: null } }),
    }))
    requestAnimationFrame(() => activityHeading.current?.focus())
  }
  function selectBoard(boardId: string) {
    course.update(previous => ({ ...previous, boardId: boardId || null, prediction: null }))
  }
  function predict(prediction: BeginnerPrediction) {
    course.update(previous => ({ ...previous, prediction }))
  }
  function explain(explanationId: string) {
    course.update(previous => ({
      ...previous, explanations: { ...previous.explanations, [activity.id]: explanationId },
    }), false)
  }
  function showHint() {
    course.update(previous => ({
      ...previous,
      hintsUsed: { ...previous.hintsUsed, [activity.id]: Math.min(hints + 1, activity.hints.length) },
    }), false)
  }
  function toggle(key: ToggleKey, label: string) {
    return <Toggle key={key} label={label} checked={session.controls[key]} change={checked => patchControls({ [key]: checked })} />
  }

  function openRepair(id: BeginnerRepairId) {
    course.update(previous => ({ ...previous, repairs: { attempts: previous.repairs?.attempts ?? {}, active: id } }))
    setParams({ repair: id })
    requestAnimationFrame(() => document.getElementById('repair-title')?.focus())
  }

  if (activeRepair) {
    const attempt = session.repairs?.attempts[activeRepair.id] ?? newRepairAttempt()
    return <div className="beginner-page">
      <header className="beginner-header">
        <button type="button" onClick={() => {
          course.update(previous => ({ ...previous, repairs: { attempts: previous.repairs?.attempts ?? {}, active: null } }))
          setParams({})
          requestAnimationFrame(() => activityHeading.current?.focus())
        }}>Về thử nghiệm nền tảng</button>
        <h1>Thử thách sửa mạch</h1>
        <p>{repairsDone}/{BEGINNER_REPAIRS.length} kỹ năng có bằng chứng trong mô hình. {durabilityLabels[course.durability]}.</p>
        {course.hasStorageIssue && <div className="beginner-actions"><button onClick={course.download}>Tải tiến độ hiện tại</button>{course.raw !== null && <button onClick={course.downloadRaw}>Tải dữ liệu gốc đang lưu</button>}<button onClick={course.reload}>Nạp lại bản lưu</button></div>}
      </header>
      <RepairLab key={activeRepair.id} repair={activeRepair} attempt={attempt} save={next => course.update(previous => ({
        ...previous,
        repairs: { active: activeRepair.id, attempts: { ...previous.repairs?.attempts, [activeRepair.id]: next } },
      }))} />
      <div className="beginner-actions beginner-repair-next">
        {attempt.after && nextRepair && <button type="button" onClick={() => openRepair(nextRepair.id)}>Làm tiếp: {nextRepair.title}</button>}
        {repairsDone === BEGINNER_REPAIRS.length && <Link className="button-primary" to={route(PRODUCT_ROUTES.publicCapstone)}>Áp dụng vào mini-project</Link>}
      </div>
      <nav className="beginner-repair-nav" aria-label="Danh sách thử thách sửa mạch">
        {BEGINNER_REPAIRS.map(repair => <button type="button" key={repair.id} onClick={() => openRepair(repair.id)} aria-current={repair.id === activeRepair.id ? 'step' : undefined}>
          {repair.title} · {session.repairs?.attempts[repair.id]?.after ? 'Đã kiểm chứng' : 'Chưa hoàn thành'}
        </button>)}
      </nav>
    </div>
  }

  return <div className="beginner-page">
    <GuideContextBridge snapshot={getBeginnerGuideSnapshot(session, result)} />
    <header className="beginner-header">
      <Link to={route('/topics')}>Chủ đề học</Link>
      <h1>Nền tảng điện tử</h1>
      <p><strong>{completed}/{BEGINNER_ACTIVITIES.length} hoạt động đạt tiêu chí.</strong> <a href="#beginner-activities">Chọn hoạt động</a></p>
      <details className="beginner-scope"><summary>Phạm vi mô hình</summary>
        <p>Bằng chứng từ mô hình giáo dục và kiểm tra kết nối; không phải chạy firmware, giải mạch analog hay phép đo kit thật.</p>
      </details>
    </header>

    {course.hasStorageIssue && <p className="beginner-storage-warning" role="status">{course.message} <a href="#beginner-storage">Xem tùy chọn lưu</a></p>}

    <section className="beginner-activity" aria-labelledby="beginner-activity-title" data-activity={activity.id}>
      <div className="beginner-activity-intro">
        <h2 id="beginner-activity-title" ref={activityHeading} tabIndex={-1}>{activity.title}</h2>
        <p>{activity.goal}</p>
        <p>{activity.instruction}</p>
      </div>
      <div className="beginner-lab-layout">
        <div className="beginner-experiment">
          {boardRequired ? <>
            <div className="beginner-board">
              <label htmlFor="beginner-board">Board của thử nghiệm</label>
              <select id="beginner-board" value={session.boardId ?? ''} onChange={event => selectBoard(event.target.value)}>
                <option value="">Chọn board được hỗ trợ</option>
                {boardOptions.map(board => <option value={board.boardId} key={board.boardId}>{board.name}</option>)}
              </select>
            </div>
            <p>Chọn đúng board để tạo code và trace subset. Lựa chọn này không cấu hình hay điều khiển thiết bị thật.</p>
          </> : activity.id === 'breadboard'
            ? <BreadboardStrip value={session.controls.holePair} change={holePair => patchControls({ holePair })} />
            : <FoundationCircuit controls={session.controls} />}

          <fieldset id="beginner-controls" tabIndex={-1}>
            <legend>1. Đặt thử nghiệm</legend>
            {activity.id === 'closed-loop' && toggle('returnConnected', 'Nối đường về nguồn')}
            {activity.id === 'led-polarity' && <>
              {toggle('ledForward', 'LED đặt thuận chiều')}
              {toggle('resistorPresent', 'Có điện trở nối tiếp')}
              {toggle('returnConnected', 'Nối đường về nguồn')}
            </>}
            {activity.id === 'button-logic' && <>
              {toggle('pressed', 'Đang nhấn nút')}
              {toggle('inverted', 'Đảo điều kiện trong code')}
            </>}
            {activity.id === 'sensor-threshold' && (['inputPercent', 'threshold'] as const).map(key =>
              <label className="beginner-range" key={key}>
                {key === 'inputPercent' ? 'Đầu vào giả định' : 'Ngưỡng so sánh'}: {session.controls[key]}%
                <input
                  type="range" min={key === 'threshold' ? 1 : 0} max={key === 'threshold' ? 99 : 100}
                  step="1" value={session.controls[key]}
                  onChange={event => patchControls({ [key]: Number(event.target.value) })}
                />
              </label>,
            )}
            <div className="beginner-cases">
              <p>Các trường hợp cần thử (chỉ đặt điều khiển):</p>
              {getBeginnerCaseOptions(session).map((option, index) =>
                <button type="button" key={index} onClick={() => patchControls(option.controls)}>{option.label}</button>,
              )}
            </div>
          </fieldset>
          {boardRequired && <details className="beginner-code">
            <summary>Code được tạo cho board đã chọn</summary>
            {code
              ? <pre tabIndex={0} aria-label="Code thử nghiệm chỉ đọc"><code>{code}</code></pre>
              : <p>Chọn board được hỗ trợ để xem code.</p>}
          </details>}
        </div>

        <div className="beginner-reasoning">
          <fieldset id="beginner-prediction" tabIndex={-1}>
            <legend>2. Dự đoán trước khi quan sát</legend>
            {choices.map(choice => <label className="beginner-choice" key={choice}>
              <input
                type="radio" name="beginner-prediction" checked={session.prediction === choice}
                onChange={() => predict(choice)}
              />{outcomeLabels[choice]}
            </label>)}
          </fieldset>
          <button id="beginner-observe" className="beginner-observe" type="button" disabled={!canObserve} onClick={course.observe}>
            Quan sát mô hình
          </button>
          <ObservationResult result={result} prediction={session.prediction} />
          <fieldset id="beginner-explanation" tabIndex={-1}>
            <legend>3. Giải thích điều vừa quan sát</legend>
            <p>{activity.explanationQuestion}</p>
            {activity.explanationChoices.map(choice => <label className="beginner-choice" key={choice.id}>
              <input
                type="radio" name={`explanation-${activity.id}`}
                checked={session.explanations[activity.id] === choice.id} onChange={() => explain(choice.id)}
              />{choice.label}
            </label>)}
          </fieldset>
          <aside id="beginner-hints" tabIndex={-1} className="beginner-hints" aria-label="Gợi ý từng bước">
            <button type="button" disabled={hints >= activity.hints.length} onClick={showHint}>
              Gợi ý tiếp theo ({hints}/{activity.hints.length})
            </button>
            <ol>{activity.hints.slice(0, hints).map(hint => <li key={hint}>{hint}</li>)}</ol>
          </aside>
        </div>
      </div>
      <aside className="beginner-assessment" aria-label="Tiêu chí hoàn thành">
        <h3 aria-live="polite">{assessment.status === 'met' ? 'Đã đạt tiêu chí hoạt động' : 'Tiêu chí hoạt động'}</h3>
        <p>{assessment.observed}/{assessment.required} trường hợp có dự đoán đúng khớp quan sát. {assessment.explanationCorrect ? 'Giải thích đúng.' : 'Cần chọn giải thích đúng.'}</p>
        {assessment.missing.length > 0 && <ul>{assessment.missing.map(item => <li key={item}>{item}</li>)}</ul>}
        <p>Kết quả tính lại theo bằng chứng đã lưu và nhóm board/code hiện tại; không phải tự đánh dấu hoàn thành hay xác nhận kỹ năng phần cứng.</p>
        {assessment.status === 'met' && (nextActivity
          ? <button type="button" className="beginner-next-action" onClick={() => navigate(nextActivity.id)}>Làm tiếp: {nextActivity.title}</button>
          : <Link className="button-primary" to={route(PRODUCT_ROUTES.publicCapstone)}>Thử áp dụng vào mini-project</Link>)}
        {assessment.status === 'met' && BEGINNER_REPAIRS.filter(repair => repair.activity === activity.id).map(repair =>
          <button type="button" key={repair.id} onClick={() => openRepair(repair.id)}>Thử thách: {repair.title}</button>)}
      </aside>
      <div className="beginner-activity-navigation" aria-label="Chuyển hoạt động">
        <button type="button" disabled={activityIndex <= 0} onClick={() => navigate(BEGINNER_ACTIVITIES[activityIndex - 1].id)}>Hoạt động trước</button>
        <button type="button" disabled={!nextActivity} onClick={() => { if (nextActivity) navigate(nextActivity.id) }}>Hoạt động tiếp theo</button>
      </div>
    </section>
    <section className="beginner-storage" aria-labelledby="beginner-repairs-heading">
      <h2 id="beginner-repairs-heading">Thử thách sửa mạch</h2>
      <p>{repairsDone}/{BEGINNER_REPAIRS.length} kỹ năng đã kiểm. Dự đoán và kiểm tra trước, sửa một điểm rồi thử lại.</p>
      <button type="button" onClick={() => openRepair((nextRepair ?? BEGINNER_REPAIRS[0]).id)}>
        {repairsDone ? 'Mở thử thách sửa mạch' : 'Bắt đầu thử thách sửa mạch'}
      </button>
    </section>
    <nav id="beginner-activities" className="beginner-activities" aria-label="Năm hoạt động">
      {BEGINNER_ACTIVITIES.map(item => <button key={item.id} type="button" aria-current={item.id === activity.id ? 'step' : undefined}
        onClick={() => navigate(item.id)}>
        {item.title}
        <small>{getBeginnerAssessment(session, item.id).status === 'met' ? 'Đạt tiêu chí' : 'Chưa đạt tiêu chí'}</small>
      </button>)}
    </nav>
    <aside id="beginner-storage" className="beginner-storage" aria-label="Lưu tiến độ">
      <strong>{durabilityLabels[course.durability]}</strong>
      <details open={course.hasStorageIssue}>
        <summary>Lưu và bản sao</summary>
        <p role="status">{course.message}</p>
        <p>Tiến độ riêng với workspace và checklist cũ. Xóa dữ liệu trình duyệt có thể làm mất bản lưu.</p>
        <div className="beginner-actions">
          <button type="button" onClick={course.download}>Tải tiến độ hiện tại</button>
          {course.raw !== null && <button type="button" onClick={course.downloadRaw}>Tải dữ liệu gốc đang lưu</button>}
          <button type="button" onClick={course.reload}>Nạp lại bản lưu</button>
        </div>
        {course.durability === 'conflict' && <p>Bản đang học vẫn ở bộ nhớ. Tải tiến độ hiện tại trước khi nạp lại nếu muốn giữ cả hai phiên bản.</p>}
      </details>
    </aside>
    <section className="beginner-storage" aria-labelledby="beginner-capstone">
      <h2 id="beginner-capstone">Dự án thực hành</h2>
      <p>Ghép LED, nút nhấn và biến trở. Dự đoán đèn bật khi nào, thử một lỗi dây nối rồi tải hồ sơ kết quả.</p>
      <Link to={route(PRODUCT_ROUTES.publicCapstone)}>Mở mini-project đèn cảnh báo</Link>
    </section>
    <BeginnerTeacherPack />
  </div>
}
