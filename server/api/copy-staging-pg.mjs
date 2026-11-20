import { cp, mkdir, readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const lockfile = new URL('../community/package-lock.json', import.meta.url)
const [source, destination] = process.argv.slice(2)
if (!source) throw new Error('Provide an existing node_modules directory')

const { packages } = JSON.parse(await readFile(lockfile, 'utf8'))
const verified = []
for (const [path, lock] of Object.entries(packages)) {
  if (!path) continue
  if (!/^node_modules\/(?:@[a-z0-9_.-]+\/)?[a-z0-9_.-]+$/i.test(path)) {
    throw new Error('Expected a flat lockfile for the staging pg driver')
  }
  const name = path.slice('node_modules/'.length)
  const packagePath = join(source, name)
  let installed
  try {
    installed = JSON.parse(await readFile(join(packagePath, 'package.json'), 'utf8'))
  } catch (error) {
    if (lock.optional && error.code === 'ENOENT') continue
    throw new Error('A locked pg dependency is missing: ' + name)
  }
  if (installed.name !== name || installed.version !== lock.version) {
    throw new Error('An installed pg dependency differs from the lockfile: ' + name)
  }
  verified.push({ name, packagePath })
}

if (destination) {
  for (const { name, packagePath } of verified) {
    const target = join(destination, name)
    await mkdir(dirname(target), { recursive: true })
    await cp(packagePath, target, { recursive: true, dereference: true, force: false, errorOnExist: true })
  }
}
console.log('Verified ' + verified.length + ' locked pg packages')
