import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { BrandingProvider } from './lib/branding.jsx'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <BrandingProvider>
        <App />
      </BrandingProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
