import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { boards } from '../../data/boards'
import { PRODUCT_ROUTES } from '../../data/productRoutes'
import { getProjectLessonLabel } from '../../lib/projectLibrary'
import { readSavedProjects } from '../../lib/savedProjects'

export default function RecentProjectLink() {
  const { pathname } = useLocation()
  const [project] = useState(() => readSavedProjects()[0])
  if (!project) return null

  const { workspace } = project.bundle
  const board = boards.find(candidate => candidate.id === (workspace.simBoard ?? workspace.board))
  const library = pathname.startsWith('/app') ? PRODUCT_ROUTES.appProjects : PRODUCT_ROUTES.publicProjects
  const search = new URLSearchParams({ saved: project.id })
  const metadata = [board?.name, getProjectLessonLabel(workspace.lesson)].filter(Boolean).join(' · ')

  return <p className="recent-project-resume">
    <Link to={`${library}?${search}`}>Tiếp tục dự án {project.name}</Link>
    {metadata && <> · {metadata}</>}
  </p>
}
