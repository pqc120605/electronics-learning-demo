import { useEffect, useState } from 'react'
import { LEARNING_PROGRESS_CHANGED_EVENT, readLearningProgress, type LearningProgress } from './learningProgress'

/** Current local progress, refreshed when another tab changes it or this tab regains focus. */
export function useLearningProgress(): LearningProgress {
  const [progress, setProgress] = useState<LearningProgress>(() => readLearningProgress())
  useEffect(() => {
    const refresh = () => setProgress(readLearningProgress())
    window.addEventListener('storage', refresh)
    window.addEventListener('focus', refresh)
    window.addEventListener(LEARNING_PROGRESS_CHANGED_EVENT, refresh)
    return () => {
      window.removeEventListener('storage', refresh)
      window.removeEventListener('focus', refresh)
      window.removeEventListener(LEARNING_PROGRESS_CHANGED_EVENT, refresh)
    }
  }, [])
  return progress
}
