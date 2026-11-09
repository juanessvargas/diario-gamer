
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { obtenerPartidas, eliminarPartida } from "../api/partidasApi";
import type { Partida } from "../tipos";
import "./ListaPartidas.css";

function tituloJuego(partida: Partida) {
  return typeof partida.videojuego === "string"
    ? "Videojuego no disponible"
    : partida.videojuego?.titulo ?? "Videojuego eliminado";
}

function idJuego(partida: Partida) {
  return typeof partida.videojuego === "string"
    ? partida.videojuego
    : partida.videojuego?._id;
}

function fechaPartida(fecha: string) {
  return new Date(fecha).toLocaleString("es-EC", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function tiempoLegible(minutos: number) {
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;

  if (horas === 0) return `${resto} min`;
  if (resto === 0) return `${horas} h`;

  return `${horas} h ${resto} min`;
}

export function ListaPartidas() {
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [errorAccion, setErrorAccion] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("todas");
  const [eliminando, setEliminando] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;

    async function cargarPartidas() {
      try {
        setCargando(true);
        setErrorCarga("");

        const datos = await obtenerPartidas();

        if (activo) {
          setPartidas(datos);
        }
      } catch {
        if (activo) {
          setErrorCarga(
            "No pudimos cargar tus partidas. Revisa la conexión."
          );
        }
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargarPartidas();

    return () => {
      activo = false;
    };
  }, []);

  async function borrarPartida(id: string) {
    if (eliminando) return;

    const confirmar = window.confirm(
      "¿Eliminar esta partida? Esta acción no se puede deshacer."
    );

    if (!confirmar) return;

    try {
      setEliminando(id);
      setErrorAccion("");

      await eliminarPartida(id);

      setPartidas((actuales) =>
        actuales.filter((partida) => partida._id !== id)
      );
    } catch {
      setErrorAccion(
        "No pudimos eliminar la partida. Inténtalo nuevamente."
      );
    } finally {
      setEliminando(null);
    }
  }

  // Estadísticas calculadas únicamente con partidas reales.
  const totalPartidas = partidas.length;

  const totalMinutos = partidas.reduce(
    (suma, partida) => suma + partida.duracionMinutos,
    0
  );

  const juegosDiferentes = new Set(
    partidas.map((partida) => idJuego(partida)).filter(Boolean)
  ).size;

  const partidasFiltradas = partidas.filter((partida) => {
    const coincideBusqueda = tituloJuego(partida)
      .toLowerCase()
      .includes(busqueda.toLowerCase().trim());

    const avance = partida.porcentajeAvance;

    const coincideFiltro =
      filtro === "todas" ||
      (filtro === "iniciando" && avance < 25) ||
      (filtro === "avanzando" && avance >= 25 && avance < 100) ||
      (filtro === "completadas" && avance === 100);

    return coincideBusqueda && coincideFiltro;
  });

  if (cargando) {
    return (
      <div className="historial-mensaje" role="status">
        <span aria-hidden="true">✳</span>
        <h1>CARGANDO TUS PARTIDAS...</h1>
        <p>Preparando tu historial de aventuras.</p>
      </div>
    );
  }

  if (errorCarga) {
    return (
      <div className="historial-mensaje" role="alert">
        <span aria-hidden="true">!</span>
        <h1>UPS, ALGO PASÓ</h1>
        <p>{errorCarga}</p>

        <button
          type="button"
          onClick={() => window.location.reload()}
        >
          Intentar nuevamente
        </button>
      </div>
    );
  }

  return (
    <div className="historial-page">
      {/* ENCABEZADO */}

      <header className="historial-hero">
        <div className="historial-hero-texto">
          <span className="historial-eyebrow">
            TU HISTORIA GAMER
          </span>

          <h1>
            CADA PARTIDA
            <span>CUENTA.</span>
          </h1>

          <p>
            Tus aventuras, tus avances y todas esas horas
            que se fueron volando.
          </p>

          <Link
            to="/partidas/nueva"
            className="historial-boton historial-boton-oscuro"
          >
            + Registrar partida ↗
          </Link>
        </div>

        <div className="historial-hero-arte" aria-hidden="true">
          <div className="historial-arte-icono">
  <div>🎮</div>
</div>
          <span className="historial-arte-sello">
            ¡SIGUE JUGANDO!
          </span>
        </div>
      </header>

      {/* ESTADÍSTICAS */}

      <section
        className="historial-estadisticas"
        aria-label="Resumen de tus partidas"
      >
        <article className="historial-stat morada">
          <span>PARTIDAS REGISTRADAS</span>
          <strong>{totalPartidas}</strong>
          <p>sesiones en tu diario</p>
        </article>

        <article className="historial-stat rosa">
          <span>TIEMPO TOTAL</span>
          <strong>{tiempoLegible(totalMinutos)}</strong>
          <p>tiempo acumulado</p>
        </article>

        <article className="historial-stat amarilla">
          <span>JUEGOS DIFERENTES</span>
          <strong>{juegosDiferentes}</strong>
          <p>videojuegos con sesiones</p>
        </article>
      </section>

      {/* HISTORIAL */}

      <section className="historial-seccion">
        <div className="historial-encabezado">
          <div>
            <span className="historial-mini-titulo">
              ✳ REVIVE TUS AVENTURAS
            </span>

            <h2>MIS PARTIDAS<span>!</span></h2>

            <p>De la más reciente a la más antigua.</p>
          </div>

          <Link
            to="/videojuegos"
            className="historial-boton historial-boton-amarillo"
          >
            Ver mis videojuegos →
          </Link>
        </div>

        <div className="historial-herramientas">
          <label className="historial-buscador">
            <span className="historial-sr-only">
              Buscar partidas por videojuego
            </span>
            <span aria-hidden="true">⌕</span>

            <input
              type="search"
              placeholder="Buscar por videojuego..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </label>

          <div
            className="historial-filtros"
            role="group"
            aria-label="Filtrar partidas por avance"
          >
            {[
              { valor: "todas", nombre: "Todas" },
              { valor: "iniciando", nombre: "Menos del 25%" },
              { valor: "avanzando", nombre: "25% a 99%" },
              { valor: "completadas", nombre: "100%" },
            ].map((opcion) => (
              <button
                key={opcion.valor}
                type="button"
                aria-pressed={filtro === opcion.valor}
                className={
                  filtro === opcion.valor ? "activo" : ""
                }
                onClick={() => setFiltro(opcion.valor)}
              >
                {opcion.nombre}
              </button>
            ))}
          </div>
        </div>

        {errorAccion && (
          <p className="historial-error" role="alert">
            {errorAccion}
          </p>
        )}

        {partidasFiltradas.length === 0 ? (
          <div className="historial-vacio">
            <img
  src="/images/empty-partidas.png"
  alt=""
  className="historial-empty-imagen"
/>

            <h3>
              {totalPartidas === 0
                ? "¡TU HISTORIA COMIENZA AQUÍ!"
                : "NO ENCONTRAMOS PARTIDAS"}
            </h3>

            <p>
              {totalPartidas === 0
                ? "Registra tu primera sesión para comenzar tu diario gamer."
                : "Prueba con otra búsqueda o cambia los filtros."}
            </p>

            {totalPartidas === 0 ? (
              <Link
                to="/partidas/nueva"
                className="historial-boton historial-boton-amarillo"
              >
                + Registrar primera partida
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setBusqueda("");
                  setFiltro("todas");
                }}
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="historial-lista">
            {partidasFiltradas.map((partida) => {
              const avance = Math.max(
                0,
                Math.min(100, partida.porcentajeAvance)
              );

              const juegoId = idJuego(partida);
              const tieneJuego = (
                typeof partida.videojuego !== "string" &&
                partida.videojuego != null
              );

              return (
                <article
                  className="historial-tarjeta"
                  key={partida._id}
                >
                  <div className="historial-tarjeta-icono" aria-hidden="true">
  <img
  src={
    typeof partida.videojuego === "string"
      ? "/images/game-placeholder.png"
      : partida.videojuego?.imagen || "/images/game-placeholder.png"
  }
  alt=""
  loading="lazy"
  className="historial-juego-imagen"
  onError={(e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = "/images/game-placeholder.png";
  }}
/>
</div>

                  <div className="historial-tarjeta-info">
                    <span className="historial-tarjeta-fecha">
                      ◷ {fechaPartida(partida.fecha)}
                    </span>

                    <h3>{tituloJuego(partida)}</h3>

                    <p>
                      {tiempoLegible(partida.duracionMinutos)} jugados
                    </p>

                    {juegoId && tieneJuego && (
                      <Link
                        to={`/videojuegos/${juegoId}`}
                        className="historial-ver-juego"
                      >
                        Ver videojuego ↗
                      </Link>
                    )}
                  </div>

                  <div className="historial-tarjeta-progreso">
                    <div className="historial-progreso-superior">
                      <span>AVANCE ALCANZADO</span>
                      <strong>{avance}%</strong>
                    </div>

                    <div
                      className="historial-progreso-barra"
                      role="progressbar"
                      aria-label={`Progreso de ${tituloJuego(partida)}`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={avance}
                    >
                      <span style={{ width: `${avance}%` }} />
                    </div>
                  </div>

                  <button
                    type="button"
                    className="historial-eliminar"
                    disabled={eliminando !== null}
                    onClick={() => borrarPartida(partida._id)}
                    aria-label={`Eliminar partida de ${tituloJuego(partida)} del ${fechaPartida(partida.fecha)}`}
                    title="Eliminar partida"
                  >
                    {eliminando === partida._id ? "..." : "×"}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
