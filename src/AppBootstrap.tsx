import { useEffect, useRef } from 'react'
import App from './App'
import { useAuthContext } from './contexts/authContext'

export const AppBootstrap = () => {
  const { initializeApp } = useAuthContext()
  const bootstrapped = useRef(false)

  useEffect(() => {
    if (bootstrapped.current) return
    bootstrapped.current = true
    void initializeApp()
  }, [initializeApp])

  return <App />
}