import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

/*
 * The same three faces the landing page loads, and no more. Fraunces 600 is
 * every display heading; Inter 400 is body copy and Inter 500 is the eyebrows
 * and button labels.
 */
import '@fontsource/fraunces/latin-600.css'
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'

/*
 * Same stylesheet root as the landing page, so this page shares tokens and
 * type without pulling in the component sheet's utilities.
 */
import '../landing.css'
import { AboutPage } from './AboutPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AboutPage />
  </StrictMode>,
)
