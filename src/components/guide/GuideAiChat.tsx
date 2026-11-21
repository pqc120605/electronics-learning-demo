import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react'
import {
  prepareGuideAi, readGuideAiStatus, requestGuideAi, sendGuideAiFeedback, type GuideAiFeedback, type GuideAiStatus, type GuideAiTurn,
} from '../../lib/guideAi'
import type { GuideSnapshot, GuideSource } from '../../lib/guideKnowledge'
import { selfHostedOAuthEnabled } from '../../lib/selfHostedAuth'

type Turn = GuideAiTurn & { model: string; sources: GuideSource[]; followUps: string[]; feedback?: GuideAiFeedback; vote?: boolean }
type Props = {
  snapshot?: GuideSnapshot
  sourceLink: (href: string, label: string) => ReactNode
  onLocal: (question: string) => void
}
const stateText: Record<GuideAiStatus['state'], string> = {
  ready: 'AI đã sẵn sàng.',
  'model-missing': 'Model được chọn chưa có trên máy. Chế độ tra cứu vẫn dùng được.',
  unavailable: 'Chế độ tra cứu đang sẵn sàng. Chưa kết nối được AI.',
  'invalid-model': 'Cấu hình model chưa được hỗ trợ.',
  'quota-exceeded': 'Đã hết lượt hỏi AI. Bạn vẫn có thể tra cứu.',
  'signed-out': 'Đăng nhập để hỏi AI. Chế độ tra cứu vẫn dùng được.',
}

export function GuideAiChat({ snapshot, sourceLink, onLocal }: Props) {
  const id = useId()
  const [status, setStatus] = useState<GuideAiStatus>()
  const [check, setCheck] = useState(0)
  const [question, setQuestion] = useState('')
  const [contextAllowed, setContextAllowed] = useState(false)
  const [turns, setTurns] = useState<Turn[]>([])
  const [pending, setPending] = useState(false)
  const [notice, setNotice] = useState('')
  const requestRef = useRef<AbortController | null>(null)
  const latestTurn = useRef<HTMLElement>(null)

  useEffect(() => {
    const controller = new AbortController()
    void readGuideAiStatus(AbortSignal.any([controller.signal, AbortSignal.timeout(4_000)])).then(result => {
      if (!controller.signal.aborted) setStatus(result)
    })
    return () => controller.abort()
  }, [check])
  useEffect(() => () => requestRef.current?.abort(), [])
  useEffect(() => {
    if (turns.length) latestTurn.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [turns])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = question.trim()
    if (!text || requestRef.current || status?.state !== 'ready') return
    const data = prepareGuideAi(text, turns.map(turn => turn.question), contextAllowed ? snapshot : undefined, status.provider)
    if (data.kind === 'unknown') {
      setNotice(data.message)
      return
    }
    setPending(true)
    setNotice('')
    const controller = new AbortController()
    requestRef.current = controller
    try {
      const reply = await requestGuideAi(text, data.evidence, turns, AbortSignal.any([controller.signal, AbortSignal.timeout(status.provider === 'ollama' ? 65_000 : 58_000)]))
      if (controller.signal.aborted) return
      if (reply.status === 'insufficient') {
        setNotice('AI chưa có đủ nguồn để trả lời câu này. Có thể tra hồ sơ hoặc nêu rõ tên linh kiện, board và bài đang làm.')
        return
      }
      const sources = data.evidence.filter(source => reply.sourceIds.includes(source.id)).flatMap(source => source.sources)
      setTurns(current => [...current, {
        question: text, model: reply.model, answer: reply.answer, followUps: reply.followUps ?? [], feedback: reply.feedback,
        sources: sources.filter((source, index) => sources.findIndex(other => other.href === source.href) === index),
      }].slice(-6))
      setQuestion('')
    } catch (error) {
      if (controller.signal.aborted) return
      const reason = error instanceof Error ? error.message : ''
      if (reason === 'quota-exceeded' || reason === 'signed-out') setStatus(current => current && { ...current, state: reason })
      else setNotice('AI chưa trả lời được. Bạn có thể kiểm tra lại model hoặc tra cứu cục bộ ngay.')
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null
        setPending(false)
      }
    }
  }

  function cancel() {
    requestRef.current?.abort()
    requestRef.current = null
    setPending(false)
    setNotice('Đã dừng lượt trả lời.')
  }

  async function vote(turn: Turn, helpful: boolean) {
    try {
      if (turn.feedback) await sendGuideAiFeedback(turn.feedback, helpful)
      else localStorage.setItem('mach-mo:guide-ai-feedback:v1', JSON.stringify({ helpful, model: turn.model }))
      setTurns(current => current.map(item => item === turn ? { ...item, vote: helpful } : item))
    } catch {
      setNotice('Chưa lưu được đánh giá. Hãy thử lại.')
    }
  }

  const onlineProvider = status?.provider === 'openai'
  return <section className="guide-ai" aria-label="Trò chuyện với Mở Bot AI">
    <h3>Hỏi AI về điện tử</h3>
    <p role="status">{status?.state === 'ready' && onlineProvider ? 'AI đã được cấu hình.'
      : status?.state === 'ready' && status?.provider === 'mock' ? 'Chế độ thử nghiệm.'
      : status ? stateText[status.state] : 'Đang kiểm tra kết nối…'} {status?.model && status.model !== 'lookup' && <code>{status.model}</code>}</p>
    {status?.state === 'signed-out' && sourceLink('/login?next=' + encodeURIComponent(window.location.pathname + window.location.search), 'Đăng nhập')}
    {status && status.state !== 'ready' && <button type="button" onClick={() => { setStatus(undefined); setCheck(number => number + 1) }}>Kiểm tra kết nối lại</button>}
    {!!turns.length && <div className="guide-ai-turns" role="log" aria-label="Đoạn trò chuyện" aria-live="polite">
      {turns.map((turn, index) => <article key={`${index}:${turn.question}`} ref={index === turns.length - 1 ? latestTurn : undefined}>
        <p><strong>Bạn</strong> · {turn.question}</p>
        <p className="guide-ai-answer"><strong>{turn.model === 'mock' ? 'Trả lời thử nghiệm' : 'Trả lời bởi AI, dựa trên nguồn'}</strong> · {turn.answer}</p>
        <nav className="guide-sources" aria-label="Nguồn Mở AI đã dùng">
          {turn.sources.map(source => sourceLink(source.href, source.label))}
        </nav>
        <div className="guide-ai-actions">
          <button type="button" onClick={async () => {
            try { await navigator.clipboard.writeText(turn.answer); setNotice('Đã sao chép câu trả lời.') }
            catch { setNotice('Hãy chọn văn bản câu trả lời để sao chép.') }
          }}>Sao chép câu trả lời</button>
          <button type="button" aria-pressed={turn.vote === true} onClick={() => void vote(turn, true)}>Hữu ích</button>
          <button type="button" aria-pressed={turn.vote === false} onClick={() => void vote(turn, false)}>Chưa hữu ích</button>
        </div>
        {turn.followUps.length > 0 && <div className="guide-ai-actions" aria-label="Câu hỏi tiếp theo">
          {turn.followUps.map(suggestion => <button key={suggestion} type="button" onClick={() => setQuestion(suggestion)}>{suggestion}</button>)}
        </div>}
      </article>)}
    </div>}
    <form className="guide-question" onSubmit={submit}>
      <label htmlFor={id}>Câu hỏi cho Mở AI</label>
      <textarea id={id} value={question} rows={2} maxLength={400} onChange={event => setQuestion(event.target.value)} placeholder="Ví dụ: Vì sao LED cần điện trở?" />
      {snapshot && <label className="guide-ai-context">
        <input type="checkbox" checked={contextAllowed} disabled={pending} onChange={event => {
          setContextAllowed(event.target.checked)
          setTurns([])
          setNotice('')
        }} /> Dùng ngữ cảnh bài đang mở
      </label>}
      <p className="guide-retrieval-note">{onlineProvider
        ? 'Khi gửi, OpenAI xử lý câu hỏi, tối đa hai lượt hỏi đáp gần đây và trích đoạn tài liệu liên quan.'
        : selfHostedOAuthEnabled ? 'Câu hỏi và tài liệu liên quan được xử lý trên máy chủ Mạch Mở.'
        : 'Câu hỏi và tài liệu liên quan được xử lý trên máy này.'}</p>
      <div className="guide-ai-actions">
        {pending
          ? <button key="cancel" type="button" onClick={event => { event.preventDefault(); cancel() }}>Dừng trả lời</button>
          : <button key="send" className="guide-primary" type="submit" disabled={!question.trim() || status?.state !== 'ready'}>{onlineProvider ? 'Gửi câu hỏi tới AI' : 'Gửi tới AI trên máy'}</button>}
        <button type="button" onClick={() => onLocal(question)}>Tra cứu cục bộ</button>
        {!!turns.length && <button type="button" disabled={pending} onClick={() => { setTurns([]); setNotice('Đã bắt đầu cuộc trò chuyện mới.') }}>Cuộc trò chuyện mới</button>}
      </div>
    </form>
    <p role="status" aria-live="polite">{pending ? 'Mở đang đọc nguồn và soạn câu trả lời…' : notice}</p>
  </section>
}
