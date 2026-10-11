
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Link,
} from "react-router-dom";

import { ListaVideojuegos } from "./paginas/ListaVideojuegos";
import { DetalleVideojuego } from "./paginas/DetalleVideojuego";
import { FormularioVideojuego } from "./paginas/FormularioVideojuego";
import { ListaPartidas } from "./paginas/ListaPartidas";
import { NuevaPartida } from "./paginas/NuevaPartida";

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <header className="site-header">
          <div className="nav-container">
            <Link to="/" className="brand">
              <span className="brand-icon">✳</span>
              PLAYLOG<span className="brand-dot">!</span>
            </Link>

            <nav className="main-nav" aria-label="Navegación principal">
              <NavLink
                to="/videojuegos"
                end={false}
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
              >
                Mis juegos
              </NavLink>

              <NavLink
                to="/partidas"
                end
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
              >
                Mis partidas
              </NavLink>
            </nav>

            <Link to="/partidas/nueva" className="nav-action">
              <span>+</span> Nueva partida
            </Link>
          </div>
        </header>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<ListaVideojuegos />} />
            <Route path="/videojuegos" element={<ListaVideojuegos />} />

            <Route
              path="/videojuegos/nuevo"
              element={<FormularioVideojuego />}
            />

            <Route
              path="/videojuegos/:id/editar"
              element={<FormularioVideojuego />}
            />

            <Route
              path="/videojuegos/:id"
              element={<DetalleVideojuego />}
            />

            <Route path="/partidas" element={<ListaPartidas />} />

            <Route
              path="/partidas/nueva"
              element={<NuevaPartida />}
            />
          </Routes>
        </main>

        <footer className="site-footer">
          <div className="footer-content">
            <Link to="/" className="footer-brand">
              PLAYLOG!
            </Link>

            <p>Tu progreso merece su propia historia.</p>

            <span>KEEP PLAYING ↗</span>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}
