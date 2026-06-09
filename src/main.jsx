import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import PrivacyPage from './PrivacyPage'
import { Analytics } from '@vercel/analytics/react'

const isPrivacy = window.location.pathname === '/privacy'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isPrivacy ? <PrivacyPage /> : <App />}
    <Analytics />
  </React.StrictMode>
)