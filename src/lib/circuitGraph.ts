export type CircuitEndpoint = { partId: string; pinId: string }
export type CircuitConnection = { id: string; from: CircuitEndpoint; to: CircuitEndpoint }
export type CircuitPart = { id: string; type: string; x?: number; y?: number }
export type CircuitGraph = { parts: CircuitPart[]; wires: CircuitConnection[] }
