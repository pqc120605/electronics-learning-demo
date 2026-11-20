import { lazy, Suspense, useState } from 'react'
import { SAVED_PROJECTS_KEY } from '../../lib/savedProjectStorageKey'
import { getBrowserStorage } from '../../lib/workspaceStorage'

const RecentProjectLink = lazy(() => import('./RecentProjectLink'))

export function RecentProjectResume() {
  const [hasSavedProjects] = useState(() => {
    try {
      const serialized = getBrowserStorage('localStorage').getItem(SAVED_PROJECTS_KEY)
      return Boolean(serialized && serialized !== '[]')
    } catch {
      return false
    }
  })

  return hasSavedProjects ? <Suspense fallback={null}><RecentProjectLink /></Suspense> : null
}
