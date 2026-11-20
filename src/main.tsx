import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AppUpdateNotice } from './components/AppUpdateNotice'
import { registerServiceWorker } from './lib/registerServiceWorker'

registerServiceWorker()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <AppUpdateNotice />
    </BrowserRouter>
  </StrictMode>,
)
