import { componentRegistry } from '../data/componentRegistry'
import { freestyleBoards } from './freestyle/freestyleCircuit'

const boardAliases: Readonly<Record<string, string>> = {
  'arduino-nano-classic': 'arduino-nano',
  'arduino-mega-2560-r3': 'arduino-mega-2560',
  'stm32-nucleo': 'stm32-nucleo-f401re',
}

/** Catalog identity is distinct from builder identity (notably ceramic vs polarized capacitor). */
export function getFreestylePartId(catalogId: string): string | undefined {
  return componentRegistry.find((part) => part.id !== 'board' && part.id !== 'breadboard' && part.catalogId === catalogId)?.id
}

/** Accept only a known builder board after resolving the documented catalog aliases. */
export function getFreestyleBoardId(catalogId: string): string | undefined {
  const id = boardAliases[catalogId] ?? catalogId
  return freestyleBoards.find((board) => board.id === id)?.id
}
