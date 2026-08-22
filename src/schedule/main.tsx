import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import '@fontsource/fraunces/latin-600.css'
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'

import './schedule.css'
import ScheduleApp from './ScheduleApp.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ScheduleApp />
  </StrictMode>,
)
