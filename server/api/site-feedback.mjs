const kinds = new Set(['bug', 'idea', 'content'])
const limits = { title: 160, details: 5000, steps: 3000, expected: 1500, actual: 1500, page: 180 }
const fields = new Set(['id', 'kind', 'rating', ...Object.keys(limits)])
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i

export function siteFeedbackInput(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => !fields.has(key))
    || typeof value.id !== 'string' || !uuid.test(value.id) || !kinds.has(value.kind)
    || (value.rating !== null && (!Number.isInteger(value.rating) || value.rating < 1 || value.rating > 5))) return null
  const text = {}
  for (const [key, limit] of Object.entries(limits)) {
    if (typeof value[key] !== 'string' || value[key].length > limit || value[key].includes('\0')) return null
    text[key] = value[key].trim()
  }
  const base = 'https://machmo.invalid'
  const page = text.page && URL.parse(text.page, base)
  if (text.title.length < 3 || text.details.length < 10
    || (text.page && (!text.page.startsWith('/') || text.page.startsWith('//') || !page
      || page.origin !== base || page.pathname !== text.page))) return null
  if (value.kind !== 'bug') text.steps = text.expected = text.actual = ''
  return { id: value.id, kind: value.kind, rating: value.rating, ...text }
}

export function createSiteFeedbackStore(pool) {
  return {
    async save(input) {
      await pool.query(
        'INSERT INTO machmo_community.site_feedback (id,kind,title,details,page,steps,expected,actual,rating)' +
        ' VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (id) DO NOTHING',
        [input.id, input.kind, input.title, input.details, input.page, input.steps, input.expected, input.actual, input.rating])
    },
    async report(start, end) {
      const { rows } = await pool.query(`
        WITH recent AS (
          SELECT id,kind,title,details,page,steps,expected,actual,rating,created_at AS "createdAt"
          FROM machmo_community.site_feedback WHERE created_at >= $1 AND created_at < $2
          ORDER BY created_at DESC,id DESC LIMIT 50
        )
        SELECT count(*)::int AS total, count(rating)::int AS rated, avg(rating)::float8 AS average,
          COALESCE((SELECT jsonb_agg(recent ORDER BY "createdAt" DESC,id DESC) FROM recent), '[]'::jsonb) AS items
        FROM machmo_community.site_feedback WHERE created_at >= $1 AND created_at < $2
      `, [start, end])
      return rows[0]
    },
    async expire() {
      await pool.query('SELECT machmo_community.expire_site_feedback()')
    },
  }
}
