import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

const [routes, registry, app, nav, workspaceNav] = await Promise.all([
  readFile('src/data/productRoutes.ts', 'utf8'),
  readFile('src/data/productFeatureRegistry.ts', 'utf8'),
  readFile('src/App.tsx', 'utf8'),
  readFile('src/components/SiteNavigation.tsx', 'utf8'),
  readFile('src/components/AppWorkspaceNavigation.tsx', 'utf8'),
])

test('SPICE workbench is registered in public and app namespaces', () => {
  assert.match(routes, /publicSpice:\s*'\/tools\/spice'/)
  assert.match(routes, /appSpice:\s*'\/app\/tools\/spice'/)
  assert.match(routes, /\[PRODUCT_ROUTES\.publicSpice\]:\s*PRODUCT_ROUTES\.appSpice/)
  assert.match(app, /Route path=\{R\.appSpice\} element=\{shell\(<SpiceWorkbenchPage \/>\)\}/)
  assert.match(app, /Route path=\{R\.publicSpice\} element=\{shell\(<SpiceWorkbenchPage \/>\)\}/)
})

test('SPICE is discoverable from both navigation shells', () => {
  assert.match(registry, /type ProductFeatureId[^\n]*'spice'/)
  assert.match(registry, /\['calculators', 'spice', 'firmware'\]/)
  assert.match(nav, /F\.spice\.publicRoute/)
  assert.match(workspaceNav, /appNavigationGroups/)
})

