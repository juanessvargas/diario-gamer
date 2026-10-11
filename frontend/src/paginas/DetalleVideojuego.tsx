
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

export function DetalleVideojuego() {
  const { id } = useParams<{ id: string }>();

  const [videojuego, setVideojuego] = useState<Videojuego | null>(null);
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [resumen, setResumen] = useState<ResumenVideojuego | null>(null);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [actualizando, setActualizando] = useState(false);

  useEffect(() => {
    async function cargarDetalle() {
      if (!id) {
        setError("ID de videojuego no válido");
        setCargando(false);
        return;
      }

      try {
        setCargando(true);
        setError("");

        const [datosVideojuego, datosPartidas, datosResumen] =
          await Promise.all([
            obtenerVideojuego(id),
            obtenerPartidasVideojuego(id),
            obtenerResumenVideojuego(id),
          ]);

        setVideojuego(datosVideojuego);
        setPartidas(datosPartidas);
        setResumen(datosResumen);
      } catch {
        setError("No se pudo cargar el detalle del videojuego");
      } finally {
        setCargando(false);
      }
    }

    cargarDetalle();
  }, [id]);

  async function cambiarLogro(logroId: string, obtenido: boolean) {
    if (!id) return;

    try {
      setActualizando(true);
      setError("");

      const videojuegoActualizado = await actualizarLogro(
        id,
        logroId,
        obtenido
      );

      setVideojuego(videojuegoActualizado);
    } catch {
      setError("No se pudo actualizar el logro");
    } finally {
      setActualizando(false);
    }
  }

  if (cargando) return <p>Cargando videojuego...</p>;

  if (error && !videojuego) return <p>{error}</p>;

  if (!videojuego) return <p>Videojuego no encontrado.</p>;

  return (
    <div>
      <Link to="/videojuegos">Volver a videojuegos</Link>

      <h1>{videojuego.titulo}</h1>

      <p>Género: {videojuego.genero}</p>
      <p>Plataforma: {videojuego.plataforma}</p>
      <p>Estado: {videojuego.estado}</p>
      <p>Calificación: {videojuego.calificacion ?? "Sin calificar"}</p>

      <Link to={`/videojuegos/${id}/editar`}>
        Editar videojuego
      </Link>

      <hr />

      <h2>Resumen de progreso</h2>

      {resumen ? (
        <div>
          <p>Partidas registradas: {resumen.totalPartidas}</p>
          <p>Horas jugadas: {resumen.horasTotales}</p>
          <p>Avance actual: {resumen.porcentajeAvance}%</p>
          <p>
            Última sesión:{" "}
            {resumen.ultimaSesion
              ? new Date(resumen.ultimaSesion).toLocaleString("es-EC")
              : "Sin partidas"}
          </p>
        </div>
      ) : (
        <p>No hay resumen disponible.</p>
      )}

      <hr />

      <h2>Logros</h2>

      {error && <p>{error}</p>}

      {videojuego.logros.length === 0 ? (
        <p>Este videojuego no tiene logros registrados.</p>
      ) : (
        <ul>
          {videojuego.logros.map((logro) => (
            <li key={logro._id}>
              <label>
                <input
                  type="checkbox"
                  checked={logro.obtenido}
                  disabled={actualizando}
                  onChange={(e) =>
                    cambiarLogro(logro._id, e.target.checked)
                  }
                />
                {logro.nombre}
              </label>
            </li>
          ))}
        </ul>
      )}

      <hr />

      <h2>Historial de partidas</h2>

      <Link to={`/partidas/nueva?videojuego=${id}`}>
        Registrar nueva partida
      </Link>

      {partidas.length === 0 ? (
        <p>Todavía no hay partidas registradas.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Duración</th>
              <th>Avance</th>
            </tr>
          </thead>
          <tbody>
            {partidas.map((partida) => (
              <tr key={partida._id}>
                <td>
                  {new Date(partida.fecha).toLocaleString("es-EC")}
                </td>
                <td>{partida.duracionMinutos} min</td>
                <td>{partida.porcentajeAvance}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
