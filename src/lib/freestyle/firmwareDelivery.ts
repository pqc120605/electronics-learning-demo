const hosts = ['localhost', '127.0.0.1', '[::1]']
const productionHost = 'mach-mo.vercel.app'
let id: string | undefined
export const firmwareTab = () => id ??= crypto.randomUUID()

export const isHostedFirmware = () => globalThis.location?.hostname === productionHost
export const canOpenFirmwareFixture = () => {
  const hostname = globalThis.location?.hostname
  return Boolean(hostname && (hosts.includes(hostname) || isHostedFirmware()))
}

export function firmwareAssetBase(stage: string, localPath: string, target = '') {
  return isHostedFirmware()
    ? '/api/tools/firmware-fixtures/r1/' + stage.toLowerCase() + '/' + target
    : localPath
}

export function firmwareSessionBase(stage: string, localPath: string) {
  return isHostedFirmware() ? '/api/tools/firmware-sessions/r1/' + stage.toLowerCase() + '/' : localPath
}
