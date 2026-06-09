import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import PrivacyPage from './PrivacyPage'
import TosPage from './TosPage'
import { Analytics } from '@vercel/analytics/react'

const path = window.location.pathname

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {path === '/privacy' ? <PrivacyPage /> : path === '/tos' ? <TosPage /> : <App />}
    <Analytics />
  </React.StrictMode>
)