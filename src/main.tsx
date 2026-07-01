import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import { AuthProvider } from './contexts/AuthProvider'
import { AppBootstrap } from './AppBootstrap'

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={clientId}>
      <AuthProvider>
        <AppBootstrap />
      </AuthProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
