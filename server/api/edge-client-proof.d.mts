export const EDGE_CLIENT_HEADER: string
export function validEdgeKey(key: unknown): key is string
export function makeEdgeClientProof(key: string, address: string, method: string, path: string, now?: number): string | null
export function readEdgeClientProof(key: string, proof: unknown, method: string, path: string, now?: number): string | null
