import { useEffect } from 'react'
import App from './App'
import { useAuthContext } from './contexts/authContext'

export const AppBootstrap = () => {
  const { initializeApp } = useAuthContext()

  useEffect(() => {
    void initializeApp().catch((error) => {
      console.error('App bootstrap failed', error)
    })
  }, [initializeApp])

  return <App />
}