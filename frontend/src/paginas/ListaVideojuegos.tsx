
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  obtenerVideojuegos,
  obtenerResumenVideojuego,
} from "../api/videojuegosApi";

import type {
  Videojuego,
  ResumenVideojuego,
} from "../tipos";

import "./ListaVideojuegos.css";

const estados = [
  { valor: "", texto: "Todos" },
  { valor: "jugando", texto: "Jugando" },
  { valor: "pendiente", texto: "Pendientes" },
  { valor: "completado", texto: "Completados" },
  { valor: "abandonado", texto: "Abandonados" },
];

export function ListaVideojuegos() {
  const [videojuegos, setVideojuegos] = useState<Videojuego[]>([]);
  const [resumenes, setResumenes] = useState<
    Record<string, ResumenVideojuego>
  >({});

  const [estado, setEstado] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;

    async function cargarVideojuegos() {
      setCargando(true);
      setError("");
      setResumenes({});

      try {
        const juegos = await obtenerVideojuegos(estado);

        if (!activo) return;

        setVideojuegos(juegos);

        // El resumen siempre se calcula en el backend.
        const resultados = await Promise.all(
          juegos.map(async (juego) => {
            try {
              const resumen = await obtenerResumenVideojuego(
                juego._id
              );

              return {
                id: juego._id,
                resumen,
              };
            } catch {
              // Si falla un resumen, no inventamos datos.
              return {
                id: juego._id,
                resumen: null,
              };
            }
          })
        );

        if (!activo) return;

        const nuevosResumenes: Record<
          string,
          ResumenVideojuego
        > = {};

        resultados.forEach((resultado) => {
          if (resultado.resumen) {
            nuevosResumenes[resultado.id] = resultado.resumen;
          }
        });

        setResumenes(nuevosResumenes);
      } catch {
        if (activo) {
          setError("No pudimos cargar tus videojuegos.");
          setVideojuegos([]);
        }
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    }

    cargarVideojuegos();

    return () => {
      activo = false;
    };
  }, [estado]);

  const juegosFiltrados = videojuegos.filter((juego) =>
    juego.titulo
      .toLowerCase()
      .includes(busqueda.toLowerCase().trim())
  );

  const totalJuegos = videojuegos.length;

  const totalHoras = videojuegos.reduce((total, juego) => {
    return total + (resumenes[juego._id]?.horasTotales ?? 0);
  }, 0);

  const resumenesDisponibles = videojuegos.every(
    (juego) => resumenes[juego._id] !== undefined
  );

  function nombreEstado(valor: string) {
    switch (valor) {
      case "jugando":
        return "Jugando";
      case "pendiente":
        return "Pendiente";
      case "completado":
        return "Completado";
      case "abandonado":
        return "Abandonado";
      default:
        return valor;
    }
  }

  return (
    <div className="biblioteca-page">
      {/* HERO */}
      <section className="biblioteca-hero">
        <div className="hero-decoration hero-decoration-one">
          ✦
        </div>

        <div className="hero-decoration hero-decoration-two">
          ✳
        </div>

        <div className="hero-content">
          <span className="hero-eyebrow">
            BIENVENIDO A TU UNIVERSO GAMER
          </span>

          <h1>
  LET THE
  <span>GAME</span>
  BEGIN!
</h1>

          <p>
            Tu biblioteca. Tus partidas. Tus logros.
            Todo en un solo lugar.
          </p>

          <div className="hero-actions">
            <Link
              to="/videojuegos/nuevo"
              className="playlog-button playlog-button-dark"
            >
              + Agregar videojuego ↗
            </Link>

            <Link
              to="/partidas"
              className="playlog-button playlog-button-pink"
            >
              Ver mis partidas →
            </Link>
          </div>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="hero-orbit">
            <div className="hero-console">🎮</div>
          </div>

          <span className="hero-star hero-star-one">✦</span>
          <span className="hero-star hero-star-two">✳</span>

          <span className="hero-sticker">
            PRESS
            <strong>START!</strong>
          </span>
        </div>
      </section>

      {/* ESTADÍSTICAS GENERALES */}
      <section
        className="biblioteca-stats"
        aria-label="Estadísticas de tu biblioteca"
      >
        <div className="stat-card stat-purple">
          <span className="stat-label">MI COLECCIÓN</span>
          <strong>{cargando ? "..." : totalJuegos}</strong>
          <span>videojuegos en este filtro</span>
        </div>

        <div className="stat-card stat-pink">
          <span className="stat-label">TIEMPO JUGADO</span>
          <strong>
            {cargando || !resumenesDisponibles
              ? "—"
              : `${Number(totalHoras.toFixed(1))} h`}
          </strong>
          <span>
            {resumenesDisponibles
              ? "horas registradas en este filtro"
              : "Información no disponible"}
          </span>
        </div>

        <div className="stat-card stat-orange">
          <span className="stat-label">SIGUE JUGANDO</span>
          <strong>↗</strong>
          <Link to="/partidas/nueva">
            Registrar partida →
          </Link>
        </div>
      </section>

      {/* BIBLIOTECA */}
      <section className="biblioteca-coleccion">
        <div className="coleccion-heading">
          <div>
            <span className="section-eyebrow">
              TU COLECCIÓN DE VIDEOJUEGOS
            </span>

            <h2>MIS VIDEOJUEGOS<span>!</span></h2>

            <p>
              Todos tus mundos, en un solo lugar.
            </p>
          </div>

          <Link
            to="/videojuegos/nuevo"
            className="playlog-button playlog-button-yellow"
          >
            + Nuevo juego
          </Link>
        </div>

        <div className="biblioteca-toolbar">
          <div
            className="biblioteca-filtros"
            role="group"
            aria-label="Filtrar por estado"
          >
            {estados.map((opcion) => (
              <button
                key={opcion.valor}
                type="button"
                aria-pressed={estado === opcion.valor}
                className={
                  estado === opcion.valor
                    ? "filtro-chip seleccionado"
                    : "filtro-chip"
                }
                onClick={() => setEstado(opcion.valor)}
              >
                {opcion.texto}
              </button>
            ))}
          </div>

          <label className="biblioteca-search">
            <span className="sr-only">
              Buscar videojuego por título
            </span>

            <span aria-hidden="true">⌕</span>

            <input
              type="search"
              placeholder="Buscar videojuego..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </label>
        </div>

        {/* LOADING / ERROR / EMPTY */}
        {cargando ? (
          <div className="biblioteca-mensaje" role="status">
            <span className="mensaje-icon">◌</span>
            <h3>CARGANDO TUS MUNDOS...</h3>
            <p>Un momento, estamos preparando tu biblioteca.</p>
          </div>
        ) : error ? (
          <div className="biblioteca-mensaje" role="alert">
            <span className="mensaje-icon">!</span>
            <h3>UPS, ALGO SALIÓ MAL</h3>
            <p>{error}</p>

            <button
              type="button"
              onClick={() => window.location.reload()}
            >
              Intentar de nuevo
            </button>
          </div>
        ) : juegosFiltrados.length === 0 ? (
          <div className="biblioteca-mensaje">
            <img
  className="biblioteca-empty-image"
  src="/images/empty-library.png"
  alt=""
/>

            <h3>
              {busqueda
                ? "NO ENCONTRAMOS ESE JUEGO"
                : estado
                  ? "NO HAY JUEGOS EN ESTE ESTADO"
                  : "TU AVENTURA EMPIEZA AQUÍ"}
            </h3>

            <p>
              {busqueda
                ? "Prueba con otro nombre."
                : "Agrega videojuegos a tu colección."}
            </p>

            <Link
              to="/videojuegos/nuevo"
              className="playlog-button playlog-button-yellow"
            >
              + Agregar videojuego
            </Link>
          </div>
        ) : (
          <div className="videojuegos-grid">
            {juegosFiltrados.map((juego, indice) => {
              const resumen = resumenes[juego._id];
              const progreso = resumen?.porcentajeAvance;

              return (
                <article
                  className="game-card"
                  key={juego._id}
                >
                  <div
                    className={`game-card-cover cover-${
                      indice % 4
                    }`}
                  >
                    <span className="game-card-platform">
                      {juego.plataforma}
                    </span>

                    <div className="game-card-art" aria-hidden="true">
  <img
  className="game-card-image"
  src={juego.imagen || "/images/game-placeholder.png"}
  alt=""
  loading="lazy"
  onError={(e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = "/images/game-placeholder.png";
  }}
/>
</div>

                    <span className="game-card-genre">
                      {juego.genero}
                    </span>
                  </div>

                  <div className="game-card-body">
                    <span
                      className={`game-status status-${juego.estado}`}
                    >
                      <span className="status-dot" />
                      {nombreEstado(juego.estado)}
                    </span>

                    <h3>{juego.titulo}</h3>

                    <div className="game-progress">
                      <div className="game-progress-heading">
                        <span>MI PROGRESO</span>
                        <strong>
                          {progreso === undefined
                            ? "—"
                            : `${progreso}%`}
                        </strong>
                      </div>

                      <div
                        className="game-progress-track"
                        role="progressbar"
                        aria-label={`Progreso de ${juego.titulo}`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={progreso}
                      >
                        <div
                          className="game-progress-fill"
                          style={{
                            width: `${progreso ?? 0}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="game-card-meta">
                      <span>
                        {resumen
                          ? `${resumen.totalPartidas} partidas`
                          : "Partidas no disponibles"}
                      </span>

                      <span>
                        {resumen
                          ? `${Number(
                              resumen.horasTotales.toFixed(1)
                            )} h`
                          : "—"}
                      </span>
                    </div>

                    <Link
                      to={`/videojuegos/${juego._id}`}
                      className="game-card-link"
                      aria-label={`Ver detalle de ${juego.titulo}`}
                    >
                      VER MI PROGRESO
                      <span aria-hidden="true">↗</span>
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
