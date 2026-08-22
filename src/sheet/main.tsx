import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

/*
 * The same three faces the landing page loads, and no more — the sheet renders
 * the real components, so it needs exactly the fonts they are drawn in.
 * (Fraunces 600 for display, Inter 400/500 for body and labels.)
 */
import '@fontsource/fraunces/latin-600.css'
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'

import '../index.css'
import './sheet.css'
import { ComponentSheet } from './ComponentSheet'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ComponentSheet />
  </StrictMode>,
)
