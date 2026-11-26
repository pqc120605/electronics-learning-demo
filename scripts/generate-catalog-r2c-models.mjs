import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createServer } from 'vite'

const directory = 'public/models/components/catalog-r2c'
const evidence = 'docs/research/downloads/2026-11-26-catalog-r2c'
const sha256 = buffer => createHash('sha256').update(buffer).digest('hex').toUpperCase()
const metres = value => value / 1000
const decimal = value => Number(value.toFixed(3)).toString()

async function checkSource(path, expected) {
  if (sha256(await readFile(path)) !== expected) throw new Error('Source SHA-256 mismatch: ' + path)
}

function modelFor(board, holes) {
  const [length, top, width] = board.sizeMm
  const left = -length / 2, right = length / 2, north = -width / 2, south = width / 2
  const half = board.openingMm / 2
  const depth = top - 2.4
  const materials = [
    { name: 'ABS', color: [0.83,0.82,0.76,1] },
    { name: 'Socket interior', color: [0.12,0.11,0.10,1] },
    { name: 'Positive rail stripe', color: [0.76,0.032,0.02,1] },
    { name: 'Return rail stripe', color: [0.07,0.075,0.08,1] },
  ]
  const groups = materials.map(() => ({positions:[], normals:[], indices:[]}))
  function quad(mat, normal, points) {
    const {positions,normals,indices} = groups[mat]
    const index = positions.length / 3
    for (const point of points) { positions.push(...point.map(metres)); normals.push(...normal) }
    indices.push(index,index+1,index+2,index,index+2,index+3)
  }
  const horizontal = (mat,y,x1,z1,x2,z2) => {
    if (x2 > x1 && z2 > z1) quad(mat,[0,1,0],[[x1,y,z2],[x2,y,z2],[x2,y,z1],[x1,y,z1]])
  }
  function walls(mat,x1,x2,z1,z2,low,high,inside=false) {
    const sign = inside ? -1 : 1
    const sides = [
      [[0,0,-sign],[[x1,low,z1],[x1,high,z1],[x2,high,z1],[x2,low,z1]]],
      [[0,0,sign],[[x2,low,z2],[x2,high,z2],[x1,high,z2],[x1,low,z2]]],
      [[-sign,0,0],[[x1,low,z2],[x1,high,z2],[x1,high,z1],[x1,low,z1]]],
      [[sign,0,0],[[x2,low,z1],[x2,high,z1],[x2,high,z2],[x2,low,z2]]],
    ]
    for (const [normal, points] of sides) quad(mat,normal,inside ? points.reverse() : points)
  }
  walls(0,left,right,north,south,0,top)
  quad(0,[0,-1,0],[[left,0,north],[right,0,north],[right,0,south],[left,0,south]])

  const rows = new Map()
  for (const hole of holes) {
    const z = hole.point[2]
    if (!rows.has(z)) rows.set(z,[])
    rows.get(z).push(hole.point[0])
  }
  let startZ = north
  for (const [z, values] of [...rows.entries()].sort(([a],[b])=>a-b)) {
    horizontal(0,top,left,startZ,right,z-half)
    let startX = left
    for (const x of values.sort((a,b)=>a-b)) {
      horizontal(0,top,startX,z-half,x-half,z+half)
      walls(1,x-half,x+half,z-half,z+half,depth,top,true)
      horizontal(1,depth,x-half,z-half,x+half,z+half)
      startX = x+half
    }
    horizontal(0,top,startX,z-half,right,z+half)
    startZ = z+half
  }
  horizontal(0,top,left,startZ,right,south)
  for (const [rail,z] of [['T-',-25.7],['T+',-18.85],['B-',18.85],['B+',25.7]]) {
    if (board.railHoles) horizontal(rail.endsWith('+') ? 2 : 3,top+0.001,left+4,z-.14,right-4,z+.14)
  }

  const chunks = [], bufferViews = [], accessors = [], primitives = []
  let offset = 0
  function push(bytes,target,componentType,type,count,range) {
    const exact = Buffer.from(bytes.buffer,bytes.byteOffset,bytes.byteLength)
    const aligned = Buffer.alloc(Math.ceil(exact.length / 4) * 4)
    exact.copy(aligned)
    const bufferView = bufferViews.length
    bufferViews.push({ buffer:0, byteOffset:offset, byteLength:exact.length, target })
    const accessor = accessors.length
    accessors.push({ bufferView, componentType, type, count, ...range })
    chunks.push(aligned)
    offset += aligned.length
    return accessor
  }
  let triangles = 0
  for (const [material,{positions,normals,indices}] of groups.entries()) {
    if (!indices.length) continue
    const points = Float32Array.from(positions)
    const min = [Infinity,Infinity,Infinity], max = [-Infinity,-Infinity,-Infinity]
    points.forEach((value,i)=>{ min[i%3] = Math.min(min[i%3],value); max[i%3] = Math.max(max[i%3],value) })
    primitives.push({
      attributes:{
        POSITION:push(points,34962,5126,'VEC3',points.length/3,{min,max}),
        NORMAL:push(Float32Array.from(normals),34962,5126,'VEC3',points.length/3),
      },
      indices:push(Uint16Array.from(indices),34963,5123,'SCALAR',indices.length),
      material,
    })
    triangles += indices.length / 3
  }
  const contents = {
    asset:{version:'2.0',generator:'Mach Mo R2C'},
    scene:0, scenes:[{nodes:[0]}],
    nodes:[{mesh:0,name:board.catalogId,extras:{holes:holes.map(({id,point})=>[id,...point])}}],
    meshes:[{primitives}], accessors, bufferViews, buffers:[{byteLength:offset}],
    materials:materials.map(({name,color})=>({name,pbrMetallicRoughness:{baseColorFactor:color,metallicFactor:0,roughnessFactor:.85}})),
  }
  const raw = Buffer.from(JSON.stringify(contents))
  const json = Buffer.alloc(Math.ceil(raw.length/4)*4,32)
  raw.copy(json)
  const header = Buffer.alloc(20)
  header.write('glTF')
  header.writeUInt32LE(2,4)
  header.writeUInt32LE(header.length+json.length+8+offset,8)
  header.writeUInt32LE(json.length,12)
  header.write('JSON',16)
  const binHeader = Buffer.alloc(8)
  binHeader.writeUInt32LE(offset)
  binHeader.writeUInt32LE(0x004e4942,4)
  return {glb:Buffer.concat([header,json,binHeader,...chunks]),triangles}
}

function footprintFor(board, holes) {
  const [length,,width] = board.sizeMm
  function rect(x1,z1,x2,z2,stroke) {
    const [a,b,c,d] = [x1,z1,x2,z2].map(decimal)
    return '  (fp_rect (start '+a+' '+b+') (end '+c+' '+d+') (stroke (width '+stroke+') (type solid)) (fill none) (layer "Dwgs.User"))'
  }
  const half = board.openingMm / 2
  return [
    '(footprint "Adafruit_'+board.pid+'_R2C"',
    '  (version 20240108)',
    '  (generator "pcbnew")',
    '  (layer "F.Cu")',
    '  (descr "Mechanical reference only. Square openings on Dwgs.User. No copper or drill.")',
    '  (attr exclude_from_pos_files exclude_from_bom)',
    rect(-length/2,-width/2,length/2,width/2,.15),
    ...holes.map(({point:[x,,z]})=>rect(x-half,z-half,x+half,z+half,.08)),
    ')','',
  ].join('\n')
}

const vite = await createServer({logLevel:'silent',server:{middlewareMode:true}})
try {
  const {r2cBreadboards,R2C_SHA256} = await vite.ssrLoadModule('/src/data/catalogR2cBoards.ts')
  const {allBreadboardHoles,formatHole,holeToMm} = await vite.ssrLoadModule('/src/lib/breadboardGrid.ts')
  await checkSource('docs/research/2026-11-26-catalog-fidelity-r2c-proposal.md',R2C_SHA256)
  for (const board of r2cBreadboards) {
    await checkSource(evidence+'/'+board.sourceFile,board.drawingSha256)
    await checkSource(evidence+'/'+board.photoFile,board.photoSha256)
  }
  await mkdir(directory,{recursive:true})
  const manifest = []
  for (const board of r2cBreadboards) {
    const holes = allBreadboardHoles(board.spec).map(hole=>({
      id:formatHole(hole,board.spec),point:holeToMm(hole,board.grid),
    }))
    if (holes.length !== board.pointCount || holes.some(hole=>!hole.id || !hole.point)) throw new Error('Invalid hole map for '+board.spec)
    const [length,top,width] = board.sizeMm
    const {glb,triangles} = modelFor(board,holes)
    const asset = '/models/components/catalog-r2c/adafruit-'+board.pid+'.glb'
    const fp = footprintFor(board,holes)
    await writeFile('public'+asset,glb)
    await writeFile(directory+'/'+board.footprintFile,fp)
    manifest.push({
      id:board.catalogId,file:asset,bytes:glb.length,sha256:sha256(glb),sizeMm:board.sizeMm,
      boundsMm:{min:[-length/2,0,-width/2],max:[length/2,top,width/2]},
      triangles,kind:'parametric-mesh',mount:'bench',
      sourceFile:board.sourceFile,sourceSha256:board.drawingSha256,footprint:board.footprintFile,footprintSha256:sha256(fp),
    })
    console.log(board.pid,holes.length+' openings',triangles+' triangles',sha256(glb))
  }
  await writeFile('src/data/catalog-r2c-assets.json',JSON.stringify(manifest,null,2)+'\n')
  await writeFile(directory+'/NOTICE.txt','Original geometry by Mach Mo from the approved R2C profile. Manufacturer drawings and photographs are research references, not redistributed in these assets. The KiCad file is a mechanical reference on Dwgs.User only.\nConfiguration SHA-256 '+R2C_SHA256+'\n')
} finally {
  await vite.close()
}
