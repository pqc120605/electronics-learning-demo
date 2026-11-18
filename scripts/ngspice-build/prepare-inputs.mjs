import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { resolve, join } from 'node:path'
const [ngspiceArg, wrapperArg, outputArg] = process.argv.slice(2)
if (!outputArg) throw new Error('Usage: prepare-inputs.mjs <ngspice-checkout> <wrapper-checkout> <output-directory>')
const pins = JSON.parse(await readFile(new URL('./sources.json',import.meta.url),'utf8'))
const output = resolve(outputArg)
await mkdir(output,{recursive:true})
const artifacts = {}
for (const [name, directory] of [['ngspice',ngspiceArg],['wrapper',wrapperArg]]) {
  const commit = execFileSync('git',['-C',resolve(directory),'rev-parse','HEAD'],{encoding:'utf8'}).trim()
  if (commit !== pins[name].commit) throw new Error(`${name} source revision mismatch`)
  const path = join(output,`${name}.tar`)
  execFileSync('git',['-c','core.autocrlf=false','-C',resolve(directory),'archive','--format=tar',`--output=${path}`,commit])
  const bytes = await readFile(path)
  artifacts[`${name}.tar`] = {bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')}
}
const recipes = {}
for (const name of ['Containerfile','build.sh','sources.json','assemble-wrapper.mjs','prepare-inputs.mjs']) {
  recipes[name] = createHash('sha256').update(await readFile(new URL(`./${name}`,import.meta.url))).digest('hex')
}
await writeFile(join(output,'input-record.json'),JSON.stringify({sources:pins,artifacts,recipes},null,2)+'\n')
console.log('Exported LF source archives from verified Git objects and recorded input/recipe hashes.')
