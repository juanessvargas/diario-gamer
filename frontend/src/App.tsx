
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

import { ListaVideojuegos } from "./paginas/ListaVideojuegos";
import { DetalleVideojuego } from "./paginas/DetalleVideojuego";
import { FormularioVideojuego } from "./paginas/FormularioVideojuego";

export default function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">Inicio</Link>
        {" | "}
        <Link to="/videojuegos">Videojuegos</Link>
      </nav>

      <hr />

      <Routes>
        <Route path="/" element={<ListaVideojuegos />} />
        <Route path="/videojuegos" element={<ListaVideojuegos />} />
        <Route path="/videojuegos/nuevo" element={<FormularioVideojuego />} />
        <Route path="/videojuegos/:id/editar" element={<FormularioVideojuego />} />
        <Route path="/videojuegos/:id" element={<DetalleVideojuego />} />
      </Routes>
    </BrowserRouter>
  );
}
