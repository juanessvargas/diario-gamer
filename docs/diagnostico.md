# Diagnóstico de PLAYLOG! — Proyecto 3 y preparación de E2

Fecha: 9 de noviembre de 2026.

## 1. Fuente, versión y alcance

La fuente principal de requisitos es [ENUNCIADO-E2.md](../ENUNCIADO-E2.md). Este documento corresponde únicamente a la fase 1: diagnóstico. Registra el estado inspeccionado, la evidencia disponible y las decisiones tomadas con el estudiante; no implementa E2 ni constituye su PRD o sus specs.

La base técnica aprobada es la rama `desarrollo-diario-gamer`, commit `38dca16`. Sus archivos se inspeccionaron directamente desde Git, sin cambiar de rama. Todas las referencias a archivos y líneas del código, los paquetes y los README corresponden a ese commit.

La rama de trabajo activa, `feature/e2-metas-rachas`, permanece en `00f1c73`, con la estructura inicial y sin los archivos fuente versionados del backend y frontend. La base aprobada tiene 30 commits que esa rama todavía no incorpora. Por ello, el contenido descrito a continuación existe en la base consultada, no en el árbol versionado actual de la rama activa.

Durante el diagnóstico no se abrieron archivos `.env` ni credenciales, no se conectó a MongoDB, no se instalaron dependencias ni se modificó código. Las comprobaciones aisladas utilizaron las dependencias locales existentes y código leído en memoria desde Git. No se crearon archivos de pruebas ni se hicieron commits, push o despliegues.

## 2. Estado del Proyecto 3 y arquitectura que se conserva

### Backend

El backend utiliza Express, TypeScript y Mongoose. Mantiene las capas `routes`, `controllers`, `services`, `modelos` y `middlewares`: las rutas dirigen las solicitudes a los controladores, estos llaman a los servicios y los servicios acceden a los modelos. También existen configuración de entorno, conexión a la base de datos y un punto de entrada del servidor.

El código incluye CORS, lectura de JSON, generación de identificadores de solicitud, logger, respuesta para rutas inexistentes y manejo centralizado de errores mediante `ApiError` y errores de Mongoose. Se conservarán estas capas y la centralización de errores, salvo las correcciones expresamente aprobadas.

Los modelos existentes son:

| Modelo | Información y restricciones observadas |
| --- | --- |
| `Videojuego` | Título obligatorio, portada opcional, género y plataforma con valores enumerados, estado con valor predeterminado `pendiente`, calificación opcional de 0 a 10, logros embebidos y timestamps. Cada logro tiene nombre y estado de obtención. |
| `Partida` | Referencia obligatoria a `Videojuego`, fecha obligatoria, duración mínima de un minuto, porcentaje de avance entre 0 y 100 y timestamps. El servicio verifica la existencia del videojuego al crear una partida. |

Las funcionalidades presentes en el código son:

| Área | Operaciones existentes |
| --- | --- |
| Videojuegos | Listar, filtrar por estado, consultar por ID, crear, actualizar y eliminar mediante `/api/videojuegos`. |
| Logros | Agregar o quitar logros mediante la edición del videojuego y cambiar su estado mediante `PATCH /api/videojuegos/:id/logros/:logroId`. |
| Partidas | Listar, crear y eliminar mediante `/api/partidas`; consultar las de un videojuego mediante `GET /api/videojuegos/:id/partidas`. No existe edición de partidas. |
| Resumen | `GET /api/videojuegos/:id/resumen`. |
| Catálogo | Buscar títulos y portadas en RAWG mediante `/api/catalogo`. La integración real con RAWG no se comprobó. |

La eliminación de un videojuego está implementada en el backend: busca el juego, elimina sus partidas relacionadas y después elimina el juego. El alcance y los límites de su verificación se detallan en las secciones 3 y 6.

### Resumen de videojuegos

El servicio `backend/src/services/partidas.service.ts:49` calcula:

- `totalPartidas`: cantidad de partidas del videojuego.
- `horasTotales`: suma de `duracionMinutos` dividida entre 60.
- `ultimaSesion`: fecha de la sesión más reciente por `fecha`, con desempates por `createdAt` y `_id`, todos en orden descendente.
- `porcentajeAvance`: avance de esa misma sesión, sin sumar porcentajes ni tomar el máximo histórico.

Sin partidas devuelve cero sesiones, cero horas, avance cero y `ultimaSesion: null`. La fecha de la sesión tiene prioridad sobre la fecha en que se registró el documento.

Se conservarán los modelos y el contrato de este resumen, según `ENUNCIADO-E2.md:21`. El progreso semanal será un cálculo adicional e independiente; no corresponde cambiar el resumen de P3 para introducir las reglas de semana, redondeo o rachas de E2.

### Frontend

El frontend utiliza React, TypeScript, Vite y React Router. Separa las pantallas en `src/paginas`, el acceso HTTP mediante `fetch` en `src/api` y los tipos en `src/tipos.ts`.

El código implementa biblioteca con búsqueda y filtros, formulario de creación y edición de videojuegos, selección de portada desde RAWG, gestión de logros, detalle con resumen e historial, listado de partidas y registro de nuevas sesiones. Incluye estados de carga, error y vacío en sus pantallas.

Los servicios de API utilizan rutas y envoltorios de respuesta compatibles con los controladores inspeccionados. Existe una función cliente para eliminar videojuegos, pero ninguna pantalla la utiliza. No se añadirá un botón de eliminación dentro del alcance aprobado.

La identidad visual existente incluye estilos propios, variables de color, tipografías DM Sans y Barlow Condensed, imágenes y reglas responsive. Se conservará el diseño; su documentación y verificación contra `DESIGN.md` corresponden a la fase 2 y las fases posteriores pertinentes. Su funcionamiento visual y accesibilidad todavía requieren revisión en navegador.

### Scripts y documentación

| Proyecto | Scripts disponibles en la base inspeccionada |
| --- | --- |
| Backend | `dev`: `tsx watch src/index.ts`; `build`: `tsc`; `start`: `node dist/index.js`. |
| Frontend | `dev`: `vite`; `build`: `tsc -b && vite build`; `lint`: `eslint .`; `preview`: `vite preview`. |

No existen scripts `test` ni archivos de pruebas versionados en la base revisada. El README principal describe funcionalidades y modelos, pero termina incompleto y no proporciona instrucciones de instalación y ejecución. El README del frontend conserva el contenido de la plantilla de Vite.

## 3. Tabla de problemas D1–D9 y decisiones aprobadas

En esta tabla, «confirmado en código» significa observado en la versión indicada. «Reproducido en aislamiento» significa ejecutado sin conexión a MongoDB, con sustituciones en memoria cuando correspondía. Un riesgo no equivale a un fallo observado en producción.

| ID | Problema y evidencia | Clasificación | Decisión y justificación |
| --- | --- | --- | --- |
| D1 | La rama activa está en `00f1c73`; la base aprobada está en `38dca16`, con 30 commits que la rama activa no incorpora. Sus árboles versionados confirman que el código de P3 no está en la rama activa. | Bloqueo confirmado para implementar E2 sobre la base existente. | Usar `desarrollo-diario-gamer`, commit `38dca16`. Preparar la rama requiere autorización posterior. No se realizó integración, cambio de rama ni commit. |
| D2 | `README.md:88` termina a mitad de una explicación. No hay instrucciones de instalación ni ejecución. `frontend/README.md:1` conserva la plantilla. | Carencia documental confirmada. | Completar posteriormente la documentación de entrega con instrucciones reproducibles. No se infiere un fallo de ejecución a partir de esta ausencia. |
| D3 | Un JSON mal formado devuelve `500` y pierde el identificador de solicitud. Actualizar un logro sin cuerpo también devuelve `500`. Evidencia: `backend/src/app.ts:17`, `backend/src/middlewares/errorHandler.ts:35` y `backend/src/controllers/videojuegos.controller.ts:111`; solicitudes aisladas reprodujeron ambos casos. | Defecto confirmado en aislamiento. Deuda seleccionada. | Corregir en la fase 8 mediante criterio de aceptación, test, código y verificación. No se considera un impedimento para comenzar el cálculo de dominio de E2 y no se corrige durante el diagnóstico. |
| D4 | Al quitar la calificación, el formulario asigna `undefined`; la serialización omite el campo y Mongoose no genera una instrucción para eliminar el valor anterior. Evidencia: `frontend/src/paginas/FormularioVideojuego.tsx:686`, `frontend/src/api/videojuegosApi.ts:67` y `backend/src/services/videojuegos.service.ts:33`. | Defecto comprobado en el contrato de actualización y con un doble de colección. Deuda seleccionada; integración real pendiente. | Corregir en la fase 8 mediante criterio, test, código y verificación. La comprobación real de persistencia se hará después con una base de pruebas autorizada. |
| D5 | El formulario rechaza un título compuesto solo por espacios, pero el modelo lo acepta. Evidencia: `frontend/src/paginas/FormularioVideojuego.tsx:219` y `backend/src/modelos/Videojuego.model.ts:18`; la validación aislada aceptó `"   "`. | Inconsistencia de validación confirmada. Deuda diferida. | Diferir porque no impide los cálculos de E2. No se modifica el modelo ni se amplía la corrección de D3 a este problema sin una decisión posterior. |
| D6 | El endpoint de eliminación y la función cliente existen, pero ninguna pantalla utiliza `eliminarVideojuego`. El README anuncia eliminación. Evidencia: `backend/src/routes/videojuegos.routes.ts:20`, `frontend/src/api/videojuegosApi.ts:79` y `README.md:11`. | Ausencia de interfaz confirmada; posible deuda o discrepancia documental. No bloquea E2. | No agregar el botón. El estudiante confirmó que el CRUD completo era obligatorio en el backend de P3, pero el frontend no exigía explícitamente esa acción. La cascada del backend se evaluó por separado en D9. |
| D7 | No hay pruebas versionadas ni scripts `test` en `backend/package.json:6` o `frontend/package.json:6`. La inspección del árbol del commit no encontró archivos de tests. | Carencia confirmada de verificación automatizada versionada. | Incorporar los tests obligatorios de dominio y de los criterios de E2 en sus fases correspondientes. Las comprobaciones de esta sesión no se presentan como una suite guardada. D7 impide acreditar la entrega final sin tests, pero no bloquea la documentación inicial. |
| D8 | La biblioteca solicita un resumen por videojuego; cada resumen carga todas sus partidas y consulta de nuevo la última. Evidencia: `frontend/src/paginas/ListaVideojuegos.tsx:52` y `backend/src/services/partidas.service.ts:57–74`. | Patrón confirmado en código; posible riesgo de rendimiento, sin lentitud medida. | Diferir la optimización: no hay mediciones que justifiquen priorizarla frente a los requisitos de E2. No se afirma que exista un problema de rendimiento observado. |
| D9 | El borrado de partidas y el del videojuego son operaciones separadas. Evidencia: `backend/src/services/videojuegos.service.ts:47–48`. Un fallo simulado en la segunda operación dejó el juego presente y sus partidas ya eliminadas. | Riesgo de borrado parcial, reproducido con dobles; no se comprobó corrupción en MongoDB real. | Diferir la atomicidad como deuda técnica y documentar el riesgo. Mantener como requisito obligatorio de E2 la extensión de la cascada a las metas relacionadas, sin dejar metas huérfanas. No se incorporan transacciones en esta fase. |

## 4. Bloqueos y problemas que se difieren

El bloqueo técnico confirmado para implementar E2 en la rama activa es D1. La fuente correcta ya fue elegida, pero la preparación de la rama no está autorizada dentro de esta entrega documental.

D7 es una brecha de verificación que deberá resolverse para acreditar el backend de E2 y la entrega final. No significa que las operaciones de P3 hayan fallado ni exige implementar tests durante la fase de diagnóstico.

D3 y D4 quedan comprometidos para la fase 8. D5, D8 y la atomicidad de D9 se difieren por las razones de la tabla. D2 queda como documentación pendiente de completar para la entrega. D6 no autoriza una funcionalidad nueva ni bloquea E2.

La ausencia actual de `Meta`, de funciones puras de progreso semanal y de su interfaz es trabajo previsto de E2, no un defecto añadido a P3. Su implementación debe seguir la cadena SDD y no empieza con este documento.

La edición de partidas es una ambigüedad de alcance que debe aclararse antes de comprometer ese flujo en las specs. El harness de Codex sigue pendiente de configuración y comprobación en la fase 2; la adaptación a Codex ya fue decidida y no queda condicionada a instalar Claude Code.

## 5. Los dos problemas seleccionados para pagar deuda técnica

Los problemas elegidos por el estudiante son exclusivamente D3 y D4:

- **D3:** corregir las respuestas HTTP `500` ante las entradas inválidas identificadas, conservando la distinción con los errores inesperados del servidor.
- **D4:** corregir la actualización que no elimina la calificación anterior cuando el usuario utiliza la acción existente de quitarla.

Cada uno deberá recorrer el ciclo de criterio de aceptación, test, código y verificación, con la trazabilidad y el commit correspondiente cuando se autorice. Su corrección está asignada a la fase 8, no a este diagnóstico. Los criterios y las pruebas definitivos se formalizarán en los artefactos posteriores; aquí no se elige una implementación ni se afirma que los defectos estén corregidos.

## 6. Comprobaciones realizadas y límites de la evidencia

### Comprobaciones ya ejecutadas durante el diagnóstico

Se utilizó el código del commit `38dca16` en memoria y las dependencias previamente instaladas. Estas comprobaciones no se volvieron a ejecutar para crear este archivo de documentación.

| Comprobación | Resultado observado y alcance |
| --- | --- |
| Tipos del backend | Sin diagnósticos de error con TypeScript 7.0.2 y sin emitir archivos. No equivale a arrancar el servidor conectado a MongoDB. |
| Tipos del frontend y configuración de Vite | Sin diagnósticos de error con TypeScript 6.0.3. No se ejecutó el build final de Vite. |
| Lint del frontend | ESLint revisó 13 archivos con la configuración del commit: cero errores y cero advertencias. |
| Modelos | Se rechazaron duración cero y avance superior a 100. Se aceptó un título solo con espacios. También se aceptaron fecha futura y duración fraccionaria; estas dos últimas observaciones no se clasifican como errores sin una regla de negocio que las prohíba. No se guardaron documentos. |
| Resumen | Seis escenarios con consultas sustituidas por datos en memoria: videojuego sin partidas; acumulación de tiempo y prioridad de fecha de sesión; empate resuelto por `createdAt`; empate resuelto por `_id`; recálculo al retirar la última partida del conjunto simulado; videojuego inexistente con `404`. |
| API básica y validación HTTP | La raíz respondió `200`, una ruta inexistente respondió `404` y un PATCH con cuerpo vacío de campos respondió `400`. JSON mal formado y PATCH sin cuerpo reprodujeron D3. |
| Calificación | La función cliente omitió `calificacion` del JSON al recibir `undefined`. La actualización real generada por Mongoose no incluía asignación ni eliminación de ese campo; un doble de colección con calificación previa 8 devolvió ese valor sin cambio. No se verificó contra MongoDB. |
| Manejo centralizado de errores | Se comprobó que `errorHandler` propaga `ApiError` con estados `400`, `404`, `409` y `500`. E2 deberá generar el conflicto de segunda meta activa; no se probó ese endpoint porque todavía no existe. |

### Borrado de videojuegos y partidas relacionadas

Se ejecutó el endpoint original con los métodos de colección de Mongoose sustituidos por dobles en memoria. No se estableció una conexión a MongoDB.

| Escenario | Resultado observado |
| --- | --- |
| Videojuego con dos partidas relacionadas | `204`; se eliminaron ambas, conservando otro videojuego y su partida. Se comprobó el orden: buscar juego, borrar partidas, borrar juego. |
| Videojuego sin partidas | `204`. |
| Videojuego inexistente | `404`; no se ejecutaron eliminaciones. |
| ID mal formado | `400`; no se llegó a los métodos de colección. |
| Fallo simulado al borrar partidas | `500`; no se intentó eliminar el videojuego. |
| Fallo simulado al borrar el videojuego después de borrar sus partidas | `500`; el videojuego permaneció en el conjunto simulado y sus partidas ya no estaban. Esta es la evidencia de D9. |

La cascada normal está implementada y pasó estas comprobaciones aisladas. Esto no prueba persistencia real, atomicidad ni comportamiento bajo concurrencia en Atlas.

### Verificación pendiente

- Integración real con una base de pruebas autorizada: CRUD, referencias, `populate`, actualización de logros y calificación, y eliminación de documentos relacionados.
- Resumen con consultas reales: orden de sesiones, empates, altas, bajas y concurrencia.
- Navegador: navegación, formularios, filtros, errores, reintentos, doble envío y actualización de estadísticas.
- Diseño responsive, accesibilidad y navegación por teclado.
- Integración con RAWG, fallos de red y tiempos de espera.
- Build final, arranque reproducible y despliegue en Render.

Las salidas de las comprobaciones quedaron registradas en la conversación de diagnóstico; no se crearon scripts, capturas ni reportes de prueba versionados. Las verificaciones futuras deberán aportar la evidencia exigida por las specs y la auditoría. No se afirma que la aplicación completa ni el despliegue funcionen.

## 7. Decisiones pendientes y justificación

| Asunto | Estado, fase y motivo |
| --- | --- |
| Preparación de la rama de E2 | Base decidida: `desarrollo-diario-gamer`, commit `38dca16`. Incorporar esa base a la rama de trabajo requiere autorización posterior; no se eligió ni ejecutó una operación de Git en este documento. |
| Commit del diagnóstico | Pendiente de revisión y autorización específica. El enunciado requiere trazabilidad por fases; no se hará un commit automático. |
| Edición de partidas | Pendiente de aclarar con el profesor. `ENUNCIADO-E2.md:100` y `:145` mencionan refresco tras editar; `backend/src/routes/partidas.routes.ts:7–9` no contiene edición. No se añadirá ese flujo por suposición. |
| Eliminación de metas e hitos | En E2 es obligatorio extender la cascada y evitar metas huérfanas (`ENUNCIADO-E2.md:137`). Se formalizarán en el PRD el alcance sobre metas activas e inactivas, su historial y sus hitos embebidos, respetando esa decisión. Diferir la atomicidad de D9 no elimina este requisito. |
| Harness | Se utilizará exclusivamente Codex en VS Code, con `AGENTS.md` como instrucciones principales. La configuración y demostración de memoria, skills, hooks o mecanismos equivalentes de seguridad y sistema de diseño corresponden a la fase 2. Su funcionamiento todavía no está verificado. |
| Adaptación de los requisitos de Claude | Por decisión explícita del estudiante, no se instalará Claude Code ni se crearán `CLAUDE.md` o configuraciones en `.claude/`. La fase 2 documentará las diferencias respecto de los requisitos literales de `ENUNCIADO-E2.md:115–119`, la alternativa real de Codex y cómo se comprueba. Se mantienen los objetivos académicos de SDD, tests y trazabilidad. |
| Ocho huecos de negocio | Se resolverán y justificarán en el PRD antes de trasladarlos a criterios y tests. Este diagnóstico no cierra esas reglas por anticipado. |

Los ocho huecos de la ficha se refieren a: racha cuando hoy no hay partida; varias partidas en un día; cruce de medianoche; cambio de meta a mitad de semana; porcentaje al superar la meta; hito alcanzado seguido de menor avance; meta para un videojuego completado o abandonado; y eliminación del videojuego con sus metas e hitos. Las decisiones deberán respetar las reglas fijas del enunciado, incluida la semana de lunes a domingo en `America/Guayaquil` y el conteo de días distintos.

Estas decisiones de fases posteriores pueden quedar abiertas en el diagnóstico con su justificación. D1 sigue pendiente antes de implementar y el commit de fase 1 sigue sujeto a autorización. La creación de este documento no corrige D3 o D4, no paga ninguna deuda técnica ni inicia el harness, el PRD, el backlog, las specs o el código de E2.
