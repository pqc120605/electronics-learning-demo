// Web illustration only: no dimensions, PCB model or fabrication geometry.
// Hand modeled from the founder-selected mascot PNG. Nothing is downloaded.
import {writeFileSync,readFileSync,mkdirSync} from 'node:fs'
import {resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {createHash} from 'node:crypto'
import {writeGlb} from './glb-writer.mjs'

const C={cream:[.965,.90,.78],teal:[.055,.57,.56],ink:[.105,.15,.26],coral:[.92,.29,.19],gold:[.86,.63,.32],white:[1,.98,.91]}
const norm=v=>{const l=Math.hypot(...v)||1;return v.map(x=>x/l)}
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]
const typed=(p,n,i,color)=>({positions:new Float32Array(p),normals:new Float32Array(n),indices:new Uint16Array(i),color,roughness:.48,metallic:.025})

function roundedBox(center,size,radius,color,steps=10){
  const p=[],n=[],ix=[],half=size.map(v=>v/2)
  radius=Math.min(radius,...half)
  const inner=half.map(v=>Math.max(0,v-radius))
  for(let axis=0;axis<3;axis++)for(const sign of [-1,1]){
    const u=(axis+1)%3,v=(axis+2)%3,base=p.length/3
    for(let y=0;y<=steps;y++)for(let x=0;x<=steps;x++){
      const raw=[0,0,0];raw[axis]=half[axis]*sign;raw[u]=half[u]*(2*x/steps-1);raw[v]=half[v]*(2*y/steps-1)
      const core=raw.map((a,j)=>Math.max(-inner[j],Math.min(inner[j],a))),direction=norm(raw.map((a,j)=>a-core[j]))
      p.push(...core.map((a,j)=>center[j]+a+direction[j]*radius));n.push(...direction)
    }
    for(let y=0;y<steps;y++)for(let x=0;x<steps;x++){
      const a=base+y*(steps+1)+x,b=a+1,c=a+steps+1,d=c+1
      ix.push(...(sign>0?[a,b,d,a,d,c]:[a,d,b,a,c,d]))
    }
  }
  return typed(p,n,ix,color)
}
function ellipsoid(center,radii,color,rows=12,columns=24){
  const p=[],n=[],ix=[]
  for(let y=0;y<=rows;y++)for(let x=0;x<=columns;x++){
    const a=y/rows*Math.PI,b=x/columns*Math.PI*2,unit=[Math.sin(a)*Math.cos(b),Math.cos(a),Math.sin(a)*Math.sin(b)]
    p.push(...unit.map((v,j)=>center[j]+v*radii[j]));n.push(...norm(unit.map((v,j)=>v/radii[j])))
  }
  for(let y=0;y<rows;y++)for(let x=0;x<columns;x++){const a=y*(columns+1)+x,b=a+columns+1;ix.push(a,a+1,b+1,a,b+1,b)}
  return typed(p,n,ix,color)
}
function tube(points,radius,color,sides=10){
  const p=[],n=[],ix=[]
  for(let k=0;k<points.length;k++){
    const prev=points[Math.max(0,k-1)],next=points[Math.min(points.length-1,k+1)],t=norm(next.map((v,j)=>v-prev[j])),side=norm(cross(t,Math.abs(t[1])>.9?[1,0,0]:[0,1,0])),up=cross(t,side)
    for(let j=0;j<sides;j++){const a=j/sides*Math.PI*2,d=side.map((v,i)=>v*Math.cos(a)+up[i]*Math.sin(a));p.push(...d.map((v,i)=>points[k][i]+v*radius));n.push(...d)}
  }
  for(let k=0;k<points.length-1;k++)for(let j=0;j<sides;j++){const a=k*sides+j,b=k*sides+(j+1)%sides,c=a+sides,d=b+sides;ix.push(a,b,d,a,d,c)}
  return typed(p,n,ix,color)
}
function arc(cx,cy,z,rx,ry,start,end,steps=24){return Array.from({length:steps+1},(_,i)=>{const a=start+(end-start)*i/steps;return[cx+Math.cos(a)*rx,cy+Math.sin(a)*ry,z]})}

export function buildMascotParts(){
  const parts=[]
  const add=(name,...primitives)=>parts.push({name,primitives})
  add('body_shell',roundedBox([0,.64,0],[.72,.61,.48],.14,C.cream))
  add('body_chest',roundedBox([0,.66,.252],[.60,.49,.075],.10,C.teal))
  add('body_neck',ellipsoid([0,1.0,0],[.14,.105,.13],C.ink))
  add('body_M',tube([[-.19,.52,.299],[-.13,.80,.299],[0,.65,.299],[.13,.80,.299],[.19,.52,.299]],.022,C.cream))
  for(const x of [-.19,.19])add(`body_socket_${x}`,ellipsoid([x,.52,.31],[.043,.043,.014],C.cream),ellipsoid([x,.52,.327],[.019,.019,.006],C.teal))
  for(const x of [-.24,.24])for(const y of [.48,.84])add(`body_bolt_${x}_${y}`,ellipsoid([x,y,.30],[.025,.025,.015],C.gold),ellipsoid([x,y,.316],[.011,.011,.005],C.ink))
  add('head_shell',roundedBox([0,1.36,0],[1.06,.78,.62],.20,C.cream,14))
  add('head_screen',roundedBox([0,1.36,.304],[.91,.60,.12],.17,C.ink,14))
  add('head_top',roundedBox([0,1.735,-.025],[.65,.035,.28],.017,C.teal))
  for(const x of [-.21,.21]){
    add(`head_eye_${x}`,ellipsoid([x,1.39,.375],[.091,.124,.028],C.cream))
    add(`head_eye_pupil_${x}`,ellipsoid([x+.014,1.40,.399],[.045,.077,.016],C.ink))
    add(`head_eye_light_${x}`,ellipsoid([x-.004,1.435,.415],[.016,.025,.007],C.white))
    add(`head_brow_${x}`,tube(arc(x,1.54,.368,.081,.042,.25,Math.PI-.25),.017,C.cream))
    add(`head_cheek_${x}`,tube([[x*1.55,1.25,.365],[x*1.55-.012,1.22,.365]],.012,C.cream))
  }
  add('head_mouth',ellipsoid([0,1.225,.375],[.105,.051,.02],C.cream))
  add('head_ear_left',ellipsoid([-.567,1.36,0],[.106,.165,.15],C.teal),ellipsoid([-.65,1.36,.025],[.025,.095,.093],C.gold),ellipsoid([-.674,1.36,.025],[.012,.063,.061],C.ink))
  add('head_ear_right',roundedBox([.56,1.36,.02],[.12,.31,.22],.055,C.cream))
  for(const y of [1.26,1.36,1.46])add(`head_port_${y}`,ellipsoid([.568,y,.139],[.027,.027,.012],C.gold),ellipsoid([.568,y,.15],[.015,.015,.006],C.ink))
  add('head_antenna',tube([[0,1.72,0],[.025,1.86,0],[.08,1.93,0],[.14,1.95,0]],.037,C.ink),ellipsoid([.15,1.965,0],[.105,.105,.07],C.cream),ellipsoid([.15,1.965,.069],[.066,.066,.015],C.coral))
  add('wave_shoulder',ellipsoid([-.40,.85,0],[.13,.13,.13],C.cream))
  add('wave_arm',tube([[-.43,.83,0],[-.57,.74,.06],[-.70,.81,.12],[-.78,1.02,.17]],.079,C.ink),ellipsoid([-.77,1.03,.17],[.086,.08,.08],C.ink))
  add('wave_palm',ellipsoid([-.79,1.13,.18],[.13,.14,.065],C.cream))
  for(let i=0;i<4;i++){
    const x=-.9+i*.071,y=1.22+(i===1?.065:i===2?.045:0)
    add(`wave_finger_${i}`,ellipsoid([x,y,.18],[.036,.09,.04],C.cream))
  }
  add('wave_thumb',ellipsoid([-.66,1.12,.205],[.045,.08,.05],C.cream))
  add('hold_shoulder',ellipsoid([.40,.85,0],[.13,.13,.13],C.cream))
  add('hold_arm',tube([[.43,.83,0],[.53,.66,.07],[.66,.68,.19],[.76,.85,.28]],.075,C.ink))
  add('hold_palm',ellipsoid([.78,.89,.29],[.15,.09,.10],C.cream))
  add('prop_board_base',roundedBox([.84,1.005,.25],[.42,.08,.29],.024,C.teal))
  add('prop_board_top',roundedBox([.84,1.045,.25],[.415,.035,.285],.014,C.cream))
  // The tiny board is a character prop, not an electrically validated circuit.
  const holes=[]
  for(let x=0;x<8;x++)for(let z=0;z<4;z++)holes.push(ellipsoid([.68+x*.045,1.066,.16+z*.058],[.009,.003,.009],C.ink,4,8))
  add('prop_holes',...holes)
  add('prop_LED_legs',tube([[.74,1.06,.27],[.74,1.14,.27]],.008,C.gold),tube([[.78,1.06,.27],[.78,1.14,.27]],.008,C.gold))
  add('prop_LED',ellipsoid([.76,1.18,.27],[.038,.06,.038],C.coral),ellipsoid([.747,1.20,.297],[.009,.014,.005],C.cream))
  add('prop_jumper',tube(arc(.95,1.08,.23,.055,.08,0,Math.PI),.012,C.teal))
  for(const x of [-.20,.20]){
    add(`leg_${x}`,roundedBox([x,.26,0],[.21,.27,.22],.06,C.cream))
    add(`shoe_sole_${x}`,roundedBox([x,.055,.06],[.34,.10,.40],.048,C.cream))
    add(`shoe_${x}`,ellipsoid([x,.13,.065],[.165,.115,.19],C.teal))
  }
  return parts
}

if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
  const source='assets/brand/concepts/2026-11-15/mach-mo-mascot-concept-v1.png'
  const parts=buildMascotParts(),glb=writeGlb(parts,{rootName:'Mo_MachMo_Guide',generator:'Mạch Mở · founder-selected mascot adaptation',extras:{purpose:'Web character illustration, not hardware/CAD',source}})
  mkdirSync('public/brand',{recursive:true});writeFileSync('public/brand/mo-mascot-v1.glb',glb)
  writeFileSync('public/brand/mo-mascot-v1.source.json',JSON.stringify({version:1,source,source_sha256:createHash('sha256').update(readFileSync(source)).digest('hex'),model_sha256:createHash('sha256').update(glb).digest('hex'),generator:'scripts/generate-mascot-model.mjs',parts:parts.length,purpose:'Original web illustration adapted from approved project concept; prop is not a circuit design.',animation:'Application-owned node transforms; no third-party model or animation.'},null,2)+'\n')
  console.log(JSON.stringify({parts:parts.length,bytes:glb.length,sha256:createHash('sha256').update(glb).digest('hex')}))
}
