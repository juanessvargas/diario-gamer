
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { obtenerPartidas, eliminarPartida } from "../api/partidasApi";
import type { Partida } from "../tipos";

export function ListaPartidas() {
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargarPartidas() {
      try {
        setCargando(true);
        setError("");
        const datos = await obtenerPartidas();
        setPartidas(datos);
      } catch {
        setError("No se pudieron cargar las partidas");
      } finally {
        setCargando(false);
      }
    }

    cargarPartidas();
  }, []);

  async function borrarPartida(id: string) {
    if (!window.confirm("¿Seguro que deseas eliminar esta partida?")) {
      return;
    }

    try {
      setError("");
      await eliminarPartida(id);
      setPartidas(partidas.filter((partida) => partida._id !== id));
    } catch {
      setError("No se pudo eliminar la partida");
    }
  }

  if (cargando) return <p>Cargando partidas...</p>;
  if (error && partidas.length === 0) {
  return <p>{error}</p>;
}

  return (
    <div>
      <h1>Mis partidas</h1>

      <Link to="/partidas/nueva">Registrar nueva partida</Link>

      {error && <p>{error}</p>}

      {partidas.length === 0 ? (
        <p>No hay partidas registradas.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Videojuego</th>
              <th>Fecha</th>
              <th>Duración</th>
              <th>Avance</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {partidas.map((partida) => (
              <tr key={partida._id}>
                <td>
                  {typeof partida.videojuego === "string"
                    ? partida.videojuego
                    : partida.videojuego?.titulo ?? "Videojuego eliminado"}
                </td>
                <td>
                  {new Date(partida.fecha).toLocaleString("es-EC")}
                </td>
                <td>{partida.duracionMinutos} min</td>
                <td>{partida.porcentajeAvance}%</td>
                <td>
                  <button onClick={() => borrarPartida(partida._id)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
