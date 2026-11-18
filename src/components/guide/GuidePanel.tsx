import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { toAppRoute } from '../../data/productRoutes'
import { findGuideAnswers, getContextAdvice, guideRoute, type GuideSearchResult } from '../../lib/guideKnowledge'
import { guideSourceKind } from '../../lib/guideSearch'
import { BEGINNER_GUIDE_TARGET_IDS, type BeginnerGuideActionId } from '../../lib/beginnerGuide'
import { requestTour } from '../onboarding/Onboarding'
import { tourIdForPath } from '../onboarding/tours'
import { useGuideSnapshot } from './GuideContext'
import { MascotAvatar } from './MascotAvatar'
import type { MascotMood } from './MascotScene'

type Props = {
  pathname: string
  motion: boolean
  reduced: boolean
  onMotion: (value: boolean) => void
  onClose: () => void
  onNavigate: (target: HTMLElement) => void
  onHide: () => void
  onStartTour: () => void
}
/** An optional future AI adapter must be separately configured and opt-in. No network answer provider is enabled. */
export const GUIDE_ANSWER_PROVIDER = { id: 'curated-local', external: false } as const

export default function GuidePanel({ pathname, motion, reduced, onMotion, onClose, onNavigate, onHide, onStartTour }: Props) {
  const snapshot = useGuideSnapshot()
  const heading = useId()
  const description = useId()
  const root = useRef<HTMLElement>(null)
  const [tab, setTab] = useState<'guide' | 'ask' | 'context'>('guide')
  const [question, setQuestion] = useState('')
  const [result, setResult] = useState<GuideSearchResult | null>(null)
  const [mood, setMood] = useState<MascotMood>('greeting')
  const [understood, setUnderstood] = useState(false)
  const snapshotKey = JSON.stringify(snapshot ?? null)
  const [answerContext, setAnswerContext] = useState(snapshotKey)
  // Hide an old answer during the render that receives new context, before effects run.
  const currentResult = answerContext === snapshotKey ? result : null
  const route = guideRoute(pathname)
  const tour = tourIdForPath(pathname)
  const link = (href: string) => pathname.startsWith('/app') ? toAppRoute(href) : href

  function sourceLink(href: string, label: string) {
    const kind = guideSourceKind(href)
    return kind === 'external' || kind === 'document'
      ? <a key={href} href={href} target="_blank" rel="noopener noreferrer">{label} ↗</a>
      : kind === 'route' ? <Link key={href} to={link(href)} onClick={onClose}>{label}</Link> : null
  }
  useEffect(() => { root.current?.focus({ preventScroll: true }) }, [])
  useEffect(() => {
    setResult(null)
    setUnderstood(false)
  }, [snapshotKey])

  function answerQuestion(text: string) {
    const next = findGuideAnswers(text, snapshot)
    setAnswerContext(snapshotKey)
    setResult(next)
    setMood(next.kind === 'matches' ? 'point' : 'thinking')
    setUnderstood(false)
  }
  function ask(event?: FormEvent) {
    event?.preventDefault()
    answerQuestion(question)
  }
  function changeTab(next: typeof tab) {
    setTab(next)
    setMood(next === 'context' && snapshot?.issues?.length ? 'attention' : next === 'ask' ? 'thinking' : 'point')
  }
  function navigateAction(id: BeginnerGuideActionId) {
    if (!Object.hasOwn(BEGINNER_GUIDE_TARGET_IDS, id)) return
    const target = document.getElementById(BEGINNER_GUIDE_TARGET_IDS[id])
    if (!(target instanceof HTMLElement) || !target.closest('.beginner-page') || !target.getClientRects().length) return
    target.scrollIntoView({ block: 'center', behavior: 'auto' })
    onNavigate(target)
  }
  const suggestions = snapshot?.beginner
    ? ['Tôi nên làm gì tiếp?', 'Giải thích kết quả hiện tại', 'LED cần điện trở', 'INPUT_PULLUP']
    : ['LED cần điện trở', 'Arduino Uno R3 ADC', 'TB6612FNG dùng để làm gì', 'I2C pull-up', 'Lưu bản nháp']

  return <aside
    ref={root} className="guide-dialog" role="dialog" aria-modal="false" aria-labelledby={heading}
    aria-describedby={description} tabIndex={-1}
    onKeyDown={event => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        onClose()
      }
    }}
  >
    <header className="guide-header">
      <div><h2 id={heading}>Mở — bạn đồng hành học điện tử</h2><p id={description}>Hướng dẫn và kiến thức cục bộ · chưa kết nối AI</p></div>
      <button type="button" className="guide-close" aria-label="Thu gọn Mở" onClick={onClose}>×</button>
    </header>
    <MascotAvatar mood={mood} motion={motion} />
    <div className="guide-tabs" role="group" aria-label="Nội dung trợ giúp">
      <button type="button" aria-pressed={tab === 'guide'} onClick={() => changeTab('guide')}>Hướng dẫn</button>
      <button type="button" aria-pressed={tab === 'ask'} onClick={() => changeTab('ask')}>Hỏi đáp</button>
      <button type="button" aria-pressed={tab === 'context'} onClick={() => changeTab('context')}>Đang làm</button>
    </div>
    <div className="guide-body">
      {tab === 'guide' && <section aria-label="Hướng dẫn trang hiện tại">
        <h3>{route.title}</h3><p>Mình là Mở. Cùng làm từng bước nhé!</p>
        <ol className="guide-steps">{route.steps.map(step => <li key={step}>{step}</li>)}</ol>
        {tour && <button type="button" className="guide-primary" onClick={() => { onStartTour(); requestTour(tour) }}>Xem từng bước trên trang</button>}
        <Link className="guide-text-link" to={link(route.href)} onClick={onClose}>Mở khu vực thực hành</Link>
        <div className="guide-try">
          <strong>Đang băn khoăn?</strong>
          <p>Thử hỏi “Vì sao LED cần điện trở?” hoặc xem mục Đang làm để đọc trạng thái ứng dụng.</p>
          <button type="button" onClick={() => changeTab('ask')}>Hỏi Mở một câu</button>
        </div>
      </section>}
      {tab === 'ask' && <section aria-label="Hỏi kiến thức điện tử">
        <form className="guide-question" onSubmit={ask}>
          <label htmlFor={`${heading}-question`}>Câu hỏi của bạn</label>
          <textarea
            id={`${heading}-question`} value={question} maxLength={400} rows={2}
            placeholder="Ví dụ: INPUT_PULLUP hoạt động thế nào?"
            onChange={event => { setQuestion(event.target.value); setResult(null) }}
          />
          <button type="submit" className="guide-primary" disabled={!question.trim()}>Tìm câu trả lời</button>
        </form>
        {!currentResult && <div className="guide-suggestions">
          <p>Bạn có thể hỏi về:</p>
          {suggestions.map(text => <button type="button" key={text} onClick={() => { setQuestion(text); answerQuestion(text) }}>{text}</button>)}
        </div>}
        <div className="guide-results" aria-live="polite" aria-atomic="false">
          {currentResult?.kind === 'unknown' && <p className="guide-unknown">{currentResult.message}</p>}
          {currentResult?.kind === 'matches' && <>
            <p className="guide-retrieval-note">Các mục phù hợp từ catalog và FAQ cục bộ; chưa xác nhận phần cứng thật:</p>
            {currentResult.articles.map(article => <article key={article.id}>
              <h3>{article.title}</h3>
              {article.paragraphs.map(text => <p key={text}>{text}</p>)}
              <nav className="guide-sources" aria-label={`Nguồn cho ${article.title}`}>
                {sourceLink(article.source.href, article.source.label)}
                {article.sources?.map(item => sourceLink(item.href, item.label))}
              </nav>
            </article>)}
            <button type="button" className="guide-understood" onClick={() => { setUnderstood(true); setMood('celebrate') }}>
              {understood ? 'Cùng thử lại trong mạch nhé!' : 'Mình đã hiểu'}
            </button>
          </>}
        </div>
      </section>}
      {tab === 'context' && <section className="guide-context" aria-label="Ngữ cảnh đang làm">
        <h3>Cùng xem bạn đang làm gì</h3>
        {getContextAdvice(snapshot).map(text => <p key={text}>{text}</p>)}
        {snapshot?.beginner?.observation && <p className="guide-context-limit">
          Nguồn kết quả: {snapshot.beginner.observation.evidenceKind === 'topology-check' ? 'kiểm tra kết nối khái niệm' : 'trace subset của mô hình bài học'}.
          {' '}Không phải phép đo kit thật hay thực thi firmware.
        </p>}
        {snapshot?.beginner?.openedHints.map(hint => <p key={hint}>{hint}</p>)}
        {snapshot?.actions?.filter(action => Object.hasOwn(BEGINNER_GUIDE_TARGET_IDS, action.id)).map(action =>
          <button type="button" key={action.id} onClick={() => navigateAction(action.id)}>{action.label}</button>,
        )}
        {snapshot?.issues?.length
          ? <p className="guide-context-limit">Đây là thông báo hiện tại của ứng dụng, chưa phải kết luận về mạch thật. Sửa từng vấn đề rồi quan sát lại.</p>
          : null}
        <p className="guide-context-limit">Mở chỉ đọc tên bài, board, mục đang chọn và trạng thái được trang chia sẻ. Mở không tự chạy code hay sửa mạch.</p>
        <button type="button" onClick={() => changeTab('ask')}>Hỏi thêm về khái niệm</button>
      </section>}
    </div>
    <footer className="guide-footer">
      <label><input type="checkbox" checked={motion} disabled={reduced} onChange={event => onMotion(event.target.checked)} />Chuyển động mascot</label>
      <button type="button" onClick={onHide}>Ẩn nút Mở</button>
      {reduced && <small>Đang theo cài đặt giảm chuyển động của thiết bị.</small>}
    </footer>
  </aside>
}
