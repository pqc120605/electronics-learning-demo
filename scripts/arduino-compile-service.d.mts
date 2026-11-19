import type { IncomingMessage, ServerResponse } from 'node:http'

export declare const API_PREFIX: string
export declare const ARDUINO_FQBN: Readonly<Record<string, string>>
export declare function createLocalToolsMiddleware(options?: {
  cliPath?: string
  guideAi?: { providerEnv?: Record<string, string>; log?: (event: object) => void }
}): (req: IncomingMessage, res: ServerResponse, next?: () => void) => Promise<void>
