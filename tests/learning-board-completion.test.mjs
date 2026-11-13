import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

let server
let m

const walk = (dir) => readdirSync(dir).flatMap((name) => { const path = `${dir}/${name}`; return statSync(path).isDirectory() ? walk(path) : [path] })

before(async () => {
  server = await createServer({ configFile: 'vite.config.ts', logLevel: 'silent', server: { middlewareMode: true } })
  const paths = ['/src/data/learningPath.ts', '/src/data/curriculumSchema.ts', '/src/data/boardCapabilityRegistry.ts', '/src/data/componentReferences.ts', '/src/data/components.ts', '/src/data/componentRegistry.ts', '/src/lib/componentCatalog.ts', '/src/lib/componentIllustrationKind.ts', '/src/lib/lessonPreflight.ts']
  m = Object.assign({}, ...await Promise.all(paths.map((path) => server.ssrLoadModule(path))))
})

after(async () => { await server?.close() })

test('capability labels claim what the evidence shows, not a physical check', () => {
  const source = walk('src').filter((path) => /\.tsx?$/.test(path)).map((path) => readFileSync(path, 'utf8')).join('\n')
  assert.doesNotMatch(source, /physicalVerified|3d-verified/)
  const uno = m.getBoardCapability('arduino-uno-r3')
  assert.equal(uno.modelStatus, 'cad-reference')
  assert.equal(uno.pinMap.ledOutput.sourceBacked, true)
  assert.equal(m.getBoardCapability('esp32-c6-devkitc-1').pinMap.ledOutput.sourceBacked, false)
})

test('lesson entry routes keep the chosen board, except the ESP32 default and the fixed LED page', () => {
  assert.equal(m.getLessonEntryRoute({ id: 'button-led' }, 'arduino-uno-r3'), '/learn/button-led?board=arduino-uno-r3')
  assert.equal(m.getLessonEntryRoute({ id: 'button-led' }, 'esp32-devkit'), '/learn/button-led')
  assert.equal(m.getLessonEntryRoute({ id: 'blink' }, 'arduino-uno-r3'), '/learn/esp32-led')
  assert.equal(m.getLessonEntryRoute({ id: 'button-led' }), '/learn/button-led')
})

test('lesson prerequisites are stored as typed curriculum links and stay aligned with the path helpers', () => {
  const order = m.learningPathOrder
  for (const lesson of m.curriculumLessons) {
    const ids = lesson.prerequisiteLessonIds ?? []
    assert.deepEqual(m.getLessonPrerequisiteIds(lesson.id), ids, `${lesson.id} helper must read curriculum data`)
    for (const required of ids) {
      assert.ok(order.includes(required), `${lesson.id} references unknown prerequisite ${required}`)
      assert.ok(order.indexOf(required) < order.indexOf(lesson.id), `${lesson.id} references a later prerequisite ${required}`)
    }
  }
  assert.deepEqual(m.getLessonPrerequisiteIds('analog-potentiometer'), ['button-led'])
  assert.deepEqual(m.getLessonPrerequisiteIds('dc-motor-driver'), ['blink', 'source-led'])
})

test('the LED page offers practice on a reference board only when the lab supports it', () => {
  assert.equal(m.getBoardPracticeRoute('arduino-uno-r3'), '/build?lesson=blink&guided=1&board=arduino-uno-r3')
  assert.equal(m.getBoardPracticeRoute('adafruit-feather-esp32-s3-tft-5483'), undefined)
})

test('catalog records list the lessons that really use them', () => {
  const titles = (id) => m.getLessonsUsingComponent(id).map((lesson) => lesson.id)
  assert.deepEqual(titles('hc-sr04'), ['ultrasonic-distance'])
  assert.ok(titles('resistor').includes('analog-ldr'))
  assert.ok(titles('ir-obstacle').includes('ir-alert'))
  assert.deepEqual(titles('neopixel'), [])
  assert.deepEqual(titles('electrolytic'), [])
  for (const lesson of m.getLessonsUsingComponent('led')) assert.ok(lesson.route.startsWith('/learn/'))
})

test('sources that name a real part reach chip level, with a note on what they do not cover', () => {
  for (const id of ['dht22', 'oled', 'neopixel', 'lcd1602', 'diode', 'hc-sr04']) {
    assert.equal(m.getComponentSourceLevel(id), 'chip', id)
    assert.ok(m.getComponentReferences(id).every((reference) => reference.note.length > 30), id)
  }
  assert.equal(m.getComponentSourceLevel('mosfet'), 'general')
  assert.equal(m.getComponentSourceLevel('ir-receiver'), 'general')
})

test('illustrations are chosen by what the part is, not by a substring of its id', () => {
  const kind = m.getComponentIllustrationKind
  assert.equal(kind('oled'), 'display')
  assert.equal(kind('lcd1602'), 'display')
  assert.equal(kind('photoresistor-module'), 'module')
  assert.equal(kind('motor-driver'), 'module')
  assert.equal(kind('led'), 'led')
  assert.equal(kind('neopixel'), 'led')
  assert.equal(kind('jumper'), 'wire')
  assert.equal(kind('usb-cable'), 'wire')
  assert.equal(kind('breadboard'), 'breadboard')
  assert.equal(kind('power-bank'), 'supply')
  assert.equal(kind('dc-supply'), 'supply')
  assert.equal(kind('arduino-uno'), 'board')
  for (const part of m.components) assert.ok(kind(part.id), part.id)
})

test('every circuit error tells the learner how to fix it', () => {
  const source = readFileSync('src/lib/circuitValidation.ts', 'utf8')
  const errors = source.split('result.push(').filter((chunk) => /^\{severity:'error'/.test(chunk))
  assert.ok(errors.length >= 20)
  for (const chunk of errors) assert.match(chunk.slice(0, chunk.indexOf('})') + 2), /suggestedFix:/, chunk.slice(0, 80))
})

test('mobile target rule sits in one place and wins over page stylesheets', () => {
  const css = readFileSync('src/styles/app.css', 'utf8')
  assert.match(css, /:is\(#main-content, ?\.builder-page\)|#main-content :is\(/)
})

test('labelled containers in the board and lesson views have a role that allows the label', () => {
  for (const path of ['src/components/board/PinFlowExplorer.tsx', 'src/components/board/BoardViewer.tsx', 'src/pages/LessonPage.tsx', 'src/pages/BoardCatalogPage.tsx', 'src/pages/ComponentsPage.tsx']) {
    for (const [tag] of readFileSync(path, 'utf8').matchAll(/<div\b[^>]*aria-label=[^>]*>/g)) assert.match(tag, /role=/, `${path}: ${tag.slice(0, 80)}`)
  }
})
