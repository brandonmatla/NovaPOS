import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../contexts/AuthContext'

export const AuthPage = () => {
  const navigate = useNavigate()
  const { googleSession } = useAuthContext()

  useEffect(() => {
    if (googleSession) {
      // If user already has Google session, go to internal login
      navigate('/login')
    } else {
      // Otherwise prompt to continue with Google
      navigate('/auth-google')
    }
  }, [googleSession, navigate])

  return null
}
