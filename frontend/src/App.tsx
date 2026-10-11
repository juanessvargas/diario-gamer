
import { useState } from "react";
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
  const [menuAbierto, setMenuAbierto] = useState(false);

  function cerrarMenu() {
    setMenuAbierto(false);
  }

  return (
    <BrowserRouter>
      <div className="app">
        {/* NAVEGACIÓN */}

        <header className="site-header">
          <div className="nav-container">
            <Link
              to="/"
              className="brand"
              onClick={cerrarMenu}
            >
              
              PLAYLOG<span className="brand-dot">!</span>
            </Link>

            {/* BOTÓN HAMBURGUESA PARA CELULAR */}

            <button
              type="button"
              className="menu-hamburguesa"
              aria-label={
                menuAbierto ? "Cerrar menú" : "Abrir menú"
              }
              aria-expanded={menuAbierto}
              aria-controls="navegacion-playlog"
              onClick={() =>
                setMenuAbierto((actual) => !actual)
              }
            >
              <span />
              <span />
              <span />
            </button>

            {/* ENLACES DE NAVEGACIÓN */}

            <nav
              id="navegacion-playlog"
              className={`main-nav ${
                menuAbierto ? "menu-abierto" : ""
              }`}
              aria-label="Navegación principal"
            >
              <NavLink
                to="/videojuegos"
                className={({ isActive }) =>
                  isActive
                    ? "nav-link active"
                    : "nav-link"
                }
                onClick={cerrarMenu}
              >
                Mis juegos
              </NavLink>

              <NavLink
                to="/partidas"
                end
                className={({ isActive }) =>
                  isActive
                    ? "nav-link active"
                    : "nav-link"
                }
                onClick={cerrarMenu}
              >
                Mis partidas
              </NavLink>
            </nav>

            {/* BOTÓN DE NUEVA PARTIDA */}

            <Link
              to="/partidas/nueva"
              className="nav-action"
              onClick={cerrarMenu}
            >
              <span>+</span>
              Nueva partida
            </Link>
          </div>
        </header>

        {/* CONTENIDO PRINCIPAL */}

        <main className="main-content">
          <Routes>
            <Route
              path="/"
              element={<ListaVideojuegos />}
            />

            <Route
              path="/videojuegos"
              element={<ListaVideojuegos />}
            />

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

            <Route
              path="/partidas"
              element={<ListaPartidas />}
            />

            <Route
              path="/partidas/nueva"
              element={<NuevaPartida />}
            />
          </Routes>
        </main>

        {/* FOOTER */}

        <footer className="site-footer">
          <div className="footer-content">
            <Link
              to="/"
              className="footer-brand"
              onClick={cerrarMenu}
            >
              PLAYLOG!
            </Link>

            <p>
              Tu progreso merece su propia historia.
            </p>

            <a
              href="https://rawg.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="rawg-credit"
            >
              Datos e imágenes de RAWG ↗
            </a>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}
