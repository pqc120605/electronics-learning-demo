import {parseBoardGlb} from '../src/components/board/glbParser'
import {compileShader} from '../src/components/board/sceneMath'

/** Offline asset generator only: straight X/Z orthographic projection, no floor or perspective. */
export async function renderBoardTopView(asset:string){
 const response=await fetch(asset)
 if(!response.ok)throw Error(`Asset HTTP ${response.status}`)
 const parsed=parseBoardGlb(await response.arrayBuffer())
 const xs=parsed.nodeBounds.flatMap(bound=>[bound.min[0],bound.max[0]]),ys=parsed.nodeBounds.flatMap(bound=>[bound.min[1],bound.max[1]]),zs=parsed.nodeBounds.flatMap(bound=>[bound.min[2],bound.max[2]])
 const bounds={minX:Math.min(...xs)-.0015,maxX:Math.max(...xs)+.0015,minZ:Math.min(...zs)-.0015,maxZ:Math.max(...zs)+.0015},minY=Math.min(...ys)-.001,maxY=Math.max(...ys)+.001
 const dx=bounds.maxX-bounds.minX,dz=bounds.maxZ-bounds.minZ
 const canvas=document.createElement('canvas')
 canvas.width=Math.ceil(1600*dx/Math.max(dx,dz));canvas.height=Math.ceil(1600*dz/Math.max(dx,dz))
 const gl=canvas.getContext('webgl2',{alpha:true,antialias:true,preserveDrawingBuffer:true})
 if(!gl)throw Error('WebGL2 unavailable')
 const buffers:WebGLBuffer[]=[]
 const program=gl.createProgram()!
 const vertex=compileShader(gl,gl.VERTEX_SHADER,`#version 300 es
 in vec3 aPosition; in vec3 aNormal; out vec3 normal;
 uniform vec4 bounds; uniform vec2 depth;
 void main(){gl_Position=vec4(2.0*(aPosition.x-bounds.x)/(bounds.y-bounds.x)-1.0,1.0-2.0*(aPosition.z-bounds.z)/(bounds.w-bounds.z),1.0-2.0*(aPosition.y-depth.x)/(depth.y-depth.x),1.0);normal=aNormal;}`)
 const fragment=compileShader(gl,gl.FRAGMENT_SHADER,`#version 300 es
 precision highp float; in vec3 normal; uniform vec3 color; out vec4 frag;
 void main(){float light=0.70+0.30*max(0.0,dot(normalize(normal),normalize(vec3(.2,1.,.3))));frag=vec4(pow(max(color*light,vec3(0.0)),vec3(1.0/2.2)),1.0);}`)
 try{
  gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program)
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program)??'link failed')
  gl.useProgram(program);gl.enable(gl.DEPTH_TEST);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.viewport(0,0,canvas.width,canvas.height)
  gl.uniform4f(gl.getUniformLocation(program,'bounds'),bounds.minX,bounds.maxX,bounds.minZ,bounds.maxZ);gl.uniform2f(gl.getUniformLocation(program,'depth'),minY,maxY)
  for(const batch of parsed.batches){
   for(const [name,data]of [['aPosition',batch.positions],['aNormal',batch.normals]]as const){const buffer=gl.createBuffer()!;buffers.push(buffer);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);const location=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,3,gl.FLOAT,false,0,0)}
   const indices=gl.createBuffer()!;buffers.push(indices);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indices);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,batch.indices,gl.STATIC_DRAW)
   gl.uniform3fv(gl.getUniformLocation(program,'color'),batch.color);gl.drawElements(gl.TRIANGLES,batch.indices.length,gl.UNSIGNED_INT,0)
  }
  return {dataUrl:canvas.toDataURL('image/png'),width:canvas.width,height:canvas.height,boundsMm:Object.fromEntries(Object.entries(bounds).map(([key,value])=>[key,value*1000]))}
 }finally{for(const buffer of buffers)gl.deleteBuffer(buffer);gl.deleteShader(vertex);gl.deleteShader(fragment);gl.deleteProgram(program);gl.getExtension('WEBGL_lose_context')?.loseContext()}
}
