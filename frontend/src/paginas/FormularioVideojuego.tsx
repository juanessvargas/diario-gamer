
import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";

import {
  obtenerVideojuego,
  crearVideojuego,
  actualizarVideojuego,
} from "../api/videojuegosApi";

import type { NuevoVideojuego } from "../tipos";

export function FormularioVideojuego() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const esEdicion = Boolean(id);

  const [form, setForm] = useState<NuevoVideojuego>({
    titulo: "",
    genero: "aventura",
    plataforma: "PC",
    estado: "pendiente",
    logros: [],
  });

  const [nuevoLogro, setNuevoLogro] = useState("");
  const [cargando, setCargando] = useState(Boolean(id));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    async function cargarVideojuego() {
      try {
        setCargando(true);
        setError("");

        const videojuego = await obtenerVideojuego(id!);

        setForm({
          titulo: videojuego.titulo,
          genero: videojuego.genero,
          plataforma: videojuego.plataforma,
          estado: videojuego.estado,
          calificacion: videojuego.calificacion,
          logros: videojuego.logros.map((logro) => ({
            _id: logro._id,
            nombre: logro.nombre,
            obtenido: logro.obtenido,
          })),
        });
      } catch {
        setError("No se pudo cargar el videojuego");
      } finally {
        setCargando(false);
      }
    }

    cargarVideojuego();
  }, [id]);

  function agregarLogro() {
    if (!nuevoLogro.trim()) return;

    setForm({
      ...form,
      logros: [
        ...form.logros,
        {
          nombre: nuevoLogro.trim(),
          obtenido: false,
        },
      ],
    });

    setNuevoLogro("");
  }

  function eliminarLogro(indice: number) {
    setForm({
      ...form,
      logros: form.logros.filter((_, i) => i !== indice),
    });
  }

  async function manejarEnvio(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    try {
      setGuardando(true);
      setError("");

      if (esEdicion && id) {
        await actualizarVideojuego(id, form);
        navigate(`/videojuegos/${id}`);
      } else {
        const videojuego = await crearVideojuego(form);
        navigate(`/videojuegos/${videojuego._id}`);
      }
    } catch {
      setError("No se pudo guardar el videojuego");
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return <p>Cargando videojuego...</p>;
  }

  return (
    <div>
      <Link to="/videojuegos">
        Volver a videojuegos
      </Link>

      <h1>
        {esEdicion ? "Editar videojuego" : "Nuevo videojuego"}
      </h1>

      {error && <p>{error}</p>}

      <form onSubmit={manejarEnvio}>
        <div>
          <label>Título</label>
          <input
            required
            value={form.titulo}
            onChange={(e) =>
              setForm({
                ...form,
                titulo: e.target.value,
              })
            }
          />
        </div>

        <div>
          <label>Género</label>
          <select
            value={form.genero}
            onChange={(e) =>
              setForm({
                ...form,
                genero: e.target.value,
              })
            }
          >
            <option value="accion">Acción</option>
            <option value="aventura">Aventura</option>
            <option value="rol">Rol</option>
            <option value="deportes">Deportes</option>
            <option value="estrategia">Estrategia</option>
            <option value="simulacion">Simulación</option>
            <option value="otros">Otros</option>
          </select>
        </div>

        <div>
          <label>Plataforma</label>
          <select
            value={form.plataforma}
            onChange={(e) =>
              setForm({
                ...form,
                plataforma: e.target.value,
              })
            }
          >
            <option value="PC">PC</option>
            <option value="PlayStation">PlayStation</option>
            <option value="Xbox">Xbox</option>
            <option value="Nintendo Switch">
              Nintendo Switch
            </option>
            <option value="Movil">Móvil</option>
            <option value="Otra">Otra</option>
          </select>
        </div>

        <div>
          <label>Estado</label>
          <select
            value={form.estado}
            onChange={(e) =>
              setForm({
                ...form,
                estado: e.target.value,
              })
            }
          >
            <option value="pendiente">Pendiente</option>
            <option value="jugando">Jugando</option>
            <option value="completado">Completado</option>
            <option value="abandonado">Abandonado</option>
          </select>
        </div>

        <div>
          <label>Calificación (0-10)</label>
          <input
            type="number"
            min="0"
            max="10"
            value={form.calificacion ?? ""}
            onChange={(e) =>
              setForm({
                ...form,
                calificacion:
                  e.target.value === ""
                    ? undefined
                    : Number(e.target.value),
              })
            }
          />
        </div>

        <h2>Logros</h2>

        <input
          value={nuevoLogro}
          placeholder="Nombre del logro"
          onChange={(e) =>
            setNuevoLogro(e.target.value)
          }
        />

        <button
          type="button"
          onClick={agregarLogro}
        >
          Agregar logro
        </button>

        <ul>
          {form.logros.map((logro, indice) => (
            <li key={logro._id ?? indice}>
              {logro.nombre}{" "}

              <button
                type="button"
                onClick={() => eliminarLogro(indice)}
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>

        <button
          type="submit"
          disabled={guardando}
        >
          {guardando
            ? "Guardando..."
            : "Guardar videojuego"}
        </button>
      </form>
    </div>
  );
}
