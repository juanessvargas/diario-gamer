# 🎮 PLAYLOG!

### Tu progreso merece su propia historia.

**PLAYLOG!** es una aplicación web full stack para gestionar una biblioteca personal de videojuegos, registrar sesiones de juego, consultar avances y llevar el control de logros.

El proyecto fue desarrollado con **React, TypeScript, Node.js, Express y MongoDB**, como parte de un ejercicio académico de desarrollo web.

## ✨ Funcionalidades

- **Biblioteca personal:** agregar, visualizar, editar, filtrar y eliminar videojuegos.
- **Catálogo RAWG:** buscar videojuegos y seleccionar imágenes para sus portadas.
- **Seguimiento de progreso:** registrar sesiones con fecha, duración y porcentaje de avance.
- **Resumen por videojuego:** visualizar sesiones, tiempo acumulado y progreso actual.
- **Gestión de logros:** agregar logros y marcar cuáles se han obtenido.
- **Historial de partidas:** consultar y eliminar sesiones registradas.
- **Diseño responsive:** interfaz adaptada a computadoras, tablets y celulares, con navegación móvil.

## 🛠️ Tecnologías

| Frontend | Backend | Base de datos |
|---|---|---|
| React | Node.js | MongoDB Atlas |
| TypeScript | Express | Mongoose |
| Vite | TypeScript | |
| React Router | API REST | |

**Servicios externos:** [RAWG Video Games Database](https://rawg.io/), utilizado para consultar títulos e imágenes de videojuegos.

## 📁 Estructura del proyecto

```text
diario-gamer/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── modelos/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── app.ts
│   │   ├── conexionDB.ts
│   │   └── index.ts
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── public/
│   │   └── images/
│   ├── src/
│   │   ├── api/
│   │   ├── paginas/
│   │   ├── App.tsx
│   │   ├── responsive.css
│   │   └── tipos.ts
│   └── package.json
└── README.md
```

## 🧩 Modelos de datos

### Videojuego

Almacena la información principal de cada título:

- `titulo`: nombre del videojuego.
- `imagen`: URL opcional de la portada.
- `genero`: género del videojuego.
- `plataforma`: plataforma utilizada.
- `estado`: pendiente, jugando, completado o abandonado.
- `calificacion`: valoración opcional de 0 a 10.
- `logros`: arreglo de subdocumentos con nombre y estado de obtención.
- `createdAt` y `updatedAt`: marcas de tiempo.

### Partida

Representa una sesión de juego individual:

- `videojuego`: referencia al videojuego mediante `ObjectId`.
- `fecha`: fecha de la sesión.
- `duracionMinutos`: tiempo jugado.
- `porcentajeAvance`: avance registrado, entre 0 y 100.
- Marcas de tiempo del documento.

### Decisiones de modelado

**Logros embebidos:** los logros pertenecen directamente a un videojuego. Se almacenan como subdocumentos porque normalmente se consultan y actualizan dentro