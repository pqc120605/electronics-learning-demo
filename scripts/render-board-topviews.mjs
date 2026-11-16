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
 const models=await server.ssrLoadModule('/src/lib/freestyle/freestylePresentation.ts'),{freestyleBoards}=await server.ssrLoadModule('/src/lib/freestyle/freestyleCircuit.ts')
 const atlas={};fs.mkdirSync('public/board-reference/topview',{recursive:true})
 for(const board of freestyleBoards){
  const view=models.freestylePresentation(board.id,board.defaultPins)
  const render=await page.evaluate(async asset=>{const{renderBoardTopView}=await import('/scripts/board-topview-render.ts');return renderBoardTopView(asset)},view.model.assetUrl)
  const data=Buffer.from(render.dataUrl.split(',')[1],'base64'),image=`/board-reference/topview/${view.canonicalId}.png`,asset=fs.readFileSync('public'+view.model.assetUrl.split('?')[0])
  fs.writeFileSync('public'+image,data)
  atlas[view.canonicalId]={id:view.canonicalId,image,width:render.width,height:render.height,boundsMm:render.boundsMm,projection:'orthographic-xz',asset:view.model.assetUrl,assetSha256:sha(asset),imageSha256:sha(data),revision:view.revision}
  console.log(view.canonicalId)
 }
 fs.writeFileSync('src/data/boardTopViews.json',JSON.stringify(atlas,null,2)+'\n')
 fs.writeFileSync('public/board-reference/topview/NOTICE.md','# Mạch Mở orthographic top views\n\nRendered locally from the existing project CAD-reference GLBs, not photographs or measurements. Exact source asset and image SHA-256, revision and X/Z projection bounds are in src/data/boardTopViews.json. No floor, camera perspective, external font or externally fetched asset is used. Original model provenance, upstream attribution and license notices remain in the board model evidence and bundled /model-licenses. These views do not identify every physical clone. They do not add electrical pin claims; missing pad evidence remains unsupported.\n')
}finally{await browser.close();await server.close()}
