
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  obtenerVideojuego,
  obtenerPartidasVideojuego,
  obtenerResumenVideojuego,
  actualizarLogro,
} from "../api/videojuegosApi";

import type {
  Videojuego,
  Partida,
  ResumenVideojuego,
} from "../tipos";

import "./DetalleVideojuego.css";

const nombresEstado: Record<string, string> = {
  pendiente: "Pendiente",
  jugando: "Jugando",
  completado: "Completado",
  abandonado: "Abandonado",
};

const nombresGenero: Record<string, string> = {
  accion: "Acción",
  aventura: "Aventura",
  rol: "Rol",
  deportes: "Deportes",
  estrategia: "Estrategia",
  simulacion: "Simulación",
  otros: "Otros",
};

function mostrarFecha(fecha: string) {
  return new Date(fecha).toLocaleString("es-EC", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DetalleVideojuego() {
  const { id } = useParams<{ id: string }>();

  const [videojuego, setVideojuego] = useState<Videojuego | null>(null);
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [resumen, setResumen] = useState<ResumenVideojuego | null>(null);

  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [errorLogro, setErrorLogro] = useState("");
  const [logroActualizando, setLogroActualizando] = useState<string | null>(
    null
  );

  useEffect(() => {
    let activo = true;

    async function cargarDetalle() {
      if (!id) {
        setErrorCarga("El identificador del videojuego no es válido.");
        setCargando(false);
        return;
      }

      setCargando(true);
      setErrorCarga("");
      setErrorLogro("");
      setVideojuego(null);
      setResumen(null);
      setPartidas([]);

      try {
        const [datosVideojuego, datosPartidas, datosResumen] =
          await Promise.all([
            obtenerVideojuego(id),
            obtenerPartidasVideojuego(id),
            obtenerResumenVideojuego(id),
          ]);

        if (!activo) return;

        setVideojuego(datosVideojuego);
        setPartidas(datosPartidas);
        setResumen(datosResumen);
      } catch {
        if (activo) {
          setErrorCarga("No pudimos cargar este videojuego.");
        }
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargarDetalle();

    return () => {
      activo = false;
    };
  }, [id]);

  async function cambiarLogro(logroId: string, obtenido: boolean) {
    if (!id || logroActualizando !== null) return;

    setLogroActualizando(logroId);
    setErrorLogro("");

    try {
      const videojuegoActualizado = await actualizarLogro(
        id,
        logroId,
        obtenido
      );

      setVideojuego(videojuegoActualizado);
    } catch {
      setErrorLogro(
        "No se pudo guardar el logro. Inténtalo nuevamente."
      );
    } finally {
      setLogroActualizando(null);
    }
  }

  if (cargando) {
    return (
      <section className="detalle-estado" role="status">
        <span aria-hidden="true">✳</span>
        <h1>CARGANDO TU AVENTURA...</h1>
        <p>Estamos preparando tus estadísticas.</p>
      </section>
    );
  }

  if (errorCarga || !videojuego) {
    return (
      <section className="detalle-estado" role="alert">
        <span aria-hidden="true">!</span>
        <h1>UPS, ALGO PASÓ</h1>
        <p>{errorCarga || "Videojuego no encontrado."}</p>
        <Link to="/videojuegos" className="detalle-boton detalle-boton-morado">
          Volver a mis juegos
        </Link>
      </section>
    );
  }

  const progreso = Math.min(
    100,
    Math.max(0, resumen?.porcentajeAvance ?? 0)
  );

  const logrosObtenidos = videojuego.logros.filter(
    (logro) => logro.obtenido
  ).length;

  const totalLogros = videojuego.logros.length;

  const nombreGenero =
    nombresGenero[videojuego.genero] ?? videojuego.genero;

  const nombreEstado =
    nombresEstado[videojuego.estado] ?? videojuego.estado;

  return (
    <div className="detalle-page">
      <div className="detalle-navegacion">
        <Link to="/videojuegos" className="detalle-volver">
          ← Volver a mis juegos
        </Link>

        <Link
          to={`/videojuegos/${id}/editar`}
          className="detalle-boton detalle-boton-rosa"
        >
          ✎ Editar videojuego
        </Link>
      </div>

      {/* CABECERA Y PROGRESO */}

      <section className="detalle-hero">
        <div className="detalle-hero-contenido">
          <span className="detalle-sobretitulo">
            TU AVENTURA CONTINÚA
          </span>

          <h1>{videojuego.titulo}</h1>

          <div className="detalle-etiquetas">
            <span>{nombreGenero}</span>
            <span>{videojuego.plataforma}</span>
            <span className={`detalle-estado-chip estado-${videojuego.estado}`}>
              {nombreEstado}
            </span>
          </div>

          <div className="detalle-progreso">
            <div className="detalle-progreso-superior">
              <div>
                <span className="detalle-progreso-label">
                  PROGRESO ACTUAL
                </span>
                <p>
                  {resumen?.totalPartidas
                    ? "Así va tu última aventura registrada."
                    : "Registra tu primera partida para empezar."}
                </p>
              </div>

              <strong>{resumen ? `${progreso}%` : "—"}</strong>
            </div>

            <div
              className="detalle-barra"
              role={resumen ? "progressbar" : undefined}
              aria-label="Progreso actual del videojuego"
              aria-valuemin={resumen ? 0 : undefined}
              aria-valuemax={resumen ? 100 : undefined}
              aria-valuenow={resumen ? progreso : undefined}
            >
              <div
                className="detalle-barra-relleno"
                style={{ width: `${progreso}%` }}
              />
            </div>
          </div>

          <Link
            to={`/partidas/nueva?videojuego=${id}`}
            className="detalle-boton detalle-boton-oscuro"
          >
            + Registrar nueva partida ↗
          </Link>
        </div>

        <div className="detalle-hero-arte" aria-hidden="true">
          <span className="detalle-arte-estrella">✳</span>
          <div className="detalle-arte-circulo">
 <img
  className="detalle-hero-image"
  src={videojuego.imagen || "/images/game-placeholder.png"}
  alt=""
  onError={(e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = "/images/game-placeholder.png";
  }}
/>
</div>
          <span className="detalle-arte-sello">
            ¡A SEGUIR
            <strong>JUGANDO!</strong>
          </span>
        </div>
      </section>

      {/* ESTADÍSTICAS */}

      <section
        className="detalle-estadisticas"
        aria-label="Estadísticas del videojuego"
      >
        <article className="detalle-stat stat-amarilla">
          <span>PARTIDAS</span>
          <strong>{resumen?.totalPartidas ?? "—"}</strong>
          <p>sesiones registradas</p>
        </article>

        <article className="detalle-stat stat-rosa">
          <span>TIEMPO JUGADO</span>
          <strong>
            {resumen
              ? `${Number(resumen.horasTotales.toFixed(1))} h`
              : "—"}
          </strong>
          <p>horas acumuladas</p>
        </article>

        <article className="detalle-stat stat-morada">
          <span>LOGROS</span>
          <strong>{`${logrosObtenidos}/${totalLogros}`}</strong>
          <p>logros desbloqueados</p>
        </article>

        <article className="detalle-stat stat-blanca">
          <span>CALIFICACIÓN</span>
          <strong>
            {videojuego.calificacion === undefined ||
            videojuego.calificacion === null
              ? "—"
              : `${videojuego.calificacion}/10`}
          </strong>
          <p>tu valoración del juego</p>
        </article>
      </section>

      {/* LOGROS */}

      <section className="detalle-seccion">
        <div className="detalle-seccion-titulo">
          <div>
            <span className="detalle-mini-titulo">
              PEQUEÑAS VICTORIAS
            </span>
            <h2>MIS LOGROS<span>!</span></h2>
            <p>
              Marca los desafíos que ya superaste.
            </p>
          </div>

          <span className="detalle-contador">
            {logrosObtenidos} de {totalLogros}
          </span>
        </div>

        {errorLogro && (
          <p className="detalle-error" role="alert">
            {errorLogro}
          </p>
        )}

        {totalLogros === 0 ? (
          <div className="detalle-vacio">
            <img
  className="detalle-empty-image"
  src="/images/empty-logros.png"
  alt=""
/>

<h3>TODAVÍA NO HAY LOGROS</h3>
            <p>
              Puedes agregar nuevos desafíos editando tu videojuego.
            </p>
            <Link
              to={`/videojuegos/${id}/editar`}
              className="detalle-boton detalle-boton-morado"
            >
              + Agregar logros
            </Link>
          </div>
        ) : (
          <div className="detalle-logros">
            {videojuego.logros.map((logro) => (
              <label
                key={logro._id}
                className={`detalle-logro ${
                  logro.obtenido ? "logro-desbloqueado" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={logro.obtenido}
                  disabled={logroActualizando !== null}
                  onChange={(e) =>
                    cambiarLogro(logro._id, e.target.checked)
                  }
                />

                <span className="detalle-logro-icono" aria-hidden="true">
  <img
    src={
      logro.obtenido
        ? "/images/badge-unlocked.png"
        : "/images/badge-locked.png"
    }
    alt=""
    loading="lazy"
  />
</span>

                <span className="detalle-logro-texto">
                  <strong>{logro.nombre}</strong>
                  <small>
                    {logroActualizando === logro._id
                      ? "Guardando..."
                      : logro.obtenido
                        ? "¡Desbloqueado!"
                        : "Por desbloquear"}
                  </small>
                </span>

                <span className="detalle-logro-check" aria-hidden="true">
                  {logro.obtenido ? "✓" : "+"}
                </span>
              </label>
            ))}
          </div>
        )}
      </section>

      {/* HISTORIAL */}

      <section className="detalle-seccion">
        <div className="detalle-seccion-titulo">
          <div>
            <span className="detalle-mini-titulo">
              CADA PARTIDA CUENTA
            </span>
            <h2>MI HISTORIAL<span>!</span></h2>
            <p>
              Mira cuánto has avanzado en cada sesión.
            </p>
          </div>

          <Link
            to={`/partidas/nueva?videojuego=${id}`}
            className="detalle-boton detalle-boton-amarillo"
          >
            + Nueva partida
          </Link>
        </div>

        {partidas.length === 0 ? (
          <div className="detalle-vacio">
            <span aria-hidden="true">◷</span>
            <h3>TU HISTORIA EMPIEZA AQUÍ</h3>
            <p>
              Registra tu primera partida para ver tu progreso.
            </p>
            <Link
              to={`/partidas/nueva?videojuego=${id}`}
              className="detalle-boton detalle-boton-morado"
            >
              Registrar partida
            </Link>
          </div>
        ) : (
          <div className="detalle-historial">
            {partidas.map((partida, indice) => {
              const avance = Math.min(
                100,
                Math.max(0, partida.porcentajeAvance)
              );

              return (
                <article
                  className="detalle-sesion"
                  key={partida._id}
                >
                  <div className="detalle-sesion-numero">
                    {String(partidas.length - indice).padStart(2, "0")}
                  </div>

                  <div className="detalle-sesion-datos">
                    <strong>{mostrarFecha(partida.fecha)}</strong>
                    <span>
                      ◷ {partida.duracionMinutos} minutos jugados
                    </span>
                  </div>

                  <div className="detalle-sesion-avance">
                    <div>
                      <span>AVANCE REGISTRADO</span>
                      <strong>{avance}%</strong>
                    </div>

                    <div className="detalle-sesion-barra">
                      <span style={{ width: `${avance}%` }} />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <div className="detalle-cierre">
        <span></span>
        <p>CADA PARTIDA ES PARTE DE TU HISTORIA.</p>
        <Link to="/videojuegos">← Volver a la biblioteca</Link>
      </div>
    </div>
  );
}
