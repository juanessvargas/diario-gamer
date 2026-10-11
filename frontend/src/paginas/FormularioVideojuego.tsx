
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  obtenerVideojuego,
  crearVideojuego,
  actualizarVideojuego,
} from "../api/videojuegosApi";

import { buscarJuegosCatalogo } from "../api/catalogoApi";

import type {
  NuevoVideojuego,
  JuegoCatalogo,
} from "../tipos";

import "./FormularioVideojuego.css";

const generos = [
  { valor: "accion", nombre: "Acción" },
  { valor: "aventura", nombre: "Aventura" },
  { valor: "rol", nombre: "Rol" },
  { valor: "deportes", nombre: "Deportes" },
  { valor: "estrategia", nombre: "Estrategia" },
  { valor: "simulacion", nombre: "Simulación" },
  { valor: "otros", nombre: "Otros" },
];

const plataformas = [
  "PC",
  "PlayStation",
  "Xbox",
  "Nintendo Switch",
  "Movil",
  "Otra",
];

const estados = [
  { valor: "pendiente", nombre: "Pendiente", icono: "◷" },
  { valor: "jugando", nombre: "Jugando", icono: "▶" },
  { valor: "completado", nombre: "Completado", icono: "★" },
  { valor: "abandonado", nombre: "Abandonado", icono: "✕" },
];

const imagenGenerica = "/images/game-placeholder.png";

export function FormularioVideojuego() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const esEdicion = Boolean(id);

  const [form, setForm] = useState<NuevoVideojuego>({
    titulo: "",
    genero: "aventura",
    plataforma: "PC",
    estado: "pendiente",
    imagen: null,
    logros: [],
  });

  const [nuevoLogro, setNuevoLogro] = useState("");

  const [cargando, setCargando] = useState(Boolean(id));
  const [errorCarga, setErrorCarga] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState("");

  // Búsqueda de videojuegos en RAWG
  const [busquedaCatalogo, setBusquedaCatalogo] = useState("");
  const [resultadosCatalogo, setResultadosCatalogo] =
    useState<JuegoCatalogo[]>([]);
  const [buscandoCatalogo, setBuscandoCatalogo] = useState(false);
  const [errorCatalogo, setErrorCatalogo] = useState("");
  const [busquedaRealizada, setBusquedaRealizada] = useState(false);

  // Cargar datos cuando editamos un videojuego
  useEffect(() => {
    if (!id) return;

    let activo = true;

    async function cargarVideojuego() {
      try {
        setCargando(true);
        setErrorCarga("");

        const videojuego = await obtenerVideojuego(id!);

        if (!activo) return;

        setForm({
          titulo: videojuego.titulo,
          genero: videojuego.genero,
          plataforma: videojuego.plataforma,
          estado: videojuego.estado,
          calificacion: videojuego.calificacion,
          imagen: videojuego.imagen ?? null,
          logros: videojuego.logros.map((logro) => ({
            _id: logro._id,
            nombre: logro.nombre,
            obtenido: logro.obtenido,
          })),
        });

        setBusquedaCatalogo(videojuego.titulo);
      } catch {
        if (activo) {
          setErrorCarga("No pudimos cargar este videojuego.");
        }
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    }

    cargarVideojuego();

    return () => {
      activo = false;
    };
  }, [id]);

  // Buscar imágenes y videojuegos reales
  async function buscarPortadas() {
    const nombre = busquedaCatalogo.trim();

    if (nombre.length < 2) {
      setErrorCatalogo(
        "Escribe al menos 2 caracteres para buscar."
      );
      setResultadosCatalogo([]);
      setBusquedaRealizada(false);
      return;
    }

    try {
      setBuscandoCatalogo(true);
      setErrorCatalogo("");
      setResultadosCatalogo([]);
      setBusquedaRealizada(false);

      const resultados = await buscarJuegosCatalogo(nombre);

      setResultadosCatalogo(resultados);
      setBusquedaRealizada(true);
    } catch {
      setErrorCatalogo(
        "No pudimos buscar las portadas. Inténtalo nuevamente."
      );
    } finally {
      setBuscandoCatalogo(false);
    }
  }

  // Elegir un resultado del catálogo
  function seleccionarJuego(juego: JuegoCatalogo) {
    setForm((actual) => ({
      ...actual,
      titulo: juego.nombre,
      imagen: juego.imagen,
    }));

    setBusquedaCatalogo(juego.nombre);
    setResultadosCatalogo([]);
    setBusquedaRealizada(false);
    setErrorCatalogo("");
  }

  // Cambiar título manualmente sin mantener una portada incorrecta
  function cambiarTitulo(titulo: string) {
    setForm((actual) => ({
      ...actual,
      titulo,
      imagen:
        titulo === actual.titulo
          ? actual.imagen
          : null,
    }));
  }

  function agregarLogro() {
    const nombre = nuevoLogro.trim();

    if (!nombre) return;

    setForm((actual) => ({
      ...actual,
      logros: [
        ...actual.logros,
        {
          nombre,
          obtenido: false,
        },
      ],
    }));

    setNuevoLogro("");
  }

  function eliminarLogro(indice: number) {
    setForm((actual) => ({
      ...actual,
      logros: actual.logros.filter(
        (_, i) => i !== indice
      ),
    }));
  }

  async function manejarEnvio(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (guardando) return;

    setErrorGuardar("");

    if (!form.titulo.trim()) {
      setErrorGuardar("Escribe el nombre del videojuego.");
      return;
    }

    try {
      setGuardando(true);

      const datos: NuevoVideojuego = {
        ...form,
        titulo: form.titulo.trim(),
      };

      if (id) {
        await actualizarVideojuego(id, datos);
        navigate(`/videojuegos/${id}`);
      } else {
        const videojuego = await crearVideojuego(datos);
        navigate(`/videojuegos/${videojuego._id}`);
      }
    } catch {
      setErrorGuardar(
        "No pudimos guardar el videojuego. Revisa los datos e inténtalo nuevamente."
      );
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <div className="form-juego-estado" role="status">
        <span aria-hidden="true">✳</span>
        <h1>CARGANDO...</h1>
        <p>Preparando tu videojuego.</p>
      </div>
    );
  }

  if (errorCarga) {
    return (
      <div className="form-juego-estado" role="alert">
        <span aria-hidden="true">!</span>
        <h1>ALGO SALIÓ MAL</h1>
        <p>{errorCarga}</p>

        <Link
          to="/videojuegos"
          className="form-juego-volver"
        >
          ← Volver a mis juegos
        </Link>
      </div>
    );
  }

  return (
    <div className="form-juego-page">
      <Link
        to="/videojuegos"
        className="form-juego-volver"
      >
        ← Volver a mis juegos
      </Link>

      {/* ENCABEZADO */}

      <header className="form-juego-hero">
        <div className="form-juego-hero-texto">
          <span className="form-juego-eyebrow">
            ✳ {esEdicion
              ? "AJUSTA TU AVENTURA"
              : "UNA NUEVA AVENTURA"}
          </span>

          <h1>
            {esEdicion ? (
              <>
                ¡SIGUE <span>JUGANDO!</span>
              </>
            ) : (
              <>
                ¡SUMA OTRO <span>JUEGO!</span>
              </>
            )}
          </h1>

          <p>
            {esEdicion
              ? "Actualiza los detalles de tu videojuego y sigue registrando tu historia."
              : "Agrégalo a tu biblioteca, elige tu estado y empieza a llevar tu progreso."}
          </p>
        </div>

        <div
          className="form-juego-hero-arte"
          aria-hidden="true"
        >
          <div className="form-juego-hero-simbolo">
            <img
              src="/images/playlog-mascot.png"
              alt=""
              className="form-juego-mascota"
            />
          </div>

          <span className="form-juego-hero-sello">
            ¡A JUGAR!
          </span>
        </div>
      </header>

      <div className="form-juego-layout">
        <form
          className="form-juego-formulario"
          onSubmit={manejarEnvio}
        >
          {/* SECCIÓN 1 */}

          <div className="form-juego-seccion">
            <div className="form-juego-seccion-cabecera">
              <span className="form-juego-numero">01</span>

              <div>
                <h2>¿QUÉ VAS A JUGAR?</h2>
                <p>Empecemos con lo básico.</p>
              </div>
            </div>

            <div className="form-juego-campo">
              <label htmlFor="juego-titulo">
                Nombre del videojuego *
              </label>

              <input
                id="juego-titulo"
                type="text"
                required
                maxLength={120}
                placeholder="Ej. Minecraft"
                value={form.titulo}
                onChange={(e) =>
                  cambiarTitulo(e.target.value)
                }
              />
            </div>

            {/* BUSCADOR RAWG */}

            <div className="catalogo-buscador">
              <label htmlFor="buscar-catalogo">
                ¿Quieres una portada real?
              </label>

              <p>
                Busca tu videojuego y selecciona
                la versión correcta.
              </p>

              <div className="catalogo-buscador-fila">
                <input
                  id="buscar-catalogo"
                  type="search"
                  placeholder="Minecraft, Hollow Knight..."
                  value={busquedaCatalogo}
                  onChange={(e) => {
                    setBusquedaCatalogo(e.target.value);
                    setResultadosCatalogo([]);
                    setBusquedaRealizada(false);
                    setErrorCatalogo("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void buscarPortadas();
                    }
                  }}
                />

                <button
                  type="button"
                  onClick={buscarPortadas}
                  disabled={buscandoCatalogo}
                >
                  {buscandoCatalogo
                    ? "Buscando..."
                    : "Buscar portada"}
                </button>
              </div>

              {errorCatalogo && (
                <p
                  className="catalogo-error"
                  role="alert"
                >
                  {errorCatalogo}
                </p>
              )}

              {buscandoCatalogo && (
                <p role="status">
                  Buscando videojuegos...
                </p>
              )}

              {busquedaRealizada &&
                resultadosCatalogo.length === 0 && (
                  <p role="status">
                    No encontramos videojuegos con ese nombre.
                    Prueba con otro título.
                  </p>
                )}

              {resultadosCatalogo.length > 0 && (
                <div className="catalogo-resultados">
                  {resultadosCatalogo.map((juego) => (
                    <button
                      type="button"
                      key={juego.id}
                      className="catalogo-resultado"
                      onClick={() =>
                        seleccionarJuego(juego)
                      }
                    >
                      <img
                        src={
                          juego.imagen ||
                          imagenGenerica
                        }
                        alt=""
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src =
                            imagenGenerica;
                        }}
                      />

                      <span>
                        <strong>{juego.nombre}</strong>
                        <small>
                          {juego.lanzamiento
                            ? `Lanzamiento: ${juego.lanzamiento.slice(0, 4)}`
                            : "Año no disponible"}
                        </small>
                      </span>

                      <span aria-hidden="true">↗</span>
                    </button>
                  ))}
                </div>
              )}

              {form.imagen && (
                <div className="catalogo-seleccionado">
                  <img
                    src={form.imagen}
                    alt=""
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src =
                        imagenGenerica;
                    }}
                  />

                  <div>
                    <strong>
                      ¡Portada seleccionada!
                    </strong>

                    <p>
                      Se guardará con tu videojuego.
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        setForm((actual) => ({
                          ...actual,
                          imagen: null,
                        }))
                      }
                    >
                      Quitar portada
                    </button>
                  </div>
                </div>
              )}

              <a
                className="catalogo-atribucion"
                href="https://rawg.io/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Información e imágenes proporcionadas por RAWG ↗
              </a>
            </div>

            <div className="form-juego-dos-columnas">
              <div className="form-juego-campo">
                <label htmlFor="juego-genero">
                  Género
                </label>

                <select
                  id="juego-genero"
                  value={form.genero}
                  onChange={(e) =>
                    setForm((actual) => ({
                      ...actual,
                      genero: e.target.value,
                    }))
                  }
                >
                  {generos.map((genero) => (
                    <option
                      key={genero.valor}
                      value={genero.valor}
                    >
                      {genero.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-juego-campo">
                <label htmlFor="juego-plataforma">
                  Plataforma
                </label>

                <select
                  id="juego-plataforma"
                  value={form.plataforma}
                  onChange={(e) =>
                    setForm((actual) => ({
                      ...actual,
                      plataforma: e.target.value,
                    }))
                  }
                >
                  {plataformas.map((plataforma) => (
                    <option
                      key={plataforma}
                      value={plataforma}
                    >
                      {plataforma === "Movil"
                        ? "Móvil"
                        : plataforma}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2 */}

          <div className="form-juego-seccion">
            <div className="form-juego-seccion-cabecera">
              <span className="form-juego-numero">02</span>

              <div>
                <h2>¿EN QUÉ VAS?</h2>
                <p>
                  Elige el estado que mejor describa
                  tu partida.
                </p>
              </div>
            </div>

            <fieldset className="form-juego-estados">
              <legend className="form-juego-sr-only">
                Estado del videojuego
              </legend>

              {estados.map((estado) => (
                <label
                  key={estado.valor}
                  className={`form-juego-estado-opcion ${
                    form.estado === estado.valor
                      ? "activo"
                      : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="estado"
                    value={estado.valor}
                    checked={
                      form.estado === estado.valor
                    }
                    onChange={() =>
                      setForm((actual) => ({
                        ...actual,
                        estado: estado.valor,
                      }))
                    }
                  />

                  <span aria-hidden="true">
                    {estado.icono}
                  </span>

                  <strong>{estado.nombre}</strong>
                </label>
              ))}
            </fieldset>
          </div>

          {/* SECCIÓN 3 */}

          <div className="form-juego-seccion">
            <div className="form-juego-seccion-cabecera">
              <span className="form-juego-numero">03</span>

              <div>
                <h2>¿CUÁNTO TE GUSTA?</h2>
                <p>
                  Tu calificación personal.
                  Es opcional.
                </p>
              </div>
            </div>

            <div className="form-juego-calificacion">
              <div className="form-juego-calificacion-superior">
                <label htmlFor="juego-calificacion">
                  Calificación
                </label>

                <strong>
                  {form.calificacion === undefined ||
                  form.calificacion === null
                    ? "SIN CALIFICAR"
                    : `${form.calificacion}/10`}
                </strong>
              </div>

              <input
                id="juego-calificacion"
                type="range"
                min="0"
                max="10"
                step="1"
                value={form.calificacion ?? 0}
                onChange={(e) =>
                  setForm((actual) => ({
                    ...actual,
                    calificacion: Number(
                      e.target.value
                    ),
                  }))
                }
              />

              <div className="form-juego-calificacion-extremos">
                <span>0 · Nada</span>
                <span>10 · ¡Me encanta!</span>
              </div>

              <button
                type="button"
                className="form-juego-quitar-calificacion"
                onClick={() =>
                  setForm((actual) => ({
                    ...actual,
                    calificacion: undefined,
                  }))
                }
              >
                Quitar calificación
              </button>
            </div>
          </div>

          {/* SECCIÓN 4 */}

          <div className="form-juego-seccion">
            <div className="form-juego-seccion-cabecera">
              <span className="form-juego-numero">04</span>

              <div>
                <h2>MIS DESAFÍOS</h2>
                <p>
                  Agrega logros que quieras desbloquear.
                  Puedes saltarte esta parte.
                </p>
              </div>
            </div>

            <div className="form-juego-agregar-logro">
              <label htmlFor="nuevo-logro">
                Nuevo logro
              </label>

              <div className="form-juego-logro-input">
                <input
                  id="nuevo-logro"
                  type="text"
                  value={nuevoLogro}
                  placeholder="Ej. Derrotar al jefe final"
                  onChange={(e) =>
                    setNuevoLogro(e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      agregarLogro();
                    }
                  }}
                />

                <button
                  type="button"
                  onClick={agregarLogro}
                >
                  + Agregar
                </button>
              </div>
            </div>

            {form.logros.length > 0 ? (
              <ul className="form-juego-lista-logros">
                {form.logros.map((logro, indice) => (
                  <li key={logro._id ?? indice}>
                    <span className="form-juego-logro-estrella">
                      {logro.obtenido ? "★" : "☆"}
                    </span>

                    <div>
                      <strong>{logro.nombre}</strong>

                      <small>
                        {logro.obtenido
                          ? "Desbloqueado"
                          : "Por desbloquear"}
                      </small>
                    </div>

                    <button
                      type="button"
                      className="form-juego-eliminar-logro"
                      onClick={() =>
                        eliminarLogro(indice)
                      }
                      aria-label={`Eliminar logro ${logro.nombre}`}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="form-juego-sin-logros">
                ☆ Todavía no agregaste desafíos.
              </p>
            )}
          </div>

          {/* GUARDAR */}

          {errorGuardar && (
            <p
              className="form-juego-error"
              role="alert"
            >
              {errorGuardar}
            </p>
          )}

          <div className="form-juego-acciones">
            <Link
              to="/videojuegos"
              className="form-juego-cancelar"
            >
              Cancelar
            </Link>

            <button
              className="form-juego-guardar"
              type="submit"
              disabled={guardando}
            >
              {guardando
                ? "Guardando..."
                : esEdicion
                  ? "Guardar cambios ↗"
                  : "+ Crear videojuego ↗"}
            </button>
          </div>
        </form>

        {/* PANEL LATERAL */}

        <aside className="form-juego-aside">
          <div className="form-juego-preview">
            <span>VISTA PREVIA</span>

            <div
              className="form-juego-preview-icono"
              aria-hidden="true"
            >
              <img
                src={
                  form.imagen ||
                  imagenGenerica
                }
                alt=""
                className="form-juego-preview-imagen"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src =
                    imagenGenerica;
                }}
              />
            </div>

            <h3>
              {form.titulo.trim() ||
                "TU PRÓXIMO JUEGO"}
            </h3>

            <p>
              {form.plataforma === "Movil"
                ? "Móvil"
                : form.plataforma}{" "}
              ·{" "}
              {generos.find(
                (genero) =>
                  genero.valor === form.genero
              )?.nombre}
            </p>

            <div className="form-juego-preview-etiqueta">
              {estados.find(
                (estado) =>
                  estado.valor === form.estado
              )?.nombre}
            </div>
          </div>

          <div className="form-juego-ayuda">
            <span aria-hidden="true">✦</span>

            <h3>¡CADA JUEGO CUENTA!</h3>

            <p>
              Después de guardar, podrás registrar
              partidas, actualizar tu progreso
              y desbloquear logros.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
