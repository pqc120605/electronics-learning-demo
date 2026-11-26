import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import occtFactory from 'occt-import-js'
import { primitivesFromStepMesh, writeGlb } from './glb-writer.mjs'

const approval = '674fd405fcb4ca7641fe2f20e29023d2727f03e5edcc1cfbe64dfeae6803faa3'
const proposal = await readFile('docs/research/2026-11-26-catalog-fidelity-r4-proposal.md')
const sha = value => createHash('sha256').update(value).digest('hex')
if (sha(proposal) !== approval) throw new Error('R4 proposal digest mismatch')
const library = process.argv[2]
if (!library) throw new Error('Pass the KiCad 10.0.7 share/kicad directory')
const rows = proposal.toString().split(/\r?\n/).slice(
  proposal.toString().split(/\r?\n/).findIndex(line => line.startsWith('| ID | Thư viện')) + 2)
  .filter(line => /^\| `[a-z0-9]+` \| .*?(?:[A-F0-9]{64}|TI DNP0006A)/.test(line))
if (rows.length !== 15) throw new Error('Wrong R4 scope')
const output = 'public/models/components/catalog-r4'
const assets = {}
const occt = await occtFactory()

function pad(n, x, z, w, h, layers = '"F.Cu" "F.Paste" "F.Mask"') {
  return `\n  (pad "${n}" smd rect (at ${x} ${z}) (size ${w} ${h}) (layers ${layers}))\n`
}

function derivedFootprint(id, source) {
  if (id === 'opt3001') {
    let text = '(footprint "OPT3001-DNP0006A" (version 20241229) (generator "machmo") (layer "F.Cu")\n' +
      '(attr smd)\n(fp_rect (start -1 -1) (end 1 1) (stroke (width 0.1) (type default)) (fill none) (layer "F.Fab"))\n' +
      '(fp_line (start -1 -1.2) (end -0.65 -1.2) (stroke (width 0.12) (type default)) (layer "F.SilkS"))\n'
    for (let n = 1; n <= 6; n++) text += pad(n, n <= 3 ? -0.95 : 0.95, (n <= 3 ? n - 2 : 5 - n) * 0.65, 0.5, 0.25)
    return text + pad(7,0,0,0.65,1.35,'"F.Cu" "F.Mask"') + pad('',0,0,0.65,0.8,'"F.Paste"') + ')\n'
  }
  if (id === 'max6951') {
    // Nominal X/Y from the E16E-10 row of Maxim 21-0112.
    return source.replace('(footprint "QSOP-16_3.9x4.9mm_P0.635mm"', '(footprint "MAX6951-E16E-10"')
      .trimEnd().replace(/\)$/, pad(17,0,0,2.29,3.30,'"F.Cu" "F.Mask"') + pad('',0,0,1.8,2.65,'"F.Paste"') + ')\n')
  }
  if (id === 'tlc5928') {
    // TI PWP0024B example land and 0.125 mm stencil.
    return source.replace(/^\s*\(pad "" smd [\s\S]*?^\t\)/gm,'')
      .replace('(footprint "HTSSOP-24-1EP_4.4x7.8mm_P0.65mm_EP3.4x7.8mm_Mask2.4x4.68mm"', '(footprint "TLC5928-PWP0024B"')
      .replace(/(\(at )(-?)2\.8625/g,(_, prefix, sign) => prefix+sign+'2.9')
      .replaceAll('(size 1.575 0.4)', '(size 1.5 0.45)')
      .trimEnd().replace(/\)$/, pad('',0,0,2.4,5.16,'"F.Mask"') + pad('',0,0,2.4,5.16,'"F.Paste"') + ')\n')
  }
  return source
}

function solid(name, x, z, width, depth, low, high, color) {
  const positions = [], normals = [], indices = []
  for (const [axis, sign] of [[0,1],[0,-1],[1,1],[1,-1],[2,1],[2,-1]]) {
    const dims = [width,(high-low),depth]
    const mid = [x,(high+low)/2,z]
    const b = (axis+1)%3, c = (axis+2)%3
    const index = positions.length/3
    for (const [u,v] of [[-1,-1],[1,-1],[1,1],[-1,1]]) {
      const p = [...mid], n = [0,0,0]
      p[axis] += sign*dims[axis]/2
      p[b] += sign*u*dims[b]/2
      p[c] += v*dims[c]/2
      n[axis] = sign
      positions.push(...p.map(value => value/1000))
      normals.push(...n)
    }
    indices.push(index,index+1,index+2,index,index+2,index+3)
  }
  return { name, primitives:[{ positions:Float32Array.from(positions), normals:Float32Array.from(normals), indices:Uint16Array.from(indices), color }] }
}

function disc(name, x, z, y, diameter, color) {
  const positions = [x/1000,y/1000,z/1000], normals = [0,1,0], indices = []
  for (let j=0; j<32; j++) {
    const θ = j*Math.PI/16
    positions.push((x+diameter/2*Math.cos(θ))/1000,y/1000,(z+diameter/2*Math.sin(θ))/1000)
    normals.push(0,1,0)
    indices.push(0,(j+1)%32+1,j+1)
  }
  return { name, primitives:[{ positions:Float32Array.from(positions), normals:Float32Array.from(normals), indices:Uint16Array.from(indices), color }] }
}

const gold = [0.66,0.49,0.18]
const steel = [0.58,0.59,0.56]
const mold = [0.065,0.073,0.078]

function optical(id, pads) {
  const vl = id === 'vl53l0x'
  const nodes = [solid('Mold',0,0,vl?4.4:2,vl?2.4:2,0.04,vl?1:0.6,mold)]
  for (const p of pads) {
    let {x,z,width,height} = p
    if (vl) { width = Math.min(width,0.4); height = Math.min(height,0.4) }
    else if (p.pad !== 7) { x = Math.sign(x)*0.86; width = 0.30 }
    nodes.push(solid('Contact ' + p.pad,x,z,width,height,0,0.05,gold))
  }
  nodes.push(disc('Pin 1',vl?-1.92:-0.78,vl?-0.89:-0.78,vl?1.002:0.602,0.17,[0.39,0.4,0.42]))
  if (vl) nodes.push(disc('ST optical Ø0.20',1.535,0,1.002,0.2,[0.19,0.22,0.30]),
    disc('ST optical Ø0.40',-1.465,0,1.002,0.4,[0.13,0.17,0.24]))
  else nodes.push(solid('Clear optical mold',0,0,1.8,1.8,0.58,0.63,[0.18,0.21,0.2]),
    disc('Optical sensing area',0,0,0.631,0.48,[0.23,0.34,0.30]))
  return nodes
}

function compact(primitive) {
  const {positions,normals,indices}=primitive
  const lookup=new Map(),p=[],n=[]
  const packed=Uint16Array.from(indices,index=>{
    if (lookup.has(index)) return lookup.get(index)
    const next=lookup.size
    lookup.set(index,next)
    p.push(...positions.subarray(index*3,index*3+3))
    n.push(...normals.subarray(index*3,index*3+3))
    return next
  })
  return {...primitive,positions:Float32Array.from(p),normals:Float32Array.from(n),indices:packed}
}

function fitPackage(primitive, id) {
  const yScale={tlc5928:1.2/1.6,ds3231:2.65/2.75,bme280:0.93/0.78}[id]
  if (!yScale) return primitive
  const xScale=id==='tlc5928'?6.4/6.72:1
  const positions=primitive.positions.map((value,i)=>value*[xScale,yScale,1][i%3])
  const normals=new Float32Array(primitive.normals.length)
  for (let i=0;i<normals.length;i+=3) {
    const x=primitive.normals[i]/xScale,y=primitive.normals[i+1]/yScale,z=primitive.normals[i+2]
    const length=Math.hypot(x,y,z)||1
    normals.set([x/length,y/length,z/length],i)
  }
  return {...primitive,positions,normals}
}

function bounds(nodes) {
  const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity]
  let triangles=0
  for (const {primitives} of nodes) for (const primitive of primitives) {
    triangles += primitive.indices.length/3
    primitive.positions.forEach((value,i) => {
      const axis=i%3
      min[axis]=Math.min(min[axis],value*1000)
      max[axis]=Math.max(max[axis],value*1000)
    })
  }
  const round = value => Number(value.toFixed(4))
  return {sizeMm:max.map((value,i) => round(value-min[i])),boundsMm:{min:min.map(round),max:max.map(round)},triangles}
}

function verifyContacts(nodes, pads) {
  const metal = nodes.flatMap(node => node.primitives).filter(item => item.color.some(c => c > 0.2))
  return Math.max(...pads.map(pad => {
    const crossing=[]
    const plane = pad.drill ? -0.2 : 0.035
    const points = metal.flatMap(primitive => {
      const {positions, indices} = primitive
      if (!pad.drill) return Array.from(indices, i => [positions[i*3]*1000,positions[i*3+1]*1000,positions[i*3+2]*1000])
        .filter(([x,y,z]) => Math.abs(y)<=plane && Math.abs(x-pad.x)<=pad.width/2+0.005 && Math.abs(z-pad.z)<=pad.height/2+0.005)
      for (let i=0;i<indices.length;i+=3) for (let corner=0;corner<3;corner++) {
        const a=indices[i+corner]*3,b=indices[i+(corner+1)%3]*3
        const ay=positions[a+1]*1000,by=positions[b+1]*1000
        if ((ay<plane)===(by<plane)) continue
        const t=(plane-ay)/(by-ay)
        const x=1000*(positions[a]+(positions[b]-positions[a])*t)
        const z=1000*(positions[a+2]+(positions[b+2]-positions[a+2])*t)
        if (Math.hypot(x-pad.x,z-pad.z)<0.65) crossing.push([x,plane,z])
      }
      return []
    })
    const contact = pad.drill ? crossing : points
    if (!contact.length) throw new Error('No contact at pad '+pad.pad+' ('+pad.x+','+pad.z+')')
    if (!pad.drill) return 0
    const center = [0,2].map(axis => (Math.min(...contact.map(p=>p[axis]))+Math.max(...contact.map(p=>p[axis])))/2)
    return Number(Math.hypot(center[0]-pad.x,center[1]-pad.z).toFixed(4))
  }))
}

await mkdir(output,{recursive:true})
for (const row of rows) {
  const [,id,...columns] = row.split('|').map(cell => cell.trim().replaceAll('`',''))
  const [source,fpHash,stepColumn] = columns
  const [group,stem] = source.split('/')
  const sourceFootprint = stem ? group+'.pretty/'+stem+'.kicad_mod' : null
  const sourceBytes = sourceFootprint ? await readFile(join(library,'footprints',sourceFootprint)) : null
  if (sourceBytes && sha(sourceBytes)!==fpHash.toLowerCase()) throw new Error('Footprint hash mismatch '+id)
  const stepHash = stepColumn.match(/[A-F0-9]{64}/)?.[0]
  const stepName = stepColumn.match(/\bTexas_S-PWSON-N6\.step\b/)?.[0] ?? stem+'.step'
  const sourceStep = stepHash ? group+'.3dshapes/'+stepName : null
  const fp = derivedFootprint(id, sourceBytes?.toString())
  const footprintName = ['opt3001','max6951','tlc5928'].includes(id) ? id+'.kicad_mod' : basename(sourceFootprint)
  const pads = [...fp.matchAll(/\(pad "(\d+)" (?:thru_hole|smd) (\w+)\s*\(at ([-\d.]+) ([-\d.]+)(?: [-\d.]+)?\)\s*\(size ([\d.]+) ([\d.]+)\)(?:\s*\(drill ([\d.]+)\))?/g)]
    .map(([,pad,shape,x,z,width,height,drill]) => ({pad:+pad,shape,x:+x,z:+z,width:+width,height:+height,drill:Number(drill??0)}))
  let nodes
  if (sourceStep) {
    const step=await readFile(join(library,'3dmodels',sourceStep))
    if (sha(step)!==stepHash.toLowerCase()) throw new Error('STEP hash mismatch '+id)
    const result=occt.ReadStepFile(step,{linearUnit:'millimeter',linearDeflectionType:'bounding_box_ratio',linearDeflection:0.001,angularDeflection:0.32})
    if (!result.success || !result.meshes.length) throw new Error('Invalid STEP '+id)
    nodes=result.meshes.filter(mesh => {
      if (id!=='tlc5928') return true
      const p=mesh.attributes.position.array.filter((_,i)=>i%3===2)
      return !(Math.max(...p)<=0.12 && Math.min(...p)>=-0.001)
    }).map((mesh,i)=>({name:'STEP '+i,primitives:primitivesFromStepMesh(mesh,(x,y,z)=>[x,z,-y]).map(compact).map(primitive=>fitPackage(primitive,id))}))
    if (id==='max6951') nodes.push(solid('E16E-10 exposed pad',0,0,2.29,3.30,0,0.11,steel))
    if (id==='tlc5928') nodes.push(solid('PWP0024B exposed pad',0,0,2.4,5.16,0,0.11,steel))
    if (id==='bme280') nodes.push(disc('Bosch vent Ø0.30',0.625,0,0.931,0.3,[0.015,0.018,0.022]))
    if (id==='hdc1080') nodes.push(disc('Humidity sensing opening',0,0,bounds(nodes).boundsMm.max[1]+0.002,0.9,[0.07,0.06,0.05]))
  } else nodes=optical(id,pads)
  const offset=verifyContacts(nodes,pads)
  if (offset>0.15) throw new Error(id+' lead alignment '+offset)
  const key=id+'R4', file=key+'.glb'
  const glb=writeGlb(nodes,{rootName:key,generator:'Mạch Mở catalog R4',extras:{outputUnits:'m',approval}})
  await writeFile(join(output,file),glb)
  await writeFile(join(output,footprintName),fp)
  assets[key]={file:'/'+output.slice('public/'.length)+'/'+file,bytes:glb.length,sha256:sha(glb),
    ...bounds(nodes),kind:sourceStep?'source-cad-mesh':'parametric-mesh',sourceFile:sourceStep??null,
    sourceSha256:stepHash?.toLowerCase()??null,sourceFootprint,sourceFootprintSha256:sourceBytes?fpHash.toLowerCase():null,
    footprint:footprintName,footprintSha256:sha(fp),mount:id.startsWith('tlc59')&&pads.some(p=>p.drill)?'breadboard':'bench',
    pads,maxOffsetMm:pads.some(p=>p.drill)?offset:null}
  console.log(id,pads.length,assets[key].sizeMm)
}
await writeFile(join(output,'NOTICE.txt'),
  'Reference geometry for Mạch Mở R4, see docs/research/2026-11-26-catalog-fidelity-r4-proposal.md.\n'+
  'KiCad 10.0.7 library models and footprint derivatives, KiCad Libraries contributors; CC BY-SA 4.0 with library exception: https://www.kicad.org/libraries/license/\n')
await writeFile('src/data/catalog-r4-packages.json',JSON.stringify(assets,null,2)+'\n')
