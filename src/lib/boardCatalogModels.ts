import type { BoardModelManifest } from '../components/board/boardSceneTypes'
import { esp32DevkitModel } from '../data/esp32DevkitModel'
import { boards } from '../data/boards'
import { indexBoardHeaderPins } from './boardHeaderPins'
import { withA2DebugFunctions } from './boardAuxConnectors'

export const boardCatalogModelFamilies = [
  { ids: ['arduino-uno-r3', 'arduino-nano-classic', 'arduino-mega-2560-r3'], load: () => import('../data/arduinoBoardModels').then(module => module.arduinoBoardModels) },
  { ids: ['arduino-uno-r4-minima', 'arduino-uno-r4-wifi', 'arduino-nano-esp32'], load: () => import('../data/approvedArduinoBoardModels').then(module => module.approvedArduinoBoardModels) },
  { ids: ['raspberry-pi-pico', 'raspberry-pi-pico-w', 'raspberry-pi-pico-2', 'raspberry-pi-pico-2-h'], load: () => import('../data/raspberryPiBoardModels').then(module => module.raspberryPiBoardModels) },
  { ids: ['adafruit-qtpy-esp32-c3-5405', 'adafruit-feather-esp32-s3-5323', 'adafruit-feather-esp32-s3-tft-5483'], load: () => import('../data/adafruitBoardModels').then(module => module.adafruitBoardModels) },
  { ids: ['seeed-xiao-esp32c3', 'seeed-xiao-esp32-s3'], load: () => import('../data/seeedBoardModels').then(module => module.seeedBoardModels) },
  { ids: ['esp32-s3-devkitc-1'], load: () => import('../data/espressifBoardModels').then(module => module.espressifBoardModels) },
  { ids: ['stm32-blue-pill-f103'], load: () => import('../data/stm32BoardModels').then(module => module.stm32BoardModels) },
  {
    ids: ['esp32-c3-devkitm-1', 'esp32-devkitm-1', 'esp32-c6-devkitc-1', 'esp32-s2-devkitc-1', 'esp32-h2-devkitm-1',
      'stm32-nucleo', 'stm32-nucleo-f411re', 'stm32-nucleo-l476rg', 'stm32-nucleo-f446re', 'arduino-nano-every'],
    load: () => import('../data/remainingCatalogBoardModels').then(module => module.remainingCatalogBoardModels),
  },
]

export const boardCatalogModelIds = new Set(['esp32-devkit', ...boardCatalogModelFamilies.flatMap(({ ids }) => ids)])

export async function loadBoardCatalogModel(id: string): Promise<BoardModelManifest | undefined> {
  const family = boardCatalogModelFamilies.find(({ ids }) => ids.includes(id))
  const model = id === 'esp32-devkit' ? esp32DevkitModel : (await family?.load())?.find(model => model.id === id)
  if (!model) return undefined
  const revision = boards.find(board => board.id === id)?.revision ?? model.audit?.revision ?? 'Phiên bản chưa xác định'
  return { ...model, pins: withA2DebugFunctions(id, indexBoardHeaderPins(model, revision)) }
}

export async function getBoardHeaderPins(boardId: string): Promise<BoardModelManifest['pins']> {
  return (await loadBoardCatalogModel(boardId))?.pins ?? []
}
