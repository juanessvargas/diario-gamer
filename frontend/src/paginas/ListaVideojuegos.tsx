
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { obtenerVideojuegos } from "../api/videojuegosApi";
import type { Videojuego } from "../tipos";

export function ListaVideojuegos() {
  const [videojuegos, setVideojuegos] = useState<Videojuego[]>([]);
  const [estado, setEstado] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargarVideojuegos() {
      try {
        setCargando(true);
        setError("");

        const datos = await obtenerVideojuegos(estado);
        setVideojuegos(datos);
      } catch {
        setError("No se pudieron cargar los videojuegos");
      } finally {
        setCargando(false);
      }
    }

    cargarVideojuegos();
  }, [estado]);

  return (
    <div>
      <h1>Mi biblioteca gamer</h1>

      <p>Consulta los videojuegos que tienes registrados.</p>

      <Link to="/videojuegos/nuevo">
        Crear videojuego
      </Link>

      <h2>Mis videojuegos</h2>

      <label htmlFor="estado">Filtrar por estado: </label>

      <select
        id="estado"
        value={estado}
        onChange={(e) => setEstado(e.target.value)}
      >
        <option value="">Todos</option>
        <option value="pendiente">Pendiente</option>
        <option value="jugando">Jugando</option>
        <option value="completado">Completado</option>
        <option value="abandonado">Abandonado</option>
      </select>

      {cargando ? (
        <p>Cargando videojuegos...</p>
      ) : error ? (
        <p>{error}</p>
      ) : videojuegos.length === 0 ? (
        <p>No hay videojuegos registrados.</p>
      ) : (
        <ul>
          {videojuegos.map((videojuego) => (
            <li key={videojuego._id}>
              <h3>{videojuego.titulo}</h3>

              <p>Género: {videojuego.genero}</p>
              <p>Plataforma: {videojuego.plataforma}</p>
              <p>Estado: {videojuego.estado}</p>

              <Link to={`/videojuegos/${videojuego._id}`}>
                Ver detalle
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
