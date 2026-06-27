import { useAuthContext } from '../contexts/AuthContext'

export const AdminPage = () => {
  const { internalUser, signOutInternal, switchGoogleAccount } = useAuthContext()

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div className="dashboard-user">
          <img className="user-avatar" src={internalUser?.name ? '/favicon.svg' : ''} alt="avatar" />
          <div className="user-info">
            <p className="user-name">{internalUser?.name}</p>
            <p className="user-email">{internalUser?.email}</p>
          </div>
        </div>

        <div className="dashboard-header-actions">
          <button className="primary-button" onClick={async () => { try { await signOutInternal(); window.location.href = '/login' } catch(e){ alert('Error al sincronizar: '+(e as Error).message)} }}>
            Cerrar sesión
          </button>
          <button className="primary-button" onClick={async () => { await switchGoogleAccount(); window.location.href = '/auth-google' }}>
            Cambiar cuenta Google
          </button>
        </div>
      </div>

      <div className="dashboard-main">
        <div className="dashboard-section">
          <h2>Panel de administrador</h2>
          <p>Aquí irán las funciones administrativas.</p>
        </div>
      </div>
    </div>
  )
}
