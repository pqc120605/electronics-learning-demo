import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { createServer } from 'vite'

test('beginner entry route owns an explicit title and UI module', async () => {
  assert.ok(existsSync('src/pages/BeginnerLearningPage.tsx'), 'beginner course entry is missing')
  const server = await createServer({ configFile:'vite.config.ts',logLevel:'silent',server:{middlewareMode:true} })
  try {
    const routes=await server.ssrLoadModule('/src/data/productRoutes.ts')
    assert.equal(routes.PRODUCT_ROUTES.publicBasics,'/learn/basics')
    assert.equal(routes.PRODUCT_ROUTES.appBasics,'/app/learn/basics')
    assert.match(routes.getPageTitle('/learn/basics'),/Nền tảng/)
    assert.equal(routes.getPageTitle('/app/learn/basics'),routes.getPageTitle('/learn/basics'))
    const page=await server.ssrLoadModule('/src/pages/BeginnerLearningPage.tsx')
    assert.equal(typeof page.BeginnerLearningPage,'function')
  } finally { await server.close() }
})
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'

test('restored program activity starts without a board fallback or displayed result', async () => {
  const server = await createServer({configFile:'vite.config.ts',logLevel:'silent',server:{middlewareMode:true}})
  const original=globalThis.window
  try {
    const engine=await server.ssrLoadModule('/src/lib/beginnerCourse.ts')
    const session={...engine.createBeginnerSession(),activityId:'button-logic',boardId:null}
    globalThis.window={localStorage:{getItem:()=>JSON.stringify(session)}}
    const {BeginnerLearningPage}=await server.ssrLoadModule('/src/pages/BeginnerLearningPage.tsx')
    const html=renderToStaticMarkup(createElement(MemoryRouter,null,createElement(BeginnerLearningPage)))
    assert.match(html,/Chọn board được hỗ trợ/)
    assert.match(html,/Chưa có kết quả cho lựa chọn hiện tại/)
    assert.match(html,/<button[^>]*disabled=""[^>]*>Quan sát mô hình/)
    assert.doesNotMatch(html,/aria-label="Code thử nghiệm chỉ đọc"/)
  } finally { if(original===undefined)delete globalThis.window;else globalThis.window=original;await server.close() }
})
