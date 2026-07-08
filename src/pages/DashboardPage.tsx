import { useAuthContext } from '../contexts/authContext'
import { Logo } from '../components/Logo'

export const DashboardPage = () => {
  const { internalUser, signOutInternal } = useAuthContext()
  const activeUser = internalUser

  if (!activeUser) {
    return (
      <div className="not-authenticated-page">
        <p>No estás autenticado. Por favor, inicia sesión primero.</p>
      </div>
    )
  }

  const handleSignOut = async () => {
    try {
      await signOutInternal()
    } catch (error) {
      alert('Error al sincronizar: ' + (error as Error).message)
    }
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <Logo />
        <div className="dashboard-user">
          <img src="/favicon.svg" alt={activeUser.name} className="user-avatar" />
          <div className="user-info">
            <p className="user-name">{activeUser.name}</p>
            <p className="user-email">{activeUser.email}</p>
          </div>
        </div>
        <button type="button" className="logout-button" onClick={handleSignOut}>
          Cerrar sesión
        </button>
      </header>

      <main className="dashboard-main">
        <section className="dashboard-section">
          <h2>Bienvenido a NovaPOS</h2>
          <p>Tu área de trabajo está lista. Próximamente se habilitarán más funciones.</p>
        </section>
      </main>
    </div>
  )
}
