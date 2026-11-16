import {parseBoardGlb,type GpuBatch} from '../board/glbParser'
import {compileShader,makeCamera,multiply,perspective,viewMatrix,type Vec3} from '../board/sceneMath'

export type MascotMood='idle'|'greeting'|'point'|'thinking'|'celebrate'|'attention'
type Mesh={batch:GpuBatch;buffers:WebGLBuffer[];count:number}
function transform(angle:number,axis:'y'|'z',pivot:Vec3=[0,0,0],scaleY=1){
  const c=Math.cos(angle),s=Math.sin(angle),m=axis==='y'?[c,0,-s,0,0,scaleY,0,0,s,0,c,0,0,0,0,1]:[c,s,0,0,-s*scaleY,c*scaleY,0,0,0,0,1,0,0,0,0,1]
  for(let i=0;i<3;i++)m[12+i]=pivot[i]-m[i]*pivot[0]-m[4+i]*pivot[1]-m[8+i]*pivot[2]
  return m
}
const vertex=`#version 300 es
in vec3 aPosition; in vec3 aNormal; uniform mat4 uModel; uniform mat4 uVP; out vec3 vNormal; out vec3 vPoint;
void main(){vec4 p=uModel*vec4(aPosition,1.);vPoint=p.xyz;vNormal=normalize(mat3(uModel)*aNormal);gl_Position=uVP*p;}`
const fragment=`#version 300 es
precision highp float; in vec3 vNormal; in vec3 vPoint; uniform vec3 uColor; uniform vec3 uEye;out vec4 outColor;
void main(){vec3 n=normalize(vNormal);vec3 l=normalize(vec3(-.8,1.7,2.5));vec3 eye=normalize(uEye-vPoint);float diffuse=max(dot(n,l),0.);float fill=max(dot(n,normalize(vec3(1.,.3,-.4))),0.);float rim=pow(1.-max(dot(n,eye),0.),3.);float shine=pow(max(dot(n,normalize(l+eye)),0.),38.);vec3 c=uColor*(.56+.40*diffuse+.12*fill)+vec3(.09)*shine+vec3(.05,.055,.06)*rim;outColor=vec4(c,1.);}`

/** Small, on-demand renderer. Closed/hidden/reduced-motion avatars run no animation loop. */
export class MascotScene{
  private gl:WebGL2RenderingContext
  private program:WebGLProgram
  private shaders:WebGLShader[]=[]
  private meshes:Mesh[]=[]
  private angle=.12
  private mood:MascotMood='greeting'
  private moving=false
  private start=0
  private frame=0
  private disposed=false
  private blink=1
  private yawLocation:WebGLUniformLocation|null
  private vpLocation:WebGLUniformLocation|null
  private colorLocation:WebGLUniformLocation|null
  private positionLocation:number
  private normalLocation:number
  private canvas:HTMLCanvasElement
  constructor(canvas:HTMLCanvasElement,buffer:ArrayBuffer){
    this.canvas=canvas
    const gl=canvas.getContext('webgl2',{alpha:true,antialias:true,powerPreference:'low-power'})
    if(!gl)throw Error('WebGL 2 không khả dụng')
    this.gl=gl
    const vs=compileShader(gl,gl.VERTEX_SHADER,vertex),fs=compileShader(gl,gl.FRAGMENT_SHADER,fragment);this.shaders=[vs,fs]
    const program=gl.createProgram();if(!program)throw Error('Không tạo được renderer')
    gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program)
    if(!gl.getProgramParameter(program,gl.LINK_STATUS)){gl.deleteProgram(program);throw Error('Không nối được shader')}
    this.program=program;gl.useProgram(program)
    this.positionLocation=gl.getAttribLocation(program,'aPosition');this.normalLocation=gl.getAttribLocation(program,'aNormal')
    this.yawLocation=gl.getUniformLocation(program,'uModel');this.vpLocation=gl.getUniformLocation(program,'uVP');this.colorLocation=gl.getUniformLocation(program,'uColor')
    gl.uniform3fv(gl.getUniformLocation(program,'uEye'),[.7,1.45,4.5])
    gl.enable(gl.DEPTH_TEST);gl.clearColor(0,0,0,0)
    try{
      for(const batch of parseBoardGlb(buffer).batches){
        const buffers:WebGLBuffer[]=[]
        for(const [data,target] of [[batch.positions,gl.ARRAY_BUFFER],[batch.normals,gl.ARRAY_BUFFER],[batch.indices,gl.ELEMENT_ARRAY_BUFFER]] as const){const b=gl.createBuffer();if(!b)throw Error('Không đủ bộ nhớ đồ họa');buffers.push(b);gl.bindBuffer(target,b);gl.bufferData(target,data,gl.STATIC_DRAW)}
        this.meshes.push({batch,buffers,count:batch.indices.length})
      }
    }catch(error){this.dispose();throw error}
    this.draw(0)
  }
  resize(){this.draw(0)}
  rotate(delta:number){this.angle=Math.max(-Math.PI*.72,Math.min(Math.PI*.72,this.angle+delta));this.draw(0)}
  setState(mood:MascotMood,motion:boolean){this.mood=mood;this.moving=motion;this.start=performance.now();cancelAnimationFrame(this.frame);this.frame=0;if(motion)this.animate();else this.draw(0)}
  setBlink(value:number){this.blink=value;this.draw(0)}
  private animate=()=>{
    if(this.disposed)return
    const seconds=(performance.now()-this.start)/1000
    this.draw(seconds)
    if(this.moving&&seconds<2.4)this.frame=requestAnimationFrame(this.animate)
  }
  private draw(t:number){
    if(this.disposed)return
    const gl=this.gl,w=Math.max(1,this.canvas.clientWidth),h=Math.max(1,this.canvas.clientHeight),dpr=Math.min(window.devicePixelRatio||1,1.5)
    if(this.canvas.width!==Math.round(w*dpr)||this.canvas.height!==Math.round(h*dpr)){this.canvas.width=Math.round(w*dpr);this.canvas.height=Math.round(h*dpr)}
    gl.viewport(0,0,this.canvas.width,this.canvas.height);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(this.program)
    const camera=makeCamera(.155,.094,4.57,[0,1.02,0]),vp=multiply(perspective(Math.PI/6.3,w/h,.05,12),viewMatrix(camera))
    gl.uniformMatrix4fv(this.vpLocation,false,vp)
    const root=transform(this.angle,'y'),wave=(this.mood==='greeting'?Math.sin(t*8)*.14:this.mood==='celebrate'?-.25:this.mood==='point'?.12:0)*(t>0?Math.max(0,1-t/2.4):1)
    for(const {batch,buffers,count} of this.meshes){
      let model=root
      if(batch.nodeName.startsWith('wave_'))model=multiply(root,transform(wave,'z',[-.40,.85,0]))
      if(batch.nodeName.startsWith('head_')){
        const tilt=this.mood==='thinking'?.075:this.mood==='attention'?-.055:this.mood==='celebrate'?Math.sin(t*6)*.04:0
        model=multiply(root,transform(tilt,'z',[0,1.04,0]))
        if(batch.nodeName.startsWith('head_eye'))model=multiply(model,transform(0,'y',[0,1.39,0],this.blink))
      }
      gl.uniformMatrix4fv(this.yawLocation,false,model);gl.uniform3fv(this.colorLocation,batch.color)
      gl.bindBuffer(gl.ARRAY_BUFFER,buffers[0]);gl.enableVertexAttribArray(this.positionLocation);gl.vertexAttribPointer(this.positionLocation,3,gl.FLOAT,false,0,0)
      gl.bindBuffer(gl.ARRAY_BUFFER,buffers[1]);gl.enableVertexAttribArray(this.normalLocation);gl.vertexAttribPointer(this.normalLocation,3,gl.FLOAT,false,0,0)
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,buffers[2]);gl.drawElements(gl.TRIANGLES,count,gl.UNSIGNED_INT,0)
    }
  }
  dispose(){
    if(this.disposed)return;this.disposed=true;cancelAnimationFrame(this.frame)
    for(const m of this.meshes)for(const b of m.buffers)this.gl.deleteBuffer(b)
    this.gl.deleteProgram(this.program);for(const s of this.shaders)this.gl.deleteShader(s);this.meshes=[]
  }
}
