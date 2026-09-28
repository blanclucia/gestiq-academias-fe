import { StrictMode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './auth/AuthProvider'
import { ToastProvider } from './components/ui/ToastProvider'
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

document.documentElement.classList.toggle('dark', window.localStorage.getItem('gestiq-dark-mode') === 'true')

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}><ToastProvider><AuthProvider><BrowserRouter>
      <App />
    </BrowserRouter></AuthProvider></ToastProvider></QueryClientProvider>
  </StrictMode>,
)
