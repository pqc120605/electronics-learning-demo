import { lazy, Suspense } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LessonBoardChooser } from '../components/lesson/LessonBoardChooser'
import { builderLessons, type BuilderLessonId } from '../data/builderLessons'
import { resolveLessonBoardChoice, savedLessonBoard } from '../lib/lessonBoardSelection'

const CircuitBuilderPage = lazy(() => import('./CircuitBuilderPage').then(module => ({ default: module.SelectedCircuitBuilderPage })))

export function CircuitBuilderEntry() {
  const [params, setParams] = useSearchParams()
  const requested = params.get('board')
  const lesson = params.get('lesson')
  let saved: string | undefined

  if (!requested && !lesson) {
    try {
      const storage = window.localStorage
      saved = savedLessonBoard(storage.getItem('machmo-builder-session-v5')) ?? savedLessonBoard(storage.getItem('machmo-builder-session'))
    } catch { /* Board selection works when local storage is unavailable. */ }
  }

  const choice = resolveLessonBoardChoice(requested ?? saved)
  if (choice.kind === 'selected') {
    return <Suspense fallback={<p className="route-loading" role="status">Đang mở bàn lắp mạch…</p>}>
      <CircuitBuilderPage selectedBoardId={choice.target.boardId} />
    </Suspense>
  }

  const lessonId = builderLessons.some(item => item.id === lesson) ? lesson as BuilderLessonId : 'blink'
  return <LessonBoardChooser lessonId={lessonId} requestedId={requested} onChoose={board => {
    const next = new URLSearchParams(params)
    next.set('board', board)
    setParams(next)
  }} />
}
