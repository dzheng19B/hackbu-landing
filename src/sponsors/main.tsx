import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import '@fontsource/fraunces/latin-600.css'
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'

import '../landing.css'
import { SponsorsPage } from './SponsorsPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SponsorsPage />
  </StrictMode>,
)
