
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import { obtenerVideojuegos } from "../api/videojuegosApi";
import { crearPartida } from "../api/partidasApi";

import type {
  Videojuego,
  NuevaPartida as DatosNuevaPartida,
} from "../tipos";

import "./NuevaPartida.css";

// Devuelve fecha y hora local para el input datetime-local.
function fechaActualLocal() {
  const ahora = new Date();
  const diferencia = ahora.getTimezoneOffset() * 60000;

  return new Date(ahora.getTime() - diferencia)
    .toISOString()
    .slice(0, 16);
}

function limitarPorcentaje(valor: number) {
  return Math.min(100, Math.max(0, valor));
}

export function NuevaPartida() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const videojuegoInicial =
    searchParams.get("videojuego") ?? "";

  const [videojuegos, setVideojuegos] = useState<Videojuego[]>([]);

  const [form, setForm] = useState<DatosNuevaPartida>({
    videojuego: videojuegoInicial,
    fecha: fechaActualLocal(),
    duracionMinutos: 60,
    porcentajeAvance: 0,
  });

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errorCarga, setErrorCarga] = useState("");
  const [errorGuardar, setErrorGuardar] = useState("");

  useEffect(() => {
    let activo = true;

    async function cargarVideojuegos() {
      try {
        setCargando(true);
        setErrorCarga("");

        const datos = await obtenerVideojuegos();

        if (!activo) return;

        setVideojuegos(datos);

        const existeInicial = datos.some(
          (juego) => juego._id === videojuegoInicial
        );

        setForm((actual) => ({
          ...actual,
          videojuego: existeInicial
            ? videojuegoInicial
            : datos[0]?._id ?? "",
        }));
      } catch {
        if (activo) {
          setErrorCarga(
            "No pudimos cargar tus videojuegos. Revisa la conexión e inténtalo nuevamente."
          );
        }
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargarVideojuegos();

    return () => {
      activo = false;
    };
  }, [videojuegoInicial]);

  const juegoSeleccionado = videojuegos.find(
    (juego) => juego._id === form.videojuego
  );

  function sumarMinutos(minutos: number) {
    setForm((actual) => ({
      ...actual,
      duracionMinutos: Math.max(
        1,
        actual.duracionMinutos + minutos
      ),
    }));
  }

  function cambiarPorcentaje(valor: number) {
    setForm((actual) => ({
      ...actual,
      porcentajeAvance: limitarPorcentaje(valor),
    }));
  }

  async function manejarEnvio(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (guardando) return;

    setErrorGuardar("");

    if (!form.videojuego) {
      setErrorGuardar("Selecciona un videojuego.");
      return;
    }

    if (!form.fecha || Number.isNaN(new Date(form.fecha).getTime())) {
      setErrorGuardar("Selecciona una fecha y hora válidas.");
      return;
    }

    if (
      !Number.isFinite(form.duracionMinutos) ||
      form.duracionMinutos < 1
    ) {
      setErrorGuardar("La duración debe ser mayor a cero.");
      return;
    }

    if (
      !Number.isFinite(form.porcentajeAvance) ||
      form.porcentajeAvance < 0 ||
      form.porcentajeAvance > 100
    ) {
      setErrorGuardar("El avance debe estar entre 0% y 100%.");
      return;
    }

    try {
      setGuardando(true);

      await crearPartida({
        ...form,
        fecha: new Date(form.fecha).toISOString(),
      });

      navigate(`/videojuegos/${form.videojuego}`);
    } catch {
      setErrorGuardar(
        "No pudimos guardar tu partida. Inténtalo nuevamente."
      );
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <div className="nueva-partida-mensaje" role="status">
        <span aria-hidden="true">✳</span>
        <h1>CARGANDO TUS JUEGOS...</h1>
        <p>Preparando tu próxima partida.</p>
      </div>
    );
  }

  if (errorCarga) {
    return (
      <div className="nueva-partida-mensaje" role="alert">
        <span aria-hidden="true">!</span>
        <h1>ALGO SALIÓ MAL</h1>
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

  if (videojuegos.length === 0) {
    return (
      <div className="nueva-partida-mensaje">
        <span aria-hidden="true">☆</span>
        <h1>¡PRIMERO ELIGE TU JUEGO!</h1>
        <p>
          Agrega un videojuego a tu biblioteca para
          empezar a registrar partidas.
        </p>
        <Link
          to="/videojuegos/nuevo"
          className="partida-enlace-principal"
        >
          + Agregar videojuego
        </Link>
      </div>
    );
  }

  return (
    <div className="nueva-partida-page">
      <Link
        to="/partidas"
        className="nueva-partida-volver"
      >
        ← Volver a mis partidas
      </Link>

      {/* ENCABEZADO */}

      <header className="nueva-partida-hero">
        <div>
          <span className="nueva-partida-etiqueta">
            ✳ CADA PARTIDA CUENTA
          </span>

          <h1>
            ¡SIGUE <span>SUBIENDO</span> DE NIVEL!
          </h1>

          <p>
            ¿Acabas de jugar? Registra tu sesión
            y sigue construyendo tu historia gamer.
          </p>
        </div>

        <div
          className="nueva-partida-hero-arte"
          aria-hidden="true"
        >
          <span>✦</span>
          <div>🎮</div>
          <strong>+1 PARTIDA</strong>
        </div>
      </header>

      <div className="nueva-partida-layout">
        <form
          className="nueva-partida-form"
          onSubmit={manejarEnvio}
        >
          {/* VIDEOJUEGO */}

          <section className="partida-bloque">
            <div className="partida-bloque-titulo">
              <span className="partida-numero">01</span>
              <div>
                <h2>¿QUÉ JUGASTE?</h2>
                <p>Selecciona el videojuego.</p>
              </div>
            </div>

            <label htmlFor="partida-videojuego">
              Mi videojuego
            </label>

            <select
              id="partida-videojuego"
              required
              value={form.videojuego}
              onChange={(e) =>
                setForm((actual) => ({
                  ...actual,
                  videojuego: e.target.value,
                }))
              }
            >
              <option value="">Seleccionar videojuego</option>

              {videojuegos.map((juego) => (
                <option key={juego._id} value={juego._id}>
                  {juego.titulo}
                </option>
              ))}
            </select>
          </section>

          {/* FECHA */}

          <section className="partida-bloque">
            <div className="partida-bloque-titulo">
              <span className="partida-numero">02</span>
              <div>
                <h2>¿CUÁNDO JUGASTE?</h2>
                <p>Usa la hora actual o elige otra.</p>
              </div>
            </div>

            <label htmlFor="partida-fecha">
              Fecha y hora de la sesión
            </label>

            <div className="partida-fecha-fila">
              <input
                id="partida-fecha"
                type="datetime-local"
                required
                value={form.fecha}
                onChange={(e) =>
                  setForm((actual) => ({
                    ...actual,
                    fecha: e.target.value,
                  }))
                }
              />

              <button
                type="button"
                className="partida-boton-secundario"
                onClick={() =>
                  setForm((actual) => ({
                    ...actual,
                    fecha: fechaActualLocal(),
                  }))
                }
              >
                Ahora
              </button>
            </div>
          </section>

          {/* DURACIÓN */}

          <section className="partida-bloque">
            <div className="partida-bloque-titulo">
              <span className="partida-numero">03</span>
              <div>
                <h2>¿CUÁNTO TIEMPO?</h2>
                <p>Escribe los minutos o usa los botones rápidos.</p>
              </div>
            </div>

            <label htmlFor="partida-duracion">
              Duración en minutos
            </label>

            <div className="partida-duracion-control">
              <button
                type="button"
                aria-label="Restar 15 minutos"
                onClick={() => sumarMinutos(-15)}
              >
                −15
              </button>

              <input
                id="partida-duracion"
                type="number"
                required
                min="1"
                step="1"
                value={form.duracionMinutos}
                onChange={(e) =>
                  setForm((actual) => ({
                    ...actual,
                    duracionMinutos: Number(e.target.value),
                  }))
                }
              />

              <span>min</span>

              <button
                type="button"
                aria-label="Sumar 15 minutos"
                onClick={() => sumarMinutos(15)}
              >
                +15
              </button>
            </div>

            <div className="partida-atajos">
              {[15, 30, 60].map((minutos) => (
                <button
                  key={minutos}
                  type="button"
                  onClick={() => sumarMinutos(minutos)}
                >
                  +{minutos} min
                </button>
              ))}
            </div>

            <p className="partida-ayuda">
              Tiempo registrado:{" "}
              <strong>
                {Number.isFinite(form.duracionMinutos)
                  ? `${Math.floor(form.duracionMinutos / 60)} h ${
                      form.duracionMinutos % 60
                    } min`
                  : "—"}
              </strong>
            </p>
          </section>

          {/* PORCENTAJE */}

          <section className="partida-bloque">
            <div className="partida-bloque-titulo">
              <span className="partida-numero">04</span>
              <div>
                <h2>¿HASTA DÓNDE LLEGASTE?</h2>
                <p>
                  Indica tu avance total después de esta sesión.
                </p>
              </div>
            </div>

            <div className="partida-avance-cabecera">
              <label htmlFor="partida-avance">
                Progreso alcanzado
              </label>

              <strong>{form.porcentajeAvance}%</strong>
            </div>

            <div
              className="partida-barra"
              aria-hidden="true"
            >
              <div
                style={{
                  width: `${limitarPorcentaje(
                    Number.isFinite(form.porcentajeAvance)
                      ? form.porcentajeAvance
                      : 0
                  )}%`,
                }}
              />
            </div>

            <input
              id="partida-avance"
              className="partida-deslizador"
              type="range"
              min="0"
              max="100"
              step="1"
              value={form.porcentajeAvance}
              onChange={(e) =>
                cambiarPorcentaje(Number(e.target.value))
              }
            />

            <div className="partida-porcentajes">
              {[0, 25, 50, 75, 100].map((valor) => (
                <button
                  key={valor}
                  type="button"
                  aria-pressed={form.porcentajeAvance === valor}
                  className={
                    form.porcentajeAvance === valor
                      ? "seleccionado"
                      : ""
                  }
                  onClick={() => cambiarPorcentaje(valor)}
                >
                  {valor}%
                </button>
              ))}
            </div>

          </section>

          {errorGuardar && (
            <p
              className="partida-error"
              role="alert"
            >
              {errorGuardar}
            </p>
          )}

          <div className="partida-acciones">
            <Link to="/partidas">
              Cancelar
            </Link>

            <button
              className="partida-guardar"
              type="submit"
              disabled={guardando}
            >
              {guardando
                ? "Guardando..."
                : "¡Guardar mi partida! ↗"}
            </button>
          </div>
        </form>

        {/* RESUMEN EN TIEMPO REAL */}

        <aside className="nueva-partida-aside">
          <div className="partida-resumen">
            <span>✳ RESUMEN DE TU SESIÓN</span>

            <div className="partida-resumen-icono" aria-hidden="true">
  <img
    src={
      juegoSeleccionado?.imagen ||
      "/images/game-placeholder.png"
    }
    alt=""
    className="partida-resumen-imagen"
    onError={(e) => {
      e.currentTarget.onerror = null;
      e.currentTarget.src = "/images/game-placeholder.png";
    }}
  />
</div>

            <h3>
              {juegoSeleccionado?.titulo ??
                "Selecciona tu juego"}
            </h3>

            <div className="partida-resumen-dato">
              <span>Tiempo</span>
              <strong>{form.duracionMinutos} min</strong>
            </div>

            <div className="partida-resumen-dato">
              <span>Progreso</span>
              <strong>{form.porcentajeAvance}%</strong>
            </div>

            <div className="partida-resumen-barra">
              <div
                style={{
                  width: `${limitarPorcentaje(
                    Number.isFinite(form.porcentajeAvance)
                      ? form.porcentajeAvance
                      : 0
                  )}%`,
                }}
              />
            </div>

            <p>
              Al guardar, esta sesión aparecerá en
              tu historial y se actualizarán tus estadísticas.
            </p>
          </div>

          <div className="partida-consejo">
            <span aria-hidden="true">★</span>
            <h3>¡UN PASO MÁS!</h3>
            <p>
              El porcentaje representa cuánto llevas
              completado del juego, no cuánto avanzaste
              solamente hoy.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
