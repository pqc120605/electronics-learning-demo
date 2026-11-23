import { randomBytes, randomUUID } from 'node:crypto'
import dimensions from '../analytics/dimensions.json' with { type: 'json' }
import { sessionDigest } from '../community/session-http.mjs'
import { sessionToken } from './oauth.mjs'
import { inTransaction } from './oauth-store.mjs'

const classes = 'machmo_community.classrooms'
const members = 'machmo_community.classroom_members'
const assignments = 'machmo_community.classroom_assignments'
const submissions = 'machmo_community.classroom_submissions'
const projects = 'machmo_community.saved_projects'
const accounts = 'machmo_community.accounts'
const lessonIds = new Set(dimensions.lessons)
const uuid = /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i
const id = value => typeof value === 'string' && uuid.test(value)
const joinCode = /^[a-zA-Z0-9_-]{12}$/
const fixed = { 'GET /api/classes': 'list', 'POST /api/classes': 'create', 'POST /api/classes/join': 'join' }

export function classroomRoute(method, path) {
  let action = fixed[method + ' ' + path]
  let classId, assignmentId
  if (!action) {
    const match = /^\/api\/classes\/([^/]+)(?:\/(assignments|submissions)(?:\/([^/]+))?)?$/.exec(path)
    if (!match || !id(match[1]) || (match[3] && !id(match[3]))) return null
    classId = match[1]
    assignmentId = match[3]
    if (method === 'GET') action = !match[2] ? 'read' : match[2] === 'submissions' && assignmentId ? 'review' : null
    if (method === 'POST' && !assignmentId) action = match[2] === 'assignments' ? 'assign' : match[2] === 'submissions' ? 'submit' : null
  }
  return action ? { id: 'classroom-' + action, method, classId, assignmentId, csrf: method === 'POST', acceptsBody: method === 'POST' } : null
}

async function membership(db, classId, account) {
  const { rows } = await db.query(
    "SELECT c.*, CASE WHEN c.owner_id=$2 THEN 'teacher' ELSE 'student' END AS role FROM " + classes +
    ' c WHERE c.id=$1 AND (c.owner_id=$2 OR EXISTS (SELECT 1 FROM ' + members + ' m WHERE m.class_id=c.id AND m.account_id=$2))',
    [classId, account])
  return rows[0]
}

function readKit(value) {
  const title = typeof value?.title === 'string' ? value.title.trim() : ''
  const kit = value?.kit
  if (title.length < 1 || title.length > 80 || /[\u0000-\u001f]/.test(title) || ![1, 2].includes(kit?.schemaVersion) ||
    typeof kit.boardId !== 'string' || !/^[a-z0-9-]{1,80}$/.test(kit.boardId) || !Array.isArray(kit.lessonIds) ||
    !kit.lessonIds.length || kit.lessonIds.length > lessonIds.size || !kit.lessonIds.every(item => lessonIds.has(item))) return null
  // Course work needs the board and lessons, not pricing, local notes or student contact data.
  return { title, kit: { schemaVersion: kit.schemaVersion, boardId: kit.boardId, lessonIds: [...new Set(kit.lessonIds)] } }
}

export function createClassroomStore(pool) {
  return {
    async list(account) {
      const { rows } = await pool.query("SELECT c.id,c.title,CASE WHEN c.owner_id=$1 THEN 'teacher' ELSE 'student' END AS role" +
        ' FROM ' + classes + ' c LEFT JOIN ' + members + ' m ON m.class_id=c.id AND m.account_id=$1 ' +
        'WHERE c.owner_id=$1 OR m.account_id=$1 ORDER BY c.created_at DESC,c.id LIMIT 30', [account])
      return rows
    },
    async create(value, account) {
      return inTransaction(pool, async db => {
        await db.query('SELECT id FROM ' + accounts + ' WHERE id=$1 FOR UPDATE', [account])
        const count = await db.query('SELECT count(*)::int AS count FROM ' + classes + ' WHERE owner_id=$1', [account])
        if (count.rows[0].count >= 10) return null
        const { rows } = await db.query('INSERT INTO ' + classes + ' (id,owner_id,title,join_code,kit) VALUES ($1,$2,$3,$4,$5) RETURNING id,title',
          [randomUUID(), account, value.title, randomBytes(9).toString('base64url'), value.kit])
        return rows[0]
      })
    },
    async join(code, account) {
      return inTransaction(pool, async db => {
        await db.query('SELECT id FROM ' + accounts + ' WHERE id=$1 FOR UPDATE', [account])
        const { rows } = await db.query('SELECT id,owner_id FROM ' + classes + ' WHERE join_code=$1', [code])
        const room = rows[0]
        if (!room) return { status: 404 }
        await db.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', ['machmo-class:' + room.id])
        if (await membership(db, room.id, account)) return { status: 200, body: { id: room.id } }
        const { rows: sizes } = await db.query('SELECT (SELECT count(*) FROM ' + members + ' WHERE class_id=$1)::int AS room,' +
          ' (SELECT count(*) FROM ' + members + ' WHERE account_id=$2)::int AS student', [room.id, account])
        if (sizes[0].room >= 50 || sizes[0].student >= 20) return { status: 409 }
        await db.query('INSERT INTO ' + members + ' (class_id,account_id) VALUES ($1,$2)', [room.id, account])
        return { status: 201, body: { id: room.id } }
      })
    },
    async read(classId, account) {
      const room = await membership(pool, classId, account)
      if (!room) return null
      const rows = await pool.query('SELECT a.id,a.lesson_id AS "lessonId",' +
        ' (SELECT count(DISTINCT account_id)::int FROM ' + submissions + ' s WHERE s.assignment_id=a.id AND ($3 OR s.account_id=$2)) AS submitted' +
        ' FROM ' + assignments + ' a WHERE class_id=$1 ORDER BY a.created_at,a.id', [classId, account, room.role === 'teacher'])
      const result = { id: room.id, title: room.title, role: room.role, kit: room.kit, assignments: rows.rows }
      if (room.role === 'teacher') {
        const { rows: counts } = await pool.query('SELECT count(*)::int AS count FROM ' + members + ' WHERE class_id=$1', [classId])
        return { ...result, joinCode: room.join_code, memberCount: counts[0].count }
      }
      return result
    },
    async assign(classId, lesson, account) {
      const room = await membership(pool, classId, account)
      if (room?.role !== 'teacher') return 403
      if (!room.kit.lessonIds.includes(lesson)) return 400
      await pool.query('INSERT INTO ' + assignments + ' (id,class_id,lesson_id) VALUES ($1,$2,$3) ON CONFLICT (class_id,lesson_id) DO NOTHING',
        [randomUUID(), classId, lesson])
      return 204
    },
    async submit(classId, assignmentId, projectId, account) {
      const room = await membership(pool, classId, account)
      if (room?.role !== 'student') return 403
      const result = await pool.query('INSERT INTO ' + submissions + ' (assignment_id,class_id,account_id,project_id) ' +
        'SELECT a.id,a.class_id,$4,p.id FROM ' + assignments + ' a JOIN ' + projects + ' p ON p.id=$3 AND p.account_id=$4 ' +
        "WHERE a.id=$1 AND a.class_id=$2 AND p.bundle->'workspace'->>'lesson'=a.lesson_id AND p.bundle->'workspace'->>'simBoard'=$5 " +
        'ON CONFLICT DO NOTHING', [assignmentId, classId, projectId, account, room.kit.boardId])
      if (result.rowCount) return 204
      const previous = await pool.query('SELECT 1 FROM ' + submissions + ' WHERE assignment_id=$1 AND class_id=$2 AND project_id=$3 AND account_id=$4',
        [assignmentId, classId, projectId, account])
      return previous.rowCount ? 204 : 404
    },
    async review(classId, assignmentId, account) {
      if ((await membership(pool, classId, account))?.role !== 'teacher') return null
      const { rows } = await pool.query('SELECT DISTINCT ON (s.account_id) a.display_name AS "student",p.name AS "project",s.created_at AS "submittedAt" ' +
        'FROM ' + submissions + ' s JOIN ' + accounts + ' a ON a.id=s.account_id JOIN ' + projects + ' p ON p.id=s.project_id ' +
        'WHERE s.class_id=$1 AND s.assignment_id=$2 ORDER BY s.account_id,s.created_at DESC,s.project_id LIMIT 50',
        [classId, assignmentId])
      return rows
    },
  }
}

export function createClassroomHttp({ store, origin, authStore }) {
  const host = new URL(origin).host
  return async (route, request, readBody) => {
    if (request.headers.host !== host) return { status: 404 }
    if (route.csrf && (request.headers.origin !== origin || request.headers['x-machmo-csrf'] !== '1')) return { status: 403 }
    const token = sessionToken(request.headers.cookie)
    const actor = token ? await authStore.read(sessionDigest(token)) : null
    if (!actor) return { status: 401 }
    const action = route.id.slice('classroom-'.length)
    const { classId, assignmentId } = route
    const body = route.acceptsBody ? await readBody() : null
    switch (action) {
      case 'list': return { status: 200, body: await store.list(actor.id) }
      case 'create': {
        const value = readKit(body)
        if (!value) return { status: 400 }
        const result = await store.create(value, actor.id)
        return result ? { status: 201, body: result } : { status: 409 }
      }
      case 'join': return typeof body?.code === 'string' && joinCode.test(body.code) ? store.join(body.code, actor.id) : { status: 400 }
      case 'read': {
        const result = await store.read(classId, actor.id)
        return result ? { status: 200, body: result } : { status: 404 }
      }
      case 'assign': return { status: lessonIds.has(body?.lessonId) ? await store.assign(classId, body.lessonId, actor.id) : 400 }
      case 'submit': return { status: id(body?.assignmentId) && id(body?.projectId) ? await store.submit(classId, body.assignmentId, body.projectId, actor.id) : 400 }
      case 'review': {
        const result = await store.review(classId, assignmentId, actor.id)
        return result ? { status: 200, body: result } : { status: 403 }
      }
      default: return { status: 404 }
    }
  }
}
