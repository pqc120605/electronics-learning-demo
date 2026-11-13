import type { BuilderLessonId } from '../data/builderLessons'

export type WorkspaceEntryInput = {
  requestedLesson?: BuilderLessonId
  requestedBoard?: string
  hasSavedWorkspace: boolean
  savedBoard: string
}

export type WorkspaceEntryPlan = {
  guided: boolean
  seedLesson?: BuilderLessonId
  board: string
  pendingBoard?: string
}

/**
 * Decides how a URL opens the lab. Links never replace saved work: a lesson link
 * resumes its own guided session, and a board link only offers the board change.
 */
export function planWorkspaceEntry({ requestedLesson, requestedBoard, hasSavedWorkspace, savedBoard }: WorkspaceEntryInput): WorkspaceEntryPlan {
  const guided = Boolean(requestedLesson)
  if (hasSavedWorkspace) {
    return { guided, seedLesson: undefined, board: savedBoard, pendingBoard: requestedBoard && requestedBoard !== savedBoard ? requestedBoard : undefined }
  }
  return { guided, seedLesson: requestedLesson, board: requestedBoard ?? savedBoard, pendingBoard: undefined }
}
