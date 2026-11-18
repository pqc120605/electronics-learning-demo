import { useEffect, useRef, useState } from 'react'
import {
  createBeginnerSession, observeBeginnerSession,
  type BeginnerSession, type BeginnerResult,
} from './beginnerCourse'
import {
  readBeginnerSession, saveBeginnerSession, formatBeginnerBackup,
  BEGINNER_COURSE_CHANGED_EVENT,
} from './beginnerCourseStorage'

type Durability = 'stored' | 'memory-only' | 'protected' | 'conflict'
type CourseState = {
  session: BeginnerSession
  raw: string | null
  durability: Durability
  message: string
  blocked: boolean
  hasStorageIssue: boolean
}

function initialState(): CourseState {
  const read = readBeginnerSession()
  const protectedData = read.kind === 'invalid' || read.kind === 'unsupported'
  const durability: Durability = read.kind === 'ready'
    ? 'stored'
    : protectedData ? 'protected' : 'memory-only'
  return {
    session: read.session ?? createBeginnerSession(),
    raw: read.raw,
    durability,
    message: read.message,
    blocked: protectedData,
    hasStorageIssue: protectedData || read.kind === 'unavailable',
  }
}

export function downloadBeginnerText(text: string, filename: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function useBeginnerCourse() {
  const [state, setState] = useState(initialState)
  const [result, setResult] = useState<BeginnerResult | null>(null)
  const current = useRef(state)
  const saving = useRef(false)
  current.current = state

  useEffect(() => {
    const refresh = () => {
      // Storage emits the same-tab event synchronously during our own save.
      if (saving.current) return
      const read = readBeginnerSession()
      const previous = current.current
      if (read.raw === previous.raw && read.kind !== 'unavailable') return
      const protectedData = read.kind === 'invalid' || read.kind === 'unsupported'
      const durability: Durability = read.kind === 'unavailable'
        ? (previous.durability === 'conflict' || previous.blocked ? previous.durability : 'memory-only')
        : protectedData ? 'protected' : 'conflict'
      const next = {
        ...previous,
        raw: read.kind === 'unavailable' ? previous.raw : read.raw,
        durability,
        message: read.kind === 'unavailable' || protectedData
          ? read.message
          : 'Bản lưu đã đổi. Phiên đang học vẫn ở bộ nhớ; tải bản sao hoặc nạp lại bản lưu.',
        blocked: protectedData || previous.blocked,
        hasStorageIssue: true,
      }
      current.current = next
      setState(next)
    }
    window.addEventListener('storage', refresh)
    window.addEventListener('focus', refresh)
    window.addEventListener(BEGINNER_COURSE_CHANGED_EVENT, refresh)
    return () => {
      window.removeEventListener('storage', refresh)
      window.removeEventListener('focus', refresh)
      window.removeEventListener(BEGINNER_COURSE_CHANGED_EVENT, refresh)
    }
  }, [])

  function commit(session: BeginnerSession, clearResult = true) {
    if (clearResult) setResult(null)
    const previous = current.current
    if (previous.blocked || previous.durability === 'conflict') {
      const next = { ...previous, session }
      current.current = next
      setState(next)
      return
    }
    saving.current = true
    const saved = saveBeginnerSession(session, previous.raw)
    saving.current = false
    const durability: Durability = saved.kind === 'saved'
      ? 'stored'
      : saved.kind === 'unavailable' ? 'memory-only' : saved.kind
    const next = {
      session,
      raw: saved.raw,
      durability,
      message: saved.message,
      blocked: saved.kind === 'protected',
      hasStorageIssue: saved.kind !== 'saved',
    }
    current.current = next
    setState(next)
  }

  function update(edit: (session: BeginnerSession) => BeginnerSession, clearResult = true) {
    commit(edit(current.current.session), clearResult)
  }
  function observe() {
    const observation = observeBeginnerSession(current.current.session)
    commit(observation.session, false)
    setResult(observation.result)
  }
  function reload() {
    const next = initialState()
    current.current = next
    setState(next)
    setResult(null)
  }
  function download() {
    downloadBeginnerText(formatBeginnerBackup(current.current.session), 'mach-mo-beginner-backup.json')
  }
  function downloadRaw() {
    if (current.current.raw !== null) {
      downloadBeginnerText(current.current.raw, 'mach-mo-beginner-original.json')
    }
  }
  return { ...state, result, update, observe, reload, download, downloadRaw }
}
