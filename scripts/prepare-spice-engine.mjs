import { copyFile, mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const packageEntryPath = fileURLToPath(import.meta.resolve('eecircuit-engine'))
const packageRoot = dirname(dirname(packageEntryPath))
const packageJsonPath = join(packageRoot, 'package.json')
const modulePath = join(packageRoot, 'dist', 'eecircuit-engine.mjs')
const modulePublicPath = join(root, 'public', 'vendor', 'eecircuit-engine', 'eecircuit-engine.mjs')
const wasmPackagePath = join(packageRoot, 'dist', 'spice.wasm')
const wasmPublicPath = join(root, 'public', 'vendor', 'eecircuit-engine', 'spice.wasm')
const packageInfo = JSON.parse(await readFile(packageJsonPath, 'utf8'))

if (packageInfo.version !== '1.8.0') {
  throw new Error(`Expected eecircuit-engine 1.8.0, found ${packageInfo.version}; review the preparation patch before upgrading.`)
}

let source = await readFile(modulePath, 'utf8')
const marker = 'MACH_MO_SPICE_EXTERNAL_WASM'
const inlineWasmPattern = /data:application\/wasm;base64,([A-Za-z0-9+/=]{1000,})/g
const inlineWasmMatches = [...source.matchAll(inlineWasmPattern)]

if (inlineWasmMatches.length > 0) {
  const matches = inlineWasmMatches
  if (matches.length !== 2 || matches[0][1] !== matches[1][1]) {
    throw new Error(`Unexpected eecircuit-engine WASM layout (${matches.length} inline copies); review before patching.`)
  }

  const wasmBytes = Buffer.from(matches[0][1], 'base64')
  if (wasmBytes.length < 1_000_000) throw new Error('Extracted SPICE WASM is unexpectedly small; refusing to patch.')
  await mkdir(dirname(wasmPackagePath), { recursive: true })
  await writeFile(wasmPackagePath, wasmBytes)
  await mkdir(dirname(wasmPublicPath), { recursive: true })
  await copyFile(wasmPackagePath, wasmPublicPath)

  for (const match of [...matches].reverse()) {
    const uriStart = match.index
    const expressionStart = source.lastIndexOf('new URL("', uriStart)
    if (expressionStart < 0) throw new Error('Could not locate the WASM URL expression.')

    if (uriStart < 100_000) {
      const expressionEnd = source.indexOf('.href', uriStart) + '.href'.length
      const original = source.slice(expressionStart, expressionEnd)
      if (!original.endsWith(').href')) throw new Error('Browser WASM URL expression did not match the expected form.')
      source = source.slice(0, expressionStart) + 'new URL(l("spice.wasm"), "" + import.meta.url).href' + source.slice(expressionEnd)
    } else {
      const expressionEnd = source.indexOf(')', uriStart) + 1
      if (expressionEnd <= uriStart) throw new Error('Could not locate the Node WASM URL expression end.')
      source = source.slice(0, expressionStart) + 'new URL([".", "spice.wasm"].join("/"), import.meta.url)' + source.slice(expressionEnd)
    }
  }

  const configNeedle = 'let n = {\n\t\t\tnoInitialRun: !0,'
  const configIndex = source.indexOf(configNeedle)
  if (configIndex < 0 || source.indexOf(configNeedle, configIndex + 1) >= 0) {
    throw new Error('Could not uniquely locate the eecircuit-engine module configuration.')
  }
  const configReplacement = `let n = {\n\t\t\t${marker}: !0,\n\t\t\tlocateFile: (file) => file === "spice.wasm" ? new URL("/vendor/eecircuit-engine/spice.wasm", globalThis.location.href).href : file,\n\t\t\tnoInitialRun: !0,`
  source = source.replace(configNeedle, configReplacement)

  source = patchNodeWasmLoader(source)
  source = removeBundledPdkModelWrites(source)
  await writeFile(modulePath, source)
  await mkdir(dirname(modulePublicPath), { recursive: true })
  await writeFile(modulePublicPath, source)
} else {
  if (!source.includes(marker)) {
    throw new Error('eecircuit-engine appears partially prepared; restore the package before retrying.')
  }
  source = patchNodeWasmLoader(source)
  source = removeBundledPdkModelWrites(source)
  await writeFile(modulePath, source)
  await mkdir(dirname(modulePublicPath), { recursive: true })
  await writeFile(modulePublicPath, source)
  await mkdir(dirname(wasmPublicPath), { recursive: true })
  await copyFile(wasmPackagePath, wasmPublicPath)
}

const wasmInfo = await stat(wasmPublicPath)
const moduleInfo = await stat(modulePublicPath)
if (wasmInfo.size < 1_000_000) throw new Error('Prepared SPICE WASM asset is missing or unexpectedly small.')
if (moduleInfo.size > 500_000) throw new Error('Prepared browser engine module is unexpectedly large.')
console.log(`Prepared eecircuit-engine ${packageInfo.version}: browser module ${moduleInfo.size.toLocaleString()} bytes, external WASM ${wasmInfo.size.toLocaleString()} bytes; unused bundled PDK model cards removed.`)

function patchNodeWasmLoader(text) {
  text = text.replace('new URL("./spice.wasm", import.meta.url)', 'new URL([".", "spice.wasm"].join("/"), import.meta.url)')
  const original = 'n.locateFile = (e) => e === "spice.wasm" ? i : e, n.wasmBinary = await t.readFile(i);'
  const replacement = 'n.wasmBinary = await t.readFile(i), n.locateFile = (e) => e === "spice.wasm" ? "data:application/wasm;base64," + Buffer.from(n.wasmBinary).toString("base64") : e;'
  if (text.includes(original)) return text.replace(original, replacement)
  if (text.includes(replacement)) return text
  throw new Error('Could not locate the Node SPICE WASM loader to prepare it safely.')
}

function removeBundledPdkModelWrites(text) {
  const starts = [...text.matchAll(/r\.FS\?\.writeFile\("(?:\/modelcard\.[^"]+|\/[^"/]+\.ngspice)",/g)].map(match => match.index)
  if (starts.length < 1 && /r\.FS\?\.writeFile\("\/sm141064\.ngspice",/.test(text)) {
    throw new Error('The bundled PDK model write was found but not captured by the safe parser.')
  }

  for (const start of starts.reverse()) {
    const openParen = text.indexOf('(', start)
    let depth = 0
    let quote = ''
    let escaped = false
    let end = -1
    for (let index = openParen; index < text.length; index += 1) {
      const char = text[index]
      if (quote) {
        if (escaped) escaped = false
        else if (char === '\\') escaped = true
        else if (char === quote) quote = ''
        continue
      }
      if (char === '"' || char === "'" || char === '`') {
        quote = char
        continue
      }
      if (char === '(') depth += 1
      if (char === ')' && --depth === 0) {
        end = index + 1
        break
      }
    }
    if (end < 0) throw new Error('Could not safely parse a bundled PDK model write call.')
    const afterCall = text.slice(end).match(/^\s*,\s*/)
    if (afterCall) end += afterCall[0].length
    text = text.slice(0, start) + text.slice(end)
  }
  return text
}
