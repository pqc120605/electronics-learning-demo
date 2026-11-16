import assert from 'node:assert/strict'
import {before,after,test} from 'node:test'
import {createServer} from 'vite'
let server,fs,drafts
before(async()=>{server=await createServer({configFile:'vite.config.ts',logLevel:'silent',server:{middlewareMode:true}});fs=await server.ssrLoadModule('/src/lib/freestyle/freestyleCircuit.ts');drafts=await server.ssrLoadModule('/src/lib/freestyle/freestyleDrafts.ts')})
after(async()=>server?.close())
const storage=()=>{const data=new Map();return {get length(){return data.size},key:i=>[...data.keys()][i]??null,getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)}}
test('every replacement archives the current exact raw document and can be restored',()=>{
 const store=storage(),one=fs.defaultFreestyleWorkspace(),two={...one,code:'// new work'}
 const a=drafts.archiveFreestyle(store,JSON.stringify(one)),b=drafts.archiveFreestyle(store,JSON.stringify(two))
 assert.equal(a.ok,true);assert.equal(b.ok,true);assert.notEqual(a.key,b.key)
 const saved=drafts.listFreestyleDrafts(store)
 assert.equal(saved.length,2)
 assert.ok(saved.some(d=>d.raw===JSON.stringify(two)&&d.workspace.code==='// new work'))
})
test('quota failure is reported and does not overwrite any current or previous draft',()=>{
 const store=storage(),raw=JSON.stringify(fs.defaultFreestyleWorkspace());store.setItem(fs.FREESTYLE_STORAGE_KEY,raw)
 store.setItem=()=>{throw Error('quota')}
 assert.equal(drafts.archiveFreestyle(store,raw).ok,false)
 assert.equal(store.getItem(fs.FREESTYLE_STORAGE_KEY),raw)
})
