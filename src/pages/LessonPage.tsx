import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ComponentDetails } from '../components/ComponentDetails'
import { LearningActivity } from '../components/LearningActivity'
import { BoardViewer } from '../components/board/BoardViewer'
import { BoardModelEvidencePanel } from '../components/board/BoardModelEvidencePanel'
import { PinFlowExplorer } from '../components/board/PinFlowExplorer'
import { esp32DevkitModel } from '../data/esp32DevkitModel'
import { arduinoBoardModels } from '../data/arduinoBoardModels'
import { raspberryPiBoardModels } from '../data/raspberryPiBoardModels'
import { communityBoardModels } from '../data/communityBoardModels'
import { adafruitBoardModels } from '../data/adafruitBoardModels'
import { seeedBoardModels } from '../data/seeedBoardModels'
import { espressifBoardModels } from '../data/espressifBoardModels'
import { esp32LedLesson } from '../data/lessons'
import { trackEvent, trackPageView } from '../lib/analytics'
import { BlockCodeWorkspace } from '../components/lesson/BlockCodeWorkspace'
import { CppPracticeEditor } from '../components/lesson/CppPracticeEditor'
import { ProgramFlowPlayer } from '../components/lesson/ProgramFlowPlayer'
import { generateLedCpp, getProgramActions, starterLedProgram, type LedProgramIr } from '../lib/lessonProgramIr'
import { parseSupportedArduinoSubset } from '../lib/parseSupportedArduinoSubset'
import { getDefaultBoardFeatureId } from '../lib/boardSelection'
import { getBoardModelEvidence } from '../data/boardModelSources'
import { boards } from '../data/boards'
import { getBoardPracticeRoute } from '../lib/lessonPreflight'
import { getKnownChecklistItems, readLessonChecklist, recordLessonOpened, saveLessonChecklist, shouldRecordLessonVisit } from '../lib/learningProgress'
import { curriculumLessons } from '../data/curriculumSchema'
import { getLessonEntryRoute, getNextLessonId } from '../data/learningPath'
import { useProductRoute } from '../lib/useProductRoute'
import { CapabilityBadge } from '../components/CapabilityBadge'
import { LessonProgressToggle } from '../components/LessonProgressToggle'
import { useLearningProgress } from '../lib/useLearningProgress'
import { getLessonCircuitDoc } from '../data/lessonCircuitDocs'
import { LessonCircuitWorkspace, type LessonCircuitAction } from '../components/lesson/LessonCircuitWorkspace'

export function LessonPage() {
  const productRoute = useProductRoute()
  const learningProgress = useLearningProgress()
  const lesson = esp32LedLesson
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedBoardId = searchParams.get('board')
  const availableBoards = useMemo(() => [...arduinoBoardModels, ...raspberryPiBoardModels, ...communityBoardModels, ...adafruitBoardModels, ...seeedBoardModels, ...espressifBoardModels], [])
  const initialBoardId = requestedBoardId === 'esp32-devkit' || requestedBoardId === esp32DevkitModel.id ? esp32DevkitModel.id : availableBoards.some((board) => board.id === requestedBoardId) ? requestedBoardId! : esp32DevkitModel.id
  const [selectedPartId, setSelectedPartId] = useState('esp32')
  const [selectedFeatureId, setSelectedFeatureId] = useState(() => getDefaultBoardFeatureId(initialBoardId))
  const [hoveredFeatureId, setHoveredFeatureId] = useState('')
  const [selectedPinId, setSelectedPinId] = useState('')
  const [selectedSceneId, setSelectedSceneId] = useState<'pcb' | 'assembly'>('assembly')
  const [selectedBoardId, setSelectedBoardId] = useState(initialBoardId)
  const activeBoard = selectedBoardId === esp32DevkitModel.id ? esp32DevkitModel : availableBoards.find((board) => board.id === selectedBoardId) ?? esp32DevkitModel
  const isEsp32Board = activeBoard.id === esp32DevkitModel.id
  const requestedWithoutModel = requestedBoardId && requestedBoardId !== 'esp32-devkit' && requestedBoardId !== esp32DevkitModel.id && !availableBoards.some((board) => board.id === requestedBoardId)
  const requestedBoardProfile = requestedWithoutModel ? boards.find((board) => board.id === requestedBoardId) : undefined
  const recordVisit = shouldRecordLessonVisit(requestedBoardId)
  const [activeFlowId, setActiveFlowId] = useState('power')
  const [activeStepIndex, setActiveStepIndex] = useState(0)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'unavailable'>('idle')
  const [checkedItems, setCheckedItems] = useState<string[]>(() => readLessonChecklist('blink'))
  const [blinkInterval, setBlinkInterval] = useState(500)
  const [simulationPlaying, setSimulationPlaying] = useState(false)
  const [ledLit, setLedLit] = useState(false)
  const [codeMode, setCodeMode] = useState<'blocks' | 'cpp'>('blocks')
  const [lessonProgram, setLessonProgram] = useState<LedProgramIr>(structuredClone(starterLedProgram))
  const [codeDraft, setCodeDraft] = useState(generateLedCpp(starterLedProgram))
  const [programFlowIndex, setProgramFlowIndex] = useState(0)
  const [programFlowPlaying, setProgramFlowPlaying] = useState(false)
  const parsedCode = useMemo(() => parseSupportedArduinoSubset(codeDraft), [codeDraft])
  const intervalProgram = useMemo(() => ({ ...lessonProgram, loop: lessonProgram.loop.map(action => action.kind === 'delay' ? { ...action, milliseconds: blinkInterval } : action) }), [lessonProgram, blinkInterval])
  const activeFlowProgram = codeMode === 'blocks' ? intervalProgram : parsedCode.ok ? parsedCode.program : null
  const activeProgramActions = activeFlowProgram ? getProgramActions(activeFlowProgram) : []
  const activeProgramAction = activeProgramActions[programFlowIndex]?.action
  const activeLessonCircuitAction: LessonCircuitAction | null = activeProgramAction ? {
    kind: activeProgramAction.kind,
    pin: 'pin' in activeProgramAction ? activeProgramAction.pin : activeFlowProgram?.pin ?? 23,
    ...(activeProgramAction.kind === 'write' ? { value: activeProgramAction.value } : {}),
    previousLedLit: activeProgramActions[programFlowIndex]?.ledLit,
    ...(activeProgramAction.line === undefined ? {} : { line: activeProgramAction.line }),
  } : null
  const flowCodeLine = activeProgramActions[programFlowIndex]?.action.line
  const codeFailureMessage = parsedCode.ok ? '' : `Dòng ${parsedCode.line}: ${parsedCode.message}`
  const interactiveCode = codeMode === 'blocks' ? generateLedCpp(intervalProgram) : codeDraft
  const selectedPart = useMemo(
    () => lesson.parts.find((part) => part.id === selectedPartId) ?? lesson.parts[0],
    [lesson.parts, selectedPartId],
  )
  const activeStep = lesson.steps[activeStepIndex]
  const nextLesson = curriculumLessons.find((item) => item.id === getNextLessonId('blink'))
  const activeBoardName = boards.find((board) => board.id === activeBoard.id)?.name ?? 'board tham chiếu'
  const selectedFeature = activeBoard.features.find((feature) => feature.id === selectedFeatureId)
  const hoveredFeature = activeBoard.features.find((feature) => feature.id === hoveredFeatureId)
  const selectedPin = activeBoard.pins.find((pin) => pin.id === selectedPinId)
  const partFeatureIds: Record<string, string[]> = {
    esp32: ['wroom-module', 'pin-headers'], breadboard: ['breadboard'], led: ['external-led'],
    resistor: ['external-resistor'], jumper: ['jumper-wires'],
  }
  const highlightedFeatureIds = [
    ...activeStep.focusParts.flatMap((partId) => partFeatureIds[partId] ?? []),
    ...(activeFlowId === 'led' ? ['external-resistor', 'external-led', 'jumper-wires'] : []),
  ]

  useEffect(() => {
    if (!simulationPlaying) {
      setLedLit(false)
      return
    }

    let nextLit = true
    setLedLit(true)
    const timer = window.setInterval(() => {
      nextLit = !nextLit
      setLedLit(nextLit)
    }, blinkInterval)
    return () => window.clearInterval(timer)
  }, [blinkInterval, simulationPlaying])

  useEffect(() => {
    if (!isEsp32Board || !activeProgramAction || activeProgramAction.kind === 'delay') return
    const pin = activeBoard.pins.find((candidate) => candidate.gpio === activeProgramAction.pin)
    if (pin) setSelectedPinId(pin.id)
  }, [activeBoard, activeProgramAction, isEsp32Board])

  useEffect(() => {
    trackPageView('lesson_open')
  }, [])

  useEffect(() => {
    if (recordVisit) recordLessonOpened('blink')
  }, [recordVisit])

  useEffect(() => {
    saveLessonChecklist('blink', checkedItems)
  }, [checkedItems])

  useEffect(() => {
    const nextBoardId = !requestedBoardId ? undefined : availableBoards.find((board) => board.id === requestedBoardId)?.id ?? esp32DevkitModel.id
    if (nextBoardId && nextBoardId !== selectedBoardId) {
      setSelectedBoardId(nextBoardId)
      setSelectedSceneId('pcb')
      setSelectedPinId('')
      setHoveredFeatureId('')
      setSelectedFeatureId(getDefaultBoardFeatureId(nextBoardId))
    }
  }, [requestedBoardId, selectedBoardId, availableBoards])

  async function copyCode() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(interactiveCode)
      trackEvent('code_copy')
      setCopyStatus('copied')
      window.setTimeout(() => setCopyStatus('idle'), 2200)
    } catch {
      setCopyStatus('unavailable')
    }
  }

  function toggleChecklist(item: string) {
    setCheckedItems((current) => current.includes(item)
      ? current.filter((checked) => checked !== item)
      : [...current, item])
  }

  function selectPart(partId: string) {
    setSelectedPinId('')
    setSelectedPartId(partId)
    trackEvent('component_select', partId)
    if (!isEsp32Board) return
    const feature = esp32DevkitModel.features.find((item) => item.relatedLessonPartIds.includes(partId) && (!['led', 'resistor', 'breadboard', 'jumper'].includes(partId) || item.id === partFeatureIds[partId]?.[0]))
    setSelectedFeatureId(feature?.id ?? '')
    if (partId !== 'esp32') setSelectedSceneId('assembly')
  }

  function selectFeature(featureId: string) {
    setSelectedPinId('')
    setSelectedFeatureId(featureId)
    if (['breadboard', 'external-led', 'external-resistor', 'jumper-wires'].includes(featureId)) setSelectedSceneId('assembly')
    const feature = activeBoard.features.find((item) => item.id === featureId)
    const relatedPartId = feature?.relatedLessonPartIds[0]
    if (relatedPartId) setSelectedPartId(relatedPartId)
  }

  function selectPin(pinId: string) {
    setSelectedPinId(pinId)
    setSelectedFeatureId('pin-headers')
  }

  function selectFlow(flowId: string) {
    setActiveFlowId(flowId)
    if (flowId === 'led') setSelectedSceneId('assembly')
  }

  return (
    <div className="lesson-page">
      <div className="lesson-breadcrumb"><Link to={productRoute('/')}>Bắt đầu học</Link><span>/</span><span>ESP32</span><span>/</span><span>Đèn LED</span><Link className="lesson-builder-link" to={productRoute('/build?board=esp32-devkit')}>Mở phòng thử ↗</Link></div>
      <section className="lesson-heading">
        <div>
          <p className="eyebrow"><span className="eyebrow-line" /> DỰ ÁN NHẬP MÔN · {lesson.estimatedMinutes} PHÚT</p>
          <h1>{lesson.title}</h1>
          <p className="lesson-intro">Một mạch đơn giản để thấy code có thể điều khiển linh kiện thật như thế nào.</p>
        </div>
        <div className="lesson-level"><span className="level-icon" aria-hidden="true">✳</span><span>{lesson.audience}<strong>Không cần kinh nghiệm trước</strong></span></div>
      </section>

      <section className="lesson-brief" aria-label="Tóm tắt bài học">
        <dl>
          <div><dt>Board của bài</dt><dd>ESP32 DevKit V1 · GPIO 23</dd></div>
          <div><dt>Thời lượng</dt><dd>{lesson.estimatedMinutes} phút</dd></div>
          <div><dt>Mức mô phỏng</dt><dd><CapabilityBadge id="behavior-simulation" /></dd></div>
        </dl>
        <Link className="button-primary" to={productRoute('/build?lesson=blink&guided=1')}>Thực hành trong phòng thử <span aria-hidden="true">↗</span></Link>
      </section>
      {!isEsp32Board && <p className="board-reference-warning lesson-board-notice" role="status">Bạn đang xem {activeBoardName} ở chế độ tham khảo. Bài LED, bảng nối chân, code và mô phỏng dưới đây vẫn dành cho ESP32 DevKit V1. <Link to={productRoute(`/boards?board=${activeBoard.id}`)}>Xem hồ sơ board này</Link>{getBoardPracticeRoute(activeBoard.id) && <>{' · '}<Link to={productRoute(getBoardPracticeRoute(activeBoard.id)!)}>Thực hành bài LED trên board này</Link></>}</p>}
      {requestedWithoutModel && <p className="board-reference-warning lesson-board-notice" role="status">{requestedBoardProfile ? `${requestedBoardProfile.name} chưa có mô hình 3D, nên trang đang hiện ESP32 DevKit V1.` : 'Không tìm thấy board trong liên kết, nên trang đang hiện ESP32 DevKit V1.'}{requestedBoardProfile && <> <Link to={productRoute(`/boards?board=${requestedBoardProfile.id}`)}>Xem hồ sơ tra cứu</Link></>}</p>}
      <nav className="lesson-jump" aria-label="Các phần của bài">
        <a href="#lesson-parts">Chuẩn bị</a><a href="#lesson-wiring">Lắp mạch</a><a href="#lesson-board">Board và pinout</a><a href="#lesson-code">Code</a><a href="#lesson-check">Kiểm tra</a>
      </nav>

      <section className="lesson-objectives">
        <div className="objective-title"><span className="objective-mark">✓</span><h2>Sau bài này, bạn sẽ biết</h2></div>
        <div className="objective-list">{lesson.objectives.map((objective, index) => <p key={objective}><span>0{index + 1}</span>{objective}</p>)}</div>
      </section>

      <section className="lesson-section parts-section" id="lesson-parts">
        <div className="lesson-section-heading"><div><p className="eyebrow">CHUẨN BỊ</p><h2>Những thứ bạn cần</h2></div><span className="small-count">{lesson.parts.length} linh kiện</span></div>
        <div className="setup-requirements"><strong>Để nạp và chạy bài học, chuẩn bị thêm:</strong><span>Máy tính</span><span>Cáp USB truyền dữ liệu</span><span>Arduino IDE</span></div>
        <div className="parts-list">{lesson.parts.map((part, index) => <button className={`part-row ${selectedPart.id === part.id ? 'part-row-active' : ''}`} key={part.id} type="button" aria-pressed={selectedPart.id === part.id} onClick={() => selectPart(part.id)}>
          <span className="part-index">0{index + 1}</span><span className={`part-swatch swatch-${part.id}`} aria-hidden="true">{part.id === 'led' ? '●' : part.id === 'resistor' ? '⌁' : part.id === 'jumper' ? '╱' : part.id === 'breadboard' ? '▦' : '▤'}</span><span className="part-name">{part.name}<small>{part.technicalRole}</small></span><span className="part-view">{part.id === 'esp32' && isEsp32Board ? 'Xem trên PCB ↗' : 'Dùng ở bước lắp mạch'}</span>
        </button>)}</div>
        <p className="power-warning"><span>!</span> Chưa cắm cáp USB trong khi lắp mạch. Luôn rút nguồn trước khi thay dây.</p>
      </section>

      <section className="lesson-section wiring-section" id="lesson-wiring">
        <div className="lesson-section-heading"><div><p className="eyebrow">LẮP TỪNG BƯỚC</p><h2>Nối mạch theo thứ tự</h2></div><p>Làm chậm và kiểm tra từng kết nối trước khi cấp nguồn.</p></div>
        <div className="wiring-layout">
          <ol className="step-list">{lesson.steps.map((step, index) => <li key={step.title} className={activeStepIndex === index ? 'step-row-active' : ''}><span className="step-number">{String(index + 1).padStart(2, '0')}</span><button type="button" aria-current={activeStepIndex === index ? 'step' : undefined} onClick={() => setActiveStepIndex(index)}><h3>{step.title}</h3><p>{step.description}</p></button></li>)}</ol>
          <section className="pin-map"><p className="pin-map-label">BẢNG NỐI CHÂN</p><h3>Hai kết nối chính</h3>{lesson.pinMap.map((connection) => <div className="pin-connection" key={connection.from}><span>{connection.from}</span><i aria-hidden="true">↓</i><strong>{connection.to}</strong></div>)}<p className="pin-tip">Điện trở có thể đặt trước hoặc sau LED, miễn là mắc nối tiếp trong cùng một đường dòng điện.</p></section>
        </div>
      </section>

      <section className="lesson-section circuit-section" id="lesson-board" aria-labelledby="circuit-heading">
        <div className="lesson-section-heading"><div><p className="eyebrow">KHÁM PHÁ MẠCH 3D</p><h2 id="circuit-heading">{isEsp32Board ? 'Mỗi linh kiện giữ một vai trò' : 'Khám phá PCB theo CAD tham chiếu'}</h2></div><p>{isEsp32Board ? 'Chọn trực tiếp một bộ phận trên mô hình hoặc trong danh sách.' : 'Xoay mô hình CAD tham chiếu; chọn khối chức năng bên dưới để đọc giải thích.'}</p></div>
        <div className="active-step-note"><span className="active-step-count">BƯỚC {String(activeStepIndex + 1).padStart(2, '0')} / {String(lesson.steps.length).padStart(2, '0')}</span><div><strong>{activeStep.title}</strong><p>{activeStep.description}</p></div><div className="step-switcher"><button type="button" onClick={() => setActiveStepIndex((step) => Math.max(0, step - 1))} disabled={activeStepIndex === 0}>Trước</button><button type="button" onClick={() => setActiveStepIndex((step) => Math.min(lesson.steps.length - 1, step + 1))} disabled={activeStepIndex === lesson.steps.length - 1}>Tiếp theo <span aria-hidden="true">→</span></button></div></div>
        {isEsp32Board && <div className="blink-lab" role="group" aria-label="Bàn thử nhịp nhấp nháy LED">
          <div className="blink-lab-copy"><span className="blink-lab-icon" aria-hidden="true">◉</span><div><strong>Thử đổi nhịp đèn</strong><p>Thay thời gian trong lệnh <code>delay()</code>, rồi xem trạng thái LED ở ô bên cạnh.</p></div></div>
          <label className="blink-range">Mỗi trạng thái kéo dài <output htmlFor="blink-interval">{blinkInterval} ms</output><input id="blink-interval" aria-label="Thời gian mỗi trạng thái LED" type="range" min="200" max="1200" step="100" value={blinkInterval} onChange={(event) => setBlinkInterval(Number(event.target.value))} /></label>
          <button className="blink-toggle" type="button" aria-pressed={simulationPlaying} onClick={() => setSimulationPlaying((playing) => !playing)}>{simulationPlaying ? 'Dừng thử' : 'Chạy thử'}</button>
          <span className={`blink-state ${simulationPlaying ? 'blink-state-running' : ''}`} aria-label={simulationPlaying ? (ledLit ? 'LED đang sáng' : 'LED đang tắt') : 'Đang dừng'}><i />{simulationPlaying ? (ledLit ? 'LED đang sáng' : 'LED đang tắt') : 'Đang dừng'}</span>
          <p className="blink-lab-note">Chỉ mô phỏng nhịp bật/tắt bằng hình ảnh; không chạy firmware hay tính toán điện.</p>
        </div>}
        <div className="board-catalog-picker"><label htmlFor="board-model-select">BOARD ĐANG KHÁM PHÁ</label><select id="board-model-select" value={selectedBoardId} onChange={(event) => { const id = event.target.value; setSelectedBoardId(id); setSearchParams({ board: id === esp32DevkitModel.id ? 'esp32-devkit' : id }); setSelectedSceneId('pcb'); setSelectedPinId(''); setHoveredFeatureId(''); setSelectedFeatureId(getDefaultBoardFeatureId(id)) }}><option value={esp32DevkitModel.id}>ESP32 DevKit V1 · 30 chân</option>{arduinoBoardModels.map((board) => <option key={board.id} value={board.id}>{board.id === 'arduino-uno-r3' ? 'Arduino Uno R3' : board.id === 'arduino-nano-classic' ? 'Arduino Nano classic' : 'Arduino Mega 2560 R3'}</option>)}{raspberryPiBoardModels.map((board) => <option key={board.id} value={board.id}>{board.id === 'raspberry-pi-pico-w' ? 'Raspberry Pi Pico W' : board.id === 'raspberry-pi-pico-2-h' ? 'Raspberry Pi Pico 2 H' : board.id === 'raspberry-pi-pico-2' ? 'Raspberry Pi Pico 2' : 'Raspberry Pi Pico'}</option>)}{adafruitBoardModels.map((board) => <option key={board.id} value={board.id}>{board.id === 'adafruit-qtpy-esp32-c3-5405' ? 'Adafruit QT Py ESP32-C3 · #5405' : board.id === 'adafruit-feather-esp32-s3-tft-5483' ? 'Adafruit Feather ESP32-S3 TFT · #5483' : 'Adafruit Feather ESP32-S3 · #5323'}</option>)}{seeedBoardModels.map((board) => <option key={board.id} value={board.id}>{board.id === 'seeed-xiao-esp32c3' ? 'Seeed Studio XIAO ESP32-C3 · v1.3' : 'Seeed Studio XIAO ESP32-S3 · bản thường'}</option>)}{espressifBoardModels.map((board) => <option key={board.id} value={board.id}>Espressif ESP32-S3-DevKitC-1 · V1.1</option>)}</select><span>Board tham chiếu để khám phá linh kiện; bài LED và code bên dưới vẫn dành cho ESP32.</span></div>
          {!isEsp32Board && <p className="board-reference-warning">Bạn đang xem {activeBoard.id.startsWith('raspberry-pi-') ? 'mô hình CAD Raspberry Pi' : activeBoard.id.startsWith('stm32-') ? 'mô hình CAD STM32' : activeBoard.id.startsWith('adafruit-') ? 'mô hình CAD Adafruit' : activeBoard.id.startsWith('seeed-') ? 'mô hình CAD Seeed Studio' : activeBoard.id === 'esp32-s3-devkitc-1' ? 'mô hình CAD tham chiếu Espressif' : 'mô hình CAD Arduino'} ở chế độ tham khảo. Board, sơ đồ đấu nối, mô phỏng LED và code của bài học bên dưới không tự chuyển theo board này.</p>}
        <div className="interactive-circuit">
          <BoardViewer manifest={activeBoard} selectedSceneId={isEsp32Board ? selectedSceneId : 'pcb'} onSelectScene={setSelectedSceneId} selectedFeatureId={selectedFeatureId} highlightedFeatureIds={isEsp32Board ? [...highlightedFeatureIds, ...(activeProgramActions[programFlowIndex]?.featureIds ?? [])] : []} onSelectFeature={selectFeature} onHoverFeature={setHoveredFeatureId} selectedPinId={selectedPinId} onSelectPin={selectPin} />
          <ComponentDetails part={selectedPin ?? hoveredFeature ?? selectedFeature ?? (isEsp32Board ? selectedPart : activeBoard.features[0])} referenceBoard={!isEsp32Board} />
        </div>
        <BoardModelEvidencePanel evidence={getBoardModelEvidence(activeBoard.id)} />
        {activeBoard.pins.length > 0 && <PinFlowExplorer manifest={activeBoard} selectedPinId={selectedPinId} onSelectPin={setSelectedPinId} activeFlowId={activeFlowId} onSelectFlow={selectFlow} />}
        {isEsp32Board && getLessonCircuitDoc('blink') && <LessonCircuitWorkspace doc={getLessonCircuitDoc('blink')!} activeAction={activeLessonCircuitAction} selectedPartId={selectedPartId === 'esp32' ? 'board-1' : selectedPartId === 'resistor' ? 'res-1' : selectedPartId === 'led' ? 'led-1' : selectedPartId === 'breadboard' ? 'bb-1' : 'board-1'} onSelectPart={id => { const next = id === 'board-1' ? 'esp32' : id === 'res-1' ? 'resistor' : id === 'led-1' ? 'led' : id === 'bb-1' ? 'breadboard' : id; selectPart(next) }} onSelectFeature={selectFeature} />}
        <div className="board-assumption"><span>BOARD TRONG BÀI</span><p>{lesson.boardAssumption}</p></div>
      </section>

      <section className="lesson-section code-section" id="lesson-code">
        <div className="lesson-section-heading"><div><p className="eyebrow">GIỜ ĐẾN LƯỢT CODE</p><h2>Chương trình làm đèn nhấp nháy</h2></div><p>Chọn cách viết phù hợp: ráp khối cho người mới hoặc tự thực hành C++.</p></div>
        <div className="lesson-code-tabs" role="group" aria-label="Chọn cách lập trình"><button type="button" aria-pressed={codeMode === 'blocks'} className={codeMode === 'blocks' ? 'lesson-code-tab-active' : ''} disabled={codeMode === 'cpp' && !parsedCode.ok} title={codeMode === 'cpp' && !parsedCode.ok ? 'Sửa cú pháp chưa hỗ trợ hoặc khôi phục mẫu trước khi chuyển sang khối.' : undefined} onClick={() => { if (parsedCode.ok) { setLessonProgram(parsedCode.program); setCodeMode('blocks'); setProgramFlowIndex(0) } }}>Khối lệnh · bắt đầu dễ</button><button type="button" aria-pressed={codeMode === 'cpp'} className={codeMode === 'cpp' ? 'lesson-code-tab-active' : ''} onClick={() => setCodeMode('cpp')}>Tự viết code C++</button></div>
        {codeMode === 'blocks' ? <BlockCodeWorkspace program={lessonProgram} onChange={(program) => { setLessonProgram(program); setCodeDraft(generateLedCpp(program)); setProgramFlowIndex(0) }} activeActionIndex={programFlowIndex} onActiveAction={setProgramFlowIndex} /> : <CppPracticeEditor source={codeDraft} onSource={setCodeDraft} activeLine={flowCodeLine} onImport={(program) => { setLessonProgram(program); setCodeDraft(generateLedCpp(program)); setCodeMode('blocks'); setProgramFlowIndex(0) }} onActiveLine={(line) => { if (activeFlowProgram) { const match = activeProgramActions.findIndex((item) => item.action.line === line); if (match >= 0) setProgramFlowIndex(match) } }} />}
        <ProgramFlowPlayer program={activeFlowProgram} activeIndex={programFlowIndex} onActiveIndex={setProgramFlowIndex} playing={programFlowPlaying} onPlaying={setProgramFlowPlaying} onUnsupported={codeFailureMessage} />
        {codeMode === 'cpp' && !parsedCode.ok && <p className="flow-code-warning" role="status">{codeFailureMessage} Code vẫn được giữ nguyên; hãy sửa dòng này hoặc khôi phục ví dụ để bật luồng.</p>}
        <div className="code-card">
          <div className="code-topbar"><span><i /><i /><i /> <b>esp32_led.ino</b></span><button type="button" onClick={copyCode}>{copyStatus === 'copied' ? 'Đã sao chép ✓' : 'Sao chép code ⧉'}</button></div>
          <pre><code>{interactiveCode}</code></pre>
          {copyStatus === 'unavailable' && <p className="copy-message" role="status">Trình duyệt chưa cho phép sao chép tự động. Bạn có thể bôi đen code rồi sao chép thủ công.</p>}
        </div>
          <div className="code-explanations">{lesson.codeExplanations.map((item, index) => <article key={item.code}><code>{item.code.replace(/\b500\b/g, String(blinkInterval))}</code><p><span>{String(index + 1).padStart(2, '0')}</span>{item.explanation.replace(/\b500\b/g, String(blinkInterval))}</p></article>)}</div>
        <section className="upload-note"><span aria-hidden="true">↗</span><p><strong>Nạp chương trình</strong>Chọn “ESP32 Dev Module” trong Arduino IDE. Board có thể cần nhấn giữ nút BOOT trong lúc bắt đầu nạp.</p></section>
      </section>

      <section className="lesson-section finish-section" id="lesson-check">
        <div className="lesson-section-heading"><div><p className="eyebrow">KIỂM TRA KẾT QUẢ</p><h2>Đèn đã nhấp nháy chưa?</h2></div><span className="check-progress">{getKnownChecklistItems(checkedItems, lesson.verificationChecklist).length}/{lesson.verificationChecklist.length} đã kiểm tra</span></div>
        <div className="finish-layout"><div className="checklist">{lesson.verificationChecklist.map((item) => <label className="check-item" key={item}><input type="checkbox" checked={checkedItems.includes(item)} onChange={() => toggleChecklist(item)} /><span className="custom-check" aria-hidden="true">✓</span><span>{item}</span></label>)}</div><section className="trouble-card"><p className="eyebrow">NẾU CHƯA CHẠY</p><h3>Thử kiểm tra những điểm này</h3>{lesson.troubleshooting.map((item) => <details key={item.symptom}><summary>{item.symptom}</summary><p>{item.check}</p></details>)}</section></div>
      </section>

      <section className="lesson-end"><span>✳</span><div><strong>Đã có chiếc đèn đầu tiên?</strong><p>Thử đổi thời gian chờ trong code, sau đó mở phòng thử để lắp và chạy bài LED.</p></div><Link to={productRoute('/build?lesson=blink&guided=1')}>Thực hành bài LED <span aria-hidden="true">↗</span></Link><LessonProgressToggle lessonId="blink" />{nextLesson && <Link to={productRoute(getLessonEntryRoute(nextLesson))}>Bài tiếp theo: {nextLesson.title} <span aria-hidden="true">→</span></Link>}</section>
      <LearningActivity attempts={learningProgress.simulationAttempts} lessonId="blink" routeFor={productRoute} />
    </div>
  )
}
