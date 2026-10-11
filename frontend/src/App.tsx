
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

import { ListaVideojuegos } from "./paginas/ListaVideojuegos";
import { DetalleVideojuego } from "./paginas/DetalleVideojuego";
import { FormularioVideojuego } from "./paginas/FormularioVideojuego";
import { ListaPartidas } from "./paginas/ListaPartidas";

export default function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Inicio</Link>
        {" | "}
        <Link to="/videojuegos">Videojuegos</Link>
        {" | "}
<Link to="/partidas">Partidas</Link>
      </nav>

      <hr />

      <Routes>
        <Route path="/" element={<ListaVideojuegos />} />
        <Route path="/videojuegos" element={<ListaVideojuegos />} />
        <Route path="/videojuegos/nuevo" element={<FormularioVideojuego />} />
        <Route path="/videojuegos/:id/editar" element={<FormularioVideojuego />} />
        <Route path="/videojuegos/:id" element={<DetalleVideojuego />} />
        <Route path="/partidas" element={<ListaPartidas />} />
      </Routes>
    </BrowserRouter>
  );
}
