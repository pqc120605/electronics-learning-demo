import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin, type PreviewServer, type ViteDevServer } from 'vite'
import { createLocalToolsMiddleware } from './scripts/arduino-compile-service.mjs'
import { createA2LocalAssets } from './scripts/a2-local-assets.mjs'
import { createA7LocalService } from './scripts/a7-stm32-service.mjs'
import { createA8LocalService } from './scripts/a8-ra4m1-service.mjs'
import { createA9LocalService } from './scripts/a9-stm32-service.mjs'
import { createA12LocalService } from './scripts/a12-local-service.mjs'

/**
 * 2026-11-14: dịch vụ công cụ cục bộ (biên dịch Arduino bằng arduino-cli, bootrom RP2040) chỉ có trên
 * `vite` dev/preview chạy trên máy. Bản build tĩnh không có /api/local-tools nên web tự rơi về trình thông dịch.
 */
function machMoLocalTools(): Plugin {
  function addLocalFirmware(server: ViteDevServer | PreviewServer) {
    for (const createService of [createA7LocalService, createA8LocalService, createA9LocalService, createA12LocalService]) {
      const service = createService(server.config.root)
      server.middlewares.use(service.middleware)
      server.httpServer?.once('close', service.close)
    }
    server.middlewares.use(createA2LocalAssets(server.config.root))
  }
  return {
    name: 'machmo-local-tools',
    configureServer(server) {
      addLocalFirmware(server)
      const env = loadEnv(server.config.mode, server.config.envDir, ['GUIDE_AI_PROVIDER', 'OPENAI_API_KEY', 'OPENAI_MODEL', 'OPENAI_REASONING_EFFORT'])
      const providerEnv = env.GUIDE_AI_PROVIDER === 'ollama' ? undefined : env
      server.middlewares.use(createLocalToolsMiddleware({
        guideAi: { providerEnv, log: (event: object) => console.info('Mở Bot', event) },
      }))
    },
    configurePreviewServer(server) {
      addLocalFirmware(server)
      server.middlewares.use(createLocalToolsMiddleware())
    },
  }
}

export default defineConfig({
  plugins: [react(), machMoLocalTools()],
  // The repo also contains archived HTML pages that are not app entry points.
  optimizeDeps: { entries: ['index.html'] },
  // The browser based STEP viewer loads CAD files cross-origin from this dev server.
  // Production hosting must set an equivalent narrowly-scoped CORS policy for /cad/*.step.
  server: {
    watch: { ignored: ['**/.tmp/**'] },
    fs: { deny: ['.env', '.env.*', '*.{crt,pem,key,p12,pfx,cer,der}', '.npmrc', '.yarnrc.yml', '**/.git/**',
      '**/.tmp/a11-{local-assets,vendor,build}/**', '**/.tmp/a12-*/**'] },
    cors: { origin: 'https://3dviewer.net' },
  },
})
