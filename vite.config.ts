import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  // The browser based STEP viewer loads CAD files cross-origin from this dev server.
  // Production hosting must set an equivalent narrowly-scoped CORS policy for /cad/*.step.
  server: {
    watch: { ignored: ['**/.tmp/**'] },
    cors: { origin: 'https://3dviewer.net' },
  },
})
