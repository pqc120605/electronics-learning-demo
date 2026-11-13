import { curriculumLessons } from '../data/curriculumSchema'

type SearchableProject = {
  name: string
  bundle: { workspace?: Record<string, unknown> }
  tags?: string[]
}

const lessonTitles = new Map<string, string>(curriculumLessons.map((lesson) => [lesson.id, lesson.title]))

/** Show a useful label for current and legacy lesson IDs in saved/imported projects. */
export function getProjectLessonLabel(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) return 'Project tự do'
  const id = value.trim()
  const title = lessonTitles.get(id)
  if (title) return title
  return id.replaceAll('-', ' ').replace(/^\p{L}/u, (letter) => letter.toLocaleUpperCase('vi-VN'))
}

export function normalizeProjectTags(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const tags: string[] = []
  const seen = new Set<string>()
  for (const item of value) {
    if (typeof item !== 'string') continue
    const tag = item.trim().replace(/\s+/g, ' ').slice(0, 32)
    const key = tag.toLocaleLowerCase('vi-VN')
    if (!tag || seen.has(key)) continue
    seen.add(key)
    tags.push(tag)
    if (tags.length === 8) break
  }
  return tags
}

export function filterSavedProjects<T extends SearchableProject>(projects: T[], query: string): T[] {
  const terms = query.toLocaleLowerCase('vi-VN').trim().split(/\s+/).filter(Boolean)
  if (terms.length === 0) return projects
  return projects.filter((project) => {
    const lesson = String(project.bundle.workspace?.lesson ?? '').replaceAll('-', ' ')
    const searchable = [project.name, lesson, ...(project.tags ?? [])].join(' ').toLocaleLowerCase('vi-VN')
    return terms.every((term) => searchable.includes(term))
  })
}
