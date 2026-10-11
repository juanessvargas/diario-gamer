
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { ListaVideojuegos } from "./paginas/ListaVideojuegos";

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
      </Routes>
    </BrowserRouter>
  );
}
