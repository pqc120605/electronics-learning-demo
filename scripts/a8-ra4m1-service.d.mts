import type { IncomingMessage, ServerResponse } from 'node:http'

export function createA8LocalService(root: string): {
  middleware: (req: IncomingMessage, res: ServerResponse, next: () => void) => Promise<void>
  close: () => void
}
