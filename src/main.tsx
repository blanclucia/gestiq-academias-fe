import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles/tokens.css'
import './styles/base.css'
import './styles/layout.css'
import './styles/components.css'
import './styles/data-table.css'
import './styles/forms.css'
import './styles/agenda.css'
import './styles/finance.css'
import './styles/billing.css'
import './styles/academy.css'
import './styles/examinations.css'
import './styles/public.css'
import './styles/detail-pages.css'
import './styles/pages.css'
import App from './app/App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
