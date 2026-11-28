import type { IncomingMessage, ServerResponse } from 'node:http'

export function createA9LocalService(root: string): {
  middleware: (req: IncomingMessage, res: ServerResponse, next: () => void) => Promise<void>
  close: () => void
}
