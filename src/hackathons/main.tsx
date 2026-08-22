import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import '@fontsource/fraunces/latin-600.css'
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'

import './hackathons.css'
import HackathonsApp from './HackathonsApp.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HackathonsApp />
  </StrictMode>,
)
