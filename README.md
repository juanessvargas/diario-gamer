# 🎮 PLAYLOG! 2.0

### Tu progreso merece su propia historia.

**PLAYLOG!** es una aplicación web full stack para gestionar una biblioteca personal de videojuegos, registrar sesiones de juego, consultar avances y llevar el control de logros.

El proyecto fue desarrollado con **React, TypeScript, Node.js, Express y MongoDB**, como parte de un ejercicio académico de desarrollo web.

La épica **E2 · Metas y rachas** añade objetivos semanales por videojuego, constancia e hitos, conservando el diario del Proyecto 3. Estado de esta entrega local: **343 pruebas aprobadas, 0 fallos y 3 TODO de MongoDB real**. No se declara validación completa en Atlas ni despliegue de E2; consulta la [auditoría](docs/AUDITORIA.md) y la [checklist de entrega](docs/checklist-rubrica.md).

## ✨ Funcionalidades

- **Biblioteca personal:** agregar, visualizar, editar y filtrar videojuegos; eliminación disponible mediante API, sin botón nuevo de interfaz.
- **Catálogo RAWG:** buscar videojuegos y seleccionar imágenes para sus portadas.
- **Seguimiento de progreso:** registrar sesiones con fecha, duración y porcentaje de avance.
- **Resumen por videojuego:** visualizar sesiones, tiempo acumulado y progreso actual.
- **Gestión de logros:** agregar logros y marcar cuáles se han obtenido.
- **Historial de partidas:** consultar y eliminar sesiones registradas.
- **Diseño responsive:** interfaz adaptada a computadoras, tablets y celulares, con navegación móvil.

### E2: Metas y rachas

- Crear, consultar, editar y desactivar metas; una sola activa por videojuego, con historial de anteriores en la API.
- Horas semanales mayores que 0 y hasta 100; entre 1 y 7 días enteros; hasta cinco hitos con descripción y objetivo del 1 al 100 %.
- Progreso de lunes a domingo en `America/Guayaquil`: horas, días, racha actual, mejor racha e hitos desde el detalle del juego.
- Porcentaje de horas que puede superar 100 %, con barra visual limitada; cumplir requiere tanto horas como días.
- Confirmación al desactivar, estados de carga/error/vacío y nueva consulta al guardar metas o regresar de registrar/eliminar partidas.
- Eliminación de todas las metas e hitos al borrar su videojuego, conservando la cascada de partidas de P3; sin promesa de atomicidad.

Las partidas futuras no suman actividad ni rachas. Los hitos usan el avance del resumen original de P3, incluso si proviene de una partida futura. Las decisiones completas están en el [PRD](docs/prd/playlog-e2.md). No se añadieron gráficos históricos, rankings, notificaciones ni edición de partidas.

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
│   │   ├── dominio/
│   │   ├── middlewares/
│   │   ├── modelos/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── app.ts
│   │   ├── conexionDB.ts
│   │   └── index.ts
│   ├── .env.example
│   ├── package.json
│   ├── test/
│   └── tsconfig.json
├── frontend/
│   ├── public/
│   │   └── images/
│   ├── src/
│   │   ├── api/
│   │   ├── componentes/
│   │   ├── paginas/
│   │   ├── App.tsx
│   │   ├── responsive.css
│   │   └── tipos.ts
│   ├── test/
│   └── package.json
├── docs/
│   ├── backlog/
│   ├── prd/
│   ├── specs/
│   └── verificacion/
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

**Logros embebidos:** los logros pertenecen directamente a un videojuego. Se almacenan como subdocumentos porque normalmente se consultan y actualizan dentro de su ficha.

**Partidas referenciadas:** cada sesión tiene su propio registro e historial, vinculado al videojuego. El resumen P3 conserva cantidad de partidas, minutos totales divididos entre 60 y avance de la última sesión por `fecha`, con desempates por `createdAt` y `_id`.

**Meta referenciada e hitos embebidos:** Meta tiene ciclo de vida e historial propios; sus hitos son una lista acotada que desaparece con ella. `alcanzado` se calcula, no se guarda. El índice único parcial está declarado, pero su funcionamiento concurrente real sigue pendiente de MongoDB autorizado. Véase la [spec backend](docs/specs/01-backend-metas-progreso.md).

## Requisitos y ejecución local

Se verificó con **Node 24.19.0**. El enunciado exige Node 20 o superior; el Vite instalado declara `^20.19.0 || >=22.12.0`. El runner de navegador usa WebSocket global y Chrome en la ruta macOS indicada en [su helper](frontend/test/navegador.mjs); otras plataformas/versiones no se comprobaron.

Para ejecutar la aplicación necesitas MongoDB accesible y una configuración propia autorizada. RAWG requiere su clave solo para el catálogo. Los nombres siguientes se identificaron en los módulos de código; no se leyeron archivos de entorno ni se muestran valores:

| Variable | Componente y uso |
| --- | --- |
| `MONGODB_URI` | Backend: conexión obligatoria a MongoDB. |
| `MONGODB_DB` | Backend: nombre opcional de base. |
| `PORT` | Backend: puerto opcional. |
| `RAWG_API_KEY` | Backend: necesaria para buscar portadas en RAWG; no para los cálculos de E2. |
| `VITE_API_URL` | Frontend: base de la API; si falta en desarrollo se usan rutas relativas y el proxy de Vite. |

Configura esos nombres por tu cuenta o en el gestor de secretos del servicio, sin incluir credenciales en Git. La plantilla existente no se abrió ni se certificó en esta auditoría; su revisión sigue pendiente por la política restrictiva aceptada.

Instalación para una copia nueva, con los lockfiles existentes (no ejecutada en este cierre):

```sh
npm --prefix backend ci
npm --prefix frontend ci
```

En dos terminales, desde la raíz:

```sh
npm --prefix backend run dev
npm --prefix frontend run dev
```

El backend usa por defecto el puerto 3000 y el proxy de desarrollo apunta a `http://localhost:3000`. Si eliges otro puerto, ajusta la conexión del frontend. Vite informa su URL local al arrancar. `npm --prefix` ejecuta cada script en su paquete; el backend carga su configuración al iniciar. El arranque contra una base real no se ejecutó en esta entrega.

Compilación y ejecución de los artefactos:

```sh
npm --prefix backend run build
npm --prefix backend run start
npm --prefix frontend run build
npm --prefix frontend run preview
```

`start` requiere la base/configuración y `preview` sirve el frontend compilado. Configura la API apropiada antes de compilar para servicios separados. Esos comandos existen; no equivalen a una prueba de despliegue Render. Para verificar el frontend sin cargar archivos de entorno se usó esta variante, junto con los tipos:

```sh
frontend/node_modules/.bin/tsc -b frontend/tsconfig.json
node --input-type=module -e 'import { build } from "./frontend/node_modules/vite/dist/node/index.js"; await build({root:"frontend",envDir:false});'
```

## Pruebas y comprobaciones

No existe `npm test` ni script de lint backend. Ejecuta las suites de navegador **secuencialmente**, sin lanzar a la vez la regresión backend, que también abre Chrome:

```sh
backend/node_modules/.bin/tsx --test --test-concurrency=1 backend/test/*.test.ts
backend/node_modules/.bin/tsx --test frontend/test/metasApi.test.ts
node --test --test-concurrency=1 frontend/test/formularioMeta.test.mjs frontend/test/progresoSemanal.test.mjs frontend/test/navegador-cierre.test.mjs
node --test .codex/hooks/proteger-entorno.test.mjs
```

| Suite | Aprobadas | Fallos | TODO |
| --- | ---: | ---: | ---: |
| Backend, con recorridos de navegador T15 y D4 | 260 | 0 | 3 |
| API frontend | 14 | 0 | 0 |
| Navegador con API ficticia y limpieza del runner | 43 | 0 | 0 |
| Harness con entradas simuladas | 26 | 0 | 0 |

Los conteos incluyen contenedores de node:test. El test de comandos `curl` se registra por separado en [su evidencia](docs/verificacion/curl-E2.md) y no aumenta las 343 aprobadas anteriores. Los tests de dominio no usan base de datos; T15 y D4 usan React/Express/Mongoose reales con **colecciones simuladas**, no MongoDB. No inician `index.ts` ni leen archivos de entorno. Las pruebas del hook no demuestran funcionamiento de E2 ni activación en VS Code.

```sh
backend/node_modules/.bin/tsc -p backend/tsconfig.json --noEmit --incremental false
backend/node_modules/.bin/tsc --noEmit --strict --target es2022 --module nodenext --moduleResolution nodenext --types node --typeRoots backend/node_modules/@types --skipLibCheck backend/test/*.ts
frontend/node_modules/.bin/tsc -p frontend/tsconfig.app.json --noEmit --incremental false
frontend/node_modules/.bin/tsc -p frontend/tsconfig.node.json --noEmit --incremental false
npm --prefix frontend run lint -- --no-cache
git diff --check
```

## Cómo trabajamos con el agente

Usamos exclusivamente **Codex en VS Code**, por decisión del estudiante, con [AGENTS.md](AGENTS.md), [DESIGN.md](DESIGN.md), la [skill preparar-spec](.agents/skills/preparar-spec/SKILL.md) y el [harness documentado](docs/harness-codex.md). El hook tiene 26 tests aprobados; su activación efectiva en VS Code, la selección del perfil y la evidencia visual siguen pendientes. La protección también rechazó leer la plantilla ficticia de entorno: es una limitación aceptada, no una excepción demostrada.

El flujo seguido fue diagnóstico → harness → PRD/épicas → historias/criterios/tickets → specs → tests/código por ticket → deudas → auditoría. Las specs se registraron en `c9c99fe` antes del código. Los pares de commits de tests/dominio conservan esa secuencia. Los documentos de fases previas mantienen notas históricas y enlazan al estado auditado actual.

| Documento | Ubicación |
| --- | --- |
| Enunciado y diagnóstico | [Requisitos](ENUNCIADO-E2.md), [diagnóstico](docs/diagnostico.md) |
| Producto y épicas | [PRD](docs/prd/playlog-e2.md), [E1/E2](docs/backlog/epicas.md) |
| Historias, criterios, tickets y estado | [Backlog E2](docs/backlog/E2-metas-y-rachas.md) |
| Specs | [Backend](docs/specs/01-backend-metas-progreso.md), [frontend](docs/specs/02-frontend-metas-rachas.md) |
| Pruebas y evidencia | [Frontend](frontend/test/README.md), [T15](docs/verificacion/E2-T15.md), [curl](docs/verificacion/curl-E2.md), [D3](docs/verificacion/DT-D3.md), [D4](docs/verificacion/DT-D4.md) |
| Cierre y colaboración | [Auditoría](docs/AUDITORIA.md), [bitácora](docs/bitacora-agente.md), [rúbrica](docs/checklist-rubrica.md) |

No se crean configuraciones Claude que no se usan. La adaptación conserva objetivos académicos, pero no cumple literalmente sus rutas/comandos y no consta aceptación del profesor. Los commits se hicieron con autorización, sin push, merge ni despliegue.

## Limitaciones y entrega pendiente

- Tres TODO de MongoDB real: persistencia de Meta, índice único concurrente y cascada. También falta verificar en una base autorizada la persistencia real de quitar calificación en D4.
- D3 responde 400 a los dos casos diagnosticados y conserva 500 para errores inesperados; D4 distingue calificación omitida de borrado explícito. Evidencia en sus documentos, sin afirmar persistencia real.
- D9 (atomicidad), D5 (títulos solo con espacios), D8 (optimización sin lentitud medida) y la falta de una suite exhaustiva de P3 permanecen como límites del [backlog](docs/backlog/E2-metas-y-rachas.md).
- Edición de partidas pendiente de aclaración del profesor. La métrica de 3 de 4 semanas es un objetivo de producto, no un resultado medido ni un historial automático.
- RAWG, instalación limpia, ejecución completa con base real y despliegue no se acreditaron en esta sesión. La app conserva la integración RAWG de P3.
- Faltan URLs públicas E2 verificadas en Render, PR con tickets y auditoría, integración a main y demo de máximo 6 minutos. No se inventan enlaces ni capturas.
