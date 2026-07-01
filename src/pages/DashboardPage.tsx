import { useAuthContext } from '../contexts/AuthContext'
import { Logo } from '../components/Logo'

export const DashboardPage = () => {
  const { internalUser, signOutInternal } = useAuthContext()

  if (!internalUser) {
    return (
      <div className="not-authenticated-page">
        <p>No estás autenticado. Por favor, inicia sesión primero.</p>
      </div>
    )
  }

  const handleSignOut = async () => {
    await signOutInternal()
    window.location.href = '/login'
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <Logo />
        <div className="dashboard-user">
          <img src="/favicon.svg" alt={internalUser.name} className="user-avatar" />
          <div className="user-info">
            <p className="user-name">{internalUser.name}</p>
            <p className="user-email">{internalUser.email}</p>
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
