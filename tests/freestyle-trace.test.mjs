import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'
let server, trace
before(async()=>{server=await createServer({configFile:'vite.config.ts',logLevel:'silent',server:{middlewareMode:true}});trace=await server.ssrLoadModule('/src/lib/freestyle/freestyleTrace.ts')})
after(async()=>server?.close())
test('trace keeps runtime timestamps and unknown gaps, never manufactures PWM pulses',()=>{
 let points=[]
 points=trace.appendTrace(points, {pins:{13:{mode:'output',level:false}},simulatedMilliseconds:0})
 points=trace.appendTrace(points, {pins:{13:{mode:'output',level:true,pwm:0.5}},simulatedMilliseconds:500})
 points=trace.appendTrace(points, {pins:{},simulatedMilliseconds:700})
 assert.deepEqual(points.map(p=>p.atMs),[0,500,700])
 assert.equal(points[1].pins[13].pwm,0.5)
 assert.equal(trace.tracePath(points,13,0,700).split('M').length-1,1)
 assert.equal(trace.appendTrace(points,{pins:{},simulatedMilliseconds:600}),points)
})
test('trace history is bounded and equal-timestamp updates replace the last snapshot',()=>{
 let points=[]
 for(let i=0;i<600;i++)points=trace.appendTrace(points,{pins:{1:{mode:'output',level:!!(i%2)}},simulatedMilliseconds:i})
 assert.equal(points.length,trace.MAX_TRACE_SAMPLES)
 const last=points.at(-1).atMs
 points=trace.appendTrace(points,{pins:{},simulatedMilliseconds:last})
 assert.equal(points.length,trace.MAX_TRACE_SAMPLES)
 assert.deepEqual(points.at(-1).pins,{})
})
test('wired GPIOs and a user-selected channel take priority over unused lower-numbered pins',()=>{
 const samples=[{atMs:0,pins:Object.fromEntries(Array.from({length:30},(_,i)=>[i,{mode:'input',level:false}]))}]
 assert.deepEqual(trace.traceChannels(samples,[13,23],29),[29,13,23,0,1,2,3,4])
})
