import {createServer} from 'vite'
import {chromium} from '@playwright/test'
import fs from 'node:fs'
import {createHash} from 'node:crypto'
const sha=value=>createHash('sha256').update(value).digest('hex')
const server=await createServer({configFile:'vite.config.ts',server:{host:'127.0.0.1',port:5332,strictPort:true},logLevel:'silent'})
await server.listen()
const browser=await chromium.launch({headless:true})
try{
 const page=await browser.newPage();await page.goto('http://127.0.0.1:5332')
 const renderTop = (url, maxEdge, front = false) => page.evaluate(async ({ assetUrl, maxEdge, front }) => {
  const { renderOrthographicMesh } = await import('/src/lib/renderOrthographicMesh.ts')
  return renderOrthographicMesh(assetUrl, { maxEdge, front })
 }, { assetUrl: url, maxEdge, front })
 if (process.argv.includes('--components')) {
  const { partsGallery } = await server.ssrLoadModule('/src/data/partsGallery.ts')
  const { getComponentMesh, getComponentMeshForCatalog } = await server.ssrLoadModule('/src/data/componentModels.ts')
  const { getCatalogModel } = await server.ssrLoadModule('/src/lib/componentCatalog.ts')
  const componentAtlas = {}
  const previous = process.argv.includes('--missing') ? JSON.parse(fs.readFileSync('src/data/componentTopViews.json', 'utf8')) : {}
  fs.mkdirSync('public/component-reference/topview', { recursive: true })
  for (const entry of partsGallery) {
   if (entry.board || entry.variant && !['IC-1', 'KIT-1'].includes(entry.variant.revision) || entry.breadboard) continue
   const mesh = getComponentMeshForCatalog(entry.part.id) ?? getComponentMesh(getCatalogModel(entry.part.id)?.id)
   if (!mesh) continue
   const assetSha256 = mesh.sha256.toLowerCase()
   if (componentAtlas[assetSha256]) continue
   if (sha(fs.readFileSync('public' + mesh.file)) !== assetSha256) throw new Error(`GLB hash mismatch: ${mesh.file}`)
   const prior = previous[assetSha256]
   const front = entry.part.id === 'dht11' || entry.part.id === 'dht22-bare'
   if (prior && Boolean(prior.front) === front && fs.existsSync('public' + prior.image) && sha(fs.readFileSync('public' + prior.image)) === prior.imageSha256) {
    componentAtlas[assetSha256] = prior
    continue
   }
   const render = await renderTop(mesh.file, 900, front)
   const image = `/component-reference/topview/${assetSha256.slice(0, 20)}.png`
   const data = Buffer.from(render.dataUrl.split(',')[1], 'base64')
   fs.writeFileSync('public' + image, data)
   componentAtlas[assetSha256] = {
    image, width: render.width, height: render.height, boundsMm: render.boundsMm, imageSha256: sha(data),
    ...(front ? { front: true } : {}),
   }
  }
  fs.writeFileSync('src/data/componentTopViews.json', JSON.stringify(componentAtlas, null, 2) + '\n')
  console.log(`Component projections: ${Object.keys(componentAtlas).length}`)
 } else {
 const { boardCatalogModelIds, loadBoardCatalogModel } = await server.ssrLoadModule('/src/lib/boardCatalogModels.ts')
 const { getBoardModelEvidence } = await server.ssrLoadModule('/src/data/boardModelSources.ts')
 const atlasPath = 'src/data/boardTopViews.json'
 const atlas = process.argv.includes('--missing') ? JSON.parse(fs.readFileSync(atlasPath, 'utf8')) : {}
 fs.mkdirSync('public/board-reference/topview', { recursive: true })
 for (const id of boardCatalogModelIds) {
  const model = await loadBoardCatalogModel(id)
  if (!model) throw new Error(`Catalog model is missing for ${id}`)
  const asset = fs.readFileSync('public' + model.assetUrl.split('?')[0])
  const assetSha256 = sha(asset)
  const image = `/board-reference/topview/${id}.png`
  if (atlas[id]?.assetSha256 === assetSha256 && fs.existsSync('public' + image)
    && atlas[id].imageSha256 === sha(fs.readFileSync('public' + image))) continue
  const render = await renderTop(model.assetUrl)
  const data = Buffer.from(render.dataUrl.split(',')[1], 'base64')
  fs.writeFileSync('public' + image, data)
  const revision = model.audit?.revision ?? getBoardModelEvidence(id)?.revision
  if (!revision) throw new Error(`Catalog model revision is missing for ${id}`)
  atlas[id] = {
   id, image, width: render.width, height: render.height, boundsMm: render.boundsMm,
   projection: 'orthographic-xz', asset: model.assetUrl, assetSha256, imageSha256: sha(data), revision,
  }
  console.log(id)
 }
 fs.writeFileSync(atlasPath, JSON.stringify(atlas, null, 2) + '\n')
 fs.writeFileSync('public/board-reference/topview/NOTICE.md','# Mạch Mở orthographic top views\n\nRendered locally from the existing project CAD-reference GLBs, not photographs or measurements. Exact source asset and image SHA-256, revision and X/Z projection bounds are in src/data/boardTopViews.json. No floor, camera perspective, external font or externally fetched asset is used. Original model provenance, upstream attribution and license notices remain in the board model evidence and bundled /model-licenses. These views do not identify every physical clone. They do not add electrical pin claims; missing pad evidence remains unsupported.\n')
 }
}finally{await browser.close();await server.close()}
