import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { BrandConfigProvider } from './context/BrandConfigContext'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <BrandConfigProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrandConfigProvider>
    </BrowserRouter>
  </StrictMode>,
)
