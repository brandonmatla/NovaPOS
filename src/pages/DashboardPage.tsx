import { useAuth } from '../hooks/useAuth'
import { Logo } from '../components/Logo'

export const DashboardPage = () => {
  const { authState, signOut } = useAuth()

  if (!authState.googleSession) {
    return (
      <div className="not-authenticated-page">
        <p>No estás autenticado. Por favor, inicia sesión primero.</p>
      </div>
    )
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <Logo />
        <div className="dashboard-user">
          {authState.googleSession.picture && (
            <img
              src={authState.googleSession.picture}
              alt={authState.googleSession.name}
              className="user-avatar"
            />
          )}
          <div className="user-info">
            <p className="user-name">{authState.googleSession.name}</p>
            <p className="user-email">{authState.googleSession.email}</p>
          </div>
        </div>
        <button type="button" className="logout-button" onClick={signOut}>
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
