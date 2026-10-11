
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { obtenerVideojuegos } from "../api/videojuegosApi";
import { crearPartida } from "../api/partidasApi";

import type { Videojuego, NuevaPartida as DatosNuevaPartida } from "../tipos";

export function NuevaPartida() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const videojuegoInicial = searchParams.get("videojuego") ?? "";

  const [videojuegos, setVideojuegos] = useState<Videojuego[]>([]);

  const [form, setForm] = useState<DatosNuevaPartida>({
    videojuego: videojuegoInicial,
    fecha: "",
    duracionMinutos: 60,
    porcentajeAvance: 0,
  });

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  // Obtener los videojuegos disponibles.
  useEffect(() => {
    async function cargarVideojuegos() {
      try {
        setCargando(true);
        setError("");

        const datos = await obtenerVideojuegos();
        setVideojuegos(datos);

        if (!videojuegoInicial && datos.length > 0) {
          setForm((anterior) => ({
            ...anterior,
            videojuego: datos[0]._id,
          }));
        }
      } catch {
        setError("No se pudieron cargar los videojuegos");
      } finally {
        setCargando(false);
      }
    }

    cargarVideojuegos();
  }, [videojuegoInicial]);

  async function manejarEnvio(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!form.videojuego) {
      setError("Selecciona un videojuego");
      return;
    }

    try {
      setGuardando(true);
      setError("");

      await crearPartida({
        ...form,
        fecha: new Date(form.fecha).toISOString(),
      });

      navigate(`/videojuegos/${form.videojuego}`);
    } catch {
      setError("No se pudo registrar la partida");
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return <p>Cargando videojuegos...</p>;
  }

  return (
    <div>
      <Link to="/partidas">Volver a partidas</Link>

      <h1>Registrar nueva partida</h1>

      {error && <p>{error}</p>}

      {videojuegos.length === 0 ? (
        <div>
          <p>No tienes videojuegos registrados.</p>
          <Link to="/videojuegos/nuevo">Crear videojuego</Link>
        </div>
      ) : (
        <form onSubmit={manejarEnvio}>
          <div>
            <label htmlFor="videojuego">Videojuego</label>

            <select
              id="videojuego"
              value={form.videojuego}
              required
              onChange={(e) =>
                setForm({ ...form, videojuego: e.target.value })
              }
            >
              <option value="">Selecciona un videojuego</option>

              {videojuegos.map((videojuego) => (
                <option key={videojuego._id} value={videojuego._id}>
                  {videojuego.titulo}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="fecha">Fecha y hora</label>

            <input
              id="fecha"
              type="datetime-local"
              required
              value={form.fecha}
              onChange={(e) =>
                setForm({ ...form, fecha: e.target.value })
              }
            />
          </div>

          <div>
            <label htmlFor="duracion">Duración (minutos)</label>

            <input
              id="duracion"
              type="number"
              required
              min="1"
              value={form.duracionMinutos}
              onChange={(e) =>
                setForm({
                  ...form,
                  duracionMinutos: Number(e.target.value),
                })
              }
            />
          </div>

          <div>
            <label htmlFor="avance">Porcentaje de avance</label>

            <input
              id="avance"
              type="number"
              required
              min="0"
              max="100"
              value={form.porcentajeAvance}
              onChange={(e) =>
                setForm({
                  ...form,
                  porcentajeAvance: Number(e.target.value),
                })
              }
            />
          </div>

          <button type="submit" disabled={guardando}>
            {guardando ? "Guardando..." : "Registrar partida"}
          </button>
        </form>
      )}
    </div>
  );
}
