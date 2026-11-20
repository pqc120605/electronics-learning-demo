import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { boards } from '../data/boards'
import { esp32DevkitModel } from '../data/esp32DevkitModel'
import { esp32LedLesson } from '../data/lessons'
import { getDefaultBoardFeatureId } from '../lib/boardSelection'
import { useProductRoute } from '../lib/useProductRoute'
import { BoardPinoutExplorer } from './board/BoardPinoutExplorer'
import { BoardViewer } from './board/BoardViewer'
import './LearningPath.css'

const studioTabs = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'pinout', label: 'Pinout' },
  { id: 'example', label: 'Ví dụ' },
  { id: 'specs', label: 'Thông số' },
] as const

type StudioTab = (typeof studioTabs)[number]['id']

export function FirstBoardStudio({ illustration }: { illustration?: ReactNode }) {
  const productRoute = useProductRoute()
  const board = boards.find((item) => item.id === 'esp32-devkit')
  const [sceneId, setSceneId] = useState<'pcb' | 'assembly'>('pcb')
  const [featureId, setFeatureId] = useState(getDefaultBoardFeatureId('esp32-devkit'))
  const [pinId, setPinId] = useState('')
  const [tab, setTab] = useState<StudioTab>('overview')
  const feature = esp32DevkitModel.features.find((item) => item.id === featureId) ?? esp32DevkitModel.features[0]
  const tabIndex = studioTabs.findIndex((item) => item.id === tab)

  function moveTab(nextIndex: number) {
    const next = studioTabs[(nextIndex + studioTabs.length) % studioTabs.length]
    setTab(next.id)
    document.getElementById(`board-studio-tab-${next.id}`)?.focus()
  }

  return <section className="home-studio" aria-labelledby="board-studio-title">
    <div className="home-studio-heading">
      <p className="eyebrow">BOARD BÀI ĐẦU TIÊN</p>
      <h2 id="board-studio-title">Xem board cạnh pinout, ví dụ và thông số</h2>
      <p>{board?.modelNote}</p>
    </div>
    <div className="home-studio-layout">
      <div className="home-studio-view">
        <BoardViewer manifest={esp32DevkitModel} selectedSceneId={sceneId} onSelectScene={setSceneId} selectedFeatureId={feature.id} highlightedFeatureIds={[]} onSelectFeature={setFeatureId} onHoverFeature={() => undefined} selectedPinId={pinId} onSelectPin={setPinId} />
      </div>
      <div className="home-studio-panel">
        <div className="home-studio-tabs" role="tablist" aria-label="Thông tin board">
          {studioTabs.map((item) => <button key={item.id} id={`board-studio-tab-${item.id}`} type="button" role="tab" aria-selected={tab === item.id} aria-controls={`board-studio-panel-${item.id}`} tabIndex={tab === item.id ? 0 : -1} onClick={() => setTab(item.id)} onKeyDown={(event) => {
            if (event.key === 'ArrowRight') { event.preventDefault(); moveTab(tabIndex + 1) }
            else if (event.key === 'ArrowLeft') { event.preventDefault(); moveTab(tabIndex - 1) }
            else if (event.key === 'Home') { event.preventDefault(); moveTab(0) }
            else if (event.key === 'End') { event.preventDefault(); moveTab(studioTabs.length - 1) }
          }}>{item.label}</button>)}
        </div>
        <div id="board-studio-panel-overview" role="tabpanel" aria-labelledby="board-studio-tab-overview" hidden={tab !== 'overview'}>
          <h3>{feature.name}</h3>
          <p>{feature.plainDescription}</p>
          <p>{feature.safetyNote}</p>
          {illustration}
        </div>
        <div id="board-studio-panel-pinout" role="tabpanel" aria-labelledby="board-studio-tab-pinout" hidden={tab !== 'pinout'}>
          {tab === 'pinout' && <BoardPinoutExplorer pins={esp32DevkitModel.pins} selectedPinId={pinId} onSelectPin={setPinId} evidence={esp32DevkitModel.pinoutEvidence} />}
        </div>
        <div id="board-studio-panel-example" role="tabpanel" aria-labelledby="board-studio-tab-example" hidden={tab !== 'example'}>
          <h3>{esp32LedLesson.title}</h3>
          <p>{esp32LedLesson.codeExplanations[0]?.explanation}</p>
          <pre tabIndex={0} aria-label="Code mẫu bài LED"><code>{esp32LedLesson.code}</code></pre>
          <p>{esp32LedLesson.pinMap.map((row) => `${row.from} → ${row.to}`).join(' · ')}</p>
          <Link to={productRoute('/learn/esp32-led')}>Mở bài học nhập môn <span aria-hidden="true">↗</span></Link>
        </div>
        <div id="board-studio-panel-specs" role="tabpanel" aria-labelledby="board-studio-tab-specs" hidden={tab !== 'specs'}>
          <h3>{board?.name}</h3>
          <p>{board?.description}</p>
          <dl>
            <dt>Vi điều khiển</dt><dd>{board?.mcu}</dd>
            <dt>Revision tham chiếu</dt><dd>{board?.revision}</dd>
            <dt>Mức logic</dt><dd>{board?.logicLevel}</dd>
            <dt>Giao tiếp</dt><dd>{board?.interfaceSummary}</dd>
            <dt>Phù hợp khi</dt><dd>{board?.bestFor}</dd>
            <dt>Giới hạn</dt><dd>{board?.tradeoffs}</dd>
          </dl>
          <Link to={productRoute('/boards')}>Mở thư viện board <span aria-hidden="true">↗</span></Link>
        </div>
      </div>
    </div>
  </section>
}
