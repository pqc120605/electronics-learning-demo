import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
const root = fileURLToPath(new URL('../', import.meta.url))
const env = { ...process.env, PLAYWRIGHT_BROWSERS_PATH: process.env.PLAYWRIGHT_BROWSERS_PATH || path.resolve(root, '../.tools/mach-mo-review/playwright') }
const args = process.argv.slice(2)
if (args[0] === 'test') {
  for (const buildArgs of [
    [path.join(root, 'node_modules/typescript/bin/tsc'), '-b'],
    [path.join(root, 'node_modules/vite/bin/vite.js'), 'build'],
  ]) {
    const build = spawnSync(process.execPath, buildArgs, { cwd: root, env, stdio: 'inherit' })
    if (build.error) console.error(build.error.message)
    if (build.status !== 0) process.exit(build.status ?? 1)
  }
}
const result = spawnSync(process.execPath, [path.join(root, 'node_modules/@playwright/test/cli.js'), ...args], { cwd: root, env, stdio: 'inherit' })
if (result.error) console.error(result.error.message)
process.exit(result.status ?? 1)
