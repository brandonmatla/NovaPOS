import { useAuthContext } from '../contexts/authContext'

export const VendedorPage = () => {
  const { internalUser, signOutInternal } = useAuthContext()
  const activeUser = internalUser

  const handleSignOut = async () => {
    try {
      await signOutInternal()
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
