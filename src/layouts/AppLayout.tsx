import { Outlet, NavLink } from 'react-router-dom'

export const AppLayout = () => {
  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <div>
          <p className="eyebrow">NovaPOS</p>
          <h2>Gestión offline y segura</h2>
        </div>
        <nav className="app-shell__nav">
          <NavLink to="/">Inicio</NavLink>
          <NavLink to="/auth">Autenticación</NavLink>
        </nav>
      </header>
      <main className="app-shell__content">
        <Outlet />
      </main>
    </div>
  )
}
