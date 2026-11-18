import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { resolve, join } from 'node:path'
import { createHash } from 'node:crypto'
import { gunzipSync } from 'node:zlib'
import ts from 'typescript'

const [upstreamArg, outputArg, recordArg] = process.argv.slice(2)
if (!upstreamArg || !outputArg) throw new Error('Usage: node assemble-wrapper.mjs <pinned-upstream-checkout> <candidate-output>')
const upstream = resolve(upstreamArg)
const output = resolve(outputArg)
const pins = JSON.parse(await readFile(new URL('./sources.json', import.meta.url), 'utf8'))
let source
if (/\.tar(?:\.gz)?$/.test(upstream)) {
  if (!recordArg) throw new Error('Archive assembly requires input-record.json as the third argument')
  const record=JSON.parse(await readFile(resolve(recordArg),'utf8'))
  let archive=await readFile(upstream)
  if(upstream.endsWith('.gz')) archive=gunzipSync(archive)
  if(record.sources.wrapper.commit!==pins.wrapper.commit || createHash('sha256').update(archive).digest('hex')!==record.artifacts['wrapper.tar'].sha256) throw new Error('Wrapper source archive hash or revision mismatch')
  source=(path)=>execFileSync('tar',['-xOf',upstream,path],{encoding:'utf8',maxBuffer:16*1024*1024})
} else {
  const commit = execFileSync('git', ['-C', upstream, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
  if (commit !== pins.wrapper.commit) throw new Error('Wrapper source commit does not match sources.json')
  source = (path) => execFileSync('git', ['-C', upstream, 'show', `${commit}:${path}`], { encoding:'utf8', maxBuffer: 16 * 1024 * 1024 })
}
let wrapper = source('src/simulationLink.ts')
wrapper = wrapper.replace(/^import .+ from "\.\/(?:circuits\.ts|models\/[^"\n]+)";\r?\n/gm, '')
wrapper = wrapper.replace(/^.*module\.FS\?\.writeFile\("\/(?:modelcard\.[^"\n]+|sm141064\.ngspice)"[^\n]*\n/gm, '')
if (/from "\.\/models\/|writeFile\("\/modelcard\.|writeFile\("\/sm141064/.test(wrapper)) throw new Error('Unused PDK source removal was incomplete')
wrapper = wrapper.replace('from "./spice.js"', 'from "./spice.mjs"').replace('from "./readOutput.ts"', 'from "./readOutput.mjs"')
wrapper = wrapper.replace('module.runThings();', 'module.runThings("-i");')
wrapper = wrapper.replace('noInitialRun: true,', `noInitialRun: true,
      locateFile: (file: string) => file === "spice.wasm" && typeof globalThis.location !== "undefined"
        ? new URL("/vendor/eecircuit-engine/spice.wasm", globalThis.location.href).href : file,
      stdin: (() => {
        let pending: number[] = [];
        return () => {
          if (!pending.length) pending = Array.from(this.getInput() + "\\n", c => c.charCodeAt(0));
          return pending.shift();
        };
      })(),`)
// Retain an explicit marker for packaging audits. Glue locates WASM beside itself.
wrapper = '// MACH_MO_SPICE_EXTERNAL_WASM: /vendor/eecircuit-engine/spice.wasm\n' + wrapper
const intermediate = join(output, 'wrapper-src')
await mkdir(intermediate, { recursive: true })
await writeFile(join(intermediate, 'simulationLink.ts'), wrapper)
await writeFile(join(intermediate, 'readOutput.ts'), source('src/readOutput.ts'))
for (const [name, text] of [['eecircuit-engine', wrapper], ['readOutput', source('src/readOutput.ts')]]) {
  const result = ts.transpileModule(text, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }, reportDiagnostics: true })
  if (result.diagnostics?.some(d => d.category === ts.DiagnosticCategory.Error)) throw new Error('Wrapper transpilation failed')
  await writeFile(join(output, `${name}.mjs`), result.outputText)
}
await writeFile(join(output, 'eecircuit-engine-MIT.txt'), source('LICENSE'))
console.log('Assembled source-pinned wrapper with external matching JS/WASM; no PDK cards bundled.')
