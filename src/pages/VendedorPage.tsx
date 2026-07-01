import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../contexts/authContext'
import { authService } from '../services/authService'

export const VendedorPage = () => {
  const navigate = useNavigate()
  const { internalUser, signOutInternal } = useAuthContext()
  const restoredUser = authService.restoreInternalSession()
  const activeUser = internalUser ?? restoredUser

  const handleSignOut = async () => {
    try {
      await signOutInternal()
      navigate('/login', { replace: true })
    } catch (error) {
      alert('Error al sincronizar: ' + (error as Error).message)
    }
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div className="dashboard-user">
          <img className="user-avatar" src={activeUser?.name ? '/favicon.svg' : ''} alt="avatar" />
          <div className="user-info">
            <p className="user-name">{activeUser?.name}</p>
            <p className="user-email">{activeUser?.email}</p>
          </div>
        </div>

        <div className="dashboard-header-actions">
          <button className="primary-button" onClick={handleSignOut}>
            Cerrar sesión
          </button>
        </div>
      </div>

      <div className="dashboard-main">
        <div className="dashboard-section">
          <h2>Panel vendedor</h2>
          <p>Aquí irán las funciones de venta.</p>
        </div>
      </div>
    </div>
  )
}
