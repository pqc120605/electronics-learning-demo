/** Stable educational circuit identity shared by the schematic and assembly views. */
export type CircuitEndpoint = { partId: string; pinId: string }
/** Where a part sits in the 3D assembly. Absent in older projects, which are laid out automatically. */
export type AssemblyMount = { kind: 'breadboard'; column: number; row: number; rotation: number; partRotation?: number } | { kind: 'bench'; x: number; z: number }
export type CircuitPart = { id: string; type: string; x: number; y: number; rotation?: number; value?: string; assembly?: AssemblyMount }
export type CircuitConnection = { id: string; from: CircuitEndpoint; to: CircuitEndpoint }
export type CircuitTopology = { parts: CircuitPart[]; connections: CircuitConnection[] }
