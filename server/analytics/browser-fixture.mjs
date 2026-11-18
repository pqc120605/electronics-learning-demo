import http from 'node:http'
import { createReadStream, statSync } from 'node:fs'
import path from 'node:path'
import pg from 'pg'
import { createAnalyticsServer } from './http.mjs'
import { createPostgresStore } from './store.mjs'

const pool = new pg.Pool({ connectionString: process.env.MACHMO_TEST_DATABASE_URL })
const store = createPostgresStore(pool)
const publicServer = createAnalyticsServer({ mode: 'public', store, origins: ['http://127.0.0.1:5288'] })
const privateServer = createAnalyticsServer({ mode: 'private', store })
const dist = path.resolve('dist')
const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml' }

for (const [port, api] of [[5288, publicServer], [8081, privateServer]]) {
  http.createServer((request, response) => {
    if (request.url?.startsWith('/api/')) { api.emit('request', request, response); return }
    const pathname = new URL(request.url, `http://127.0.0.1:${port}`).pathname
    let file = path.resolve(dist, `.${pathname}`)
    if (!file.startsWith(dist + path.sep) || !path.extname(file)) file = path.join(dist,'index.html')
    try {
      if (!statSync(file).isFile()) { response.writeHead(404).end(); return }
      response.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream')
      createReadStream(file).pipe(response)
    } catch { response.writeHead(404).end() }
  }).listen(port, '127.0.0.1')
}
