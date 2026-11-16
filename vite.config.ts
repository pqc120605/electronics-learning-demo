import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { createLocalToolsMiddleware } from './scripts/arduino-compile-service.mjs'

/**
 * 2026-11-14: dịch vụ công cụ cục bộ (biên dịch Arduino bằng arduino-cli, bootrom RP2040) chỉ có trên
 * `vite` dev/preview chạy trên máy. Bản build tĩnh không có /api/local-tools nên web tự rơi về trình thông dịch.
 */
function machMoLocalTools(): Plugin {
  return {
    name: 'machmo-local-tools',
    configureServer(server) { server.middlewares.use(createLocalToolsMiddleware()) },
    configurePreviewServer(server) { server.middlewares.use(createLocalToolsMiddleware()) },
  }
}

export default defineConfig({
  plugins: [react(), machMoLocalTools()],
  // The browser based STEP viewer loads CAD files cross-origin from this dev server.
  // Production hosting must set an equivalent narrowly-scoped CORS policy for /cad/*.step.
  server: {
    watch: { ignored: ['**/.tmp/**'] },
    cors: { origin: 'https://3dviewer.net' },
  },
})
