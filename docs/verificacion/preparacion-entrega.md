# Preparación final y comprobaciones externas

2026-11-10. Base de preparación: `23c837d`, código funcional de `7c6ac79`. El estudiante decidió gestionar manualmente GitHub y Render y confirmó que la plantilla de entorno contiene solo valores ficticios. Este registro no es un despliegue ni un PR creado.

## Criterios parciales

De los 14 anteriores, se cierra **solo CA-03.3** al nivel que su spec exige (A/H): `actualizarMeta` valida objetivos antes de `meta.set`/`save`; los casos de edición inválida verifican 400, datos anteriores intactos y cero escrituras. La tabla de la spec no exige I en esa fila. Es una corrección justificada de la clasificación conservadora, sin modificar requisitos, código ni pruebas.

Resultado actual: **37 cumplidos y 13 parciales de 50**, sin criterios completamente ausentes. Los otros 13 son CA-01.1/01.5, CA-02.1/02.2, CA-03.1/03.4, CA-04.3/04.4, CA-08.1/08.2/08.3 y DT-CA-04/05: requieren verificación de persistencia, unicidad o cascada real. Los asuntos docentes (Codex frente a Claude, edición de partidas y tipo de reflexión de bitácora) son requisitos externos, no filas de esos 13 criterios.

## MongoDB y protección de entorno

No se encontraron CLI MongoDB/Docker en PATH. Se comprobó únicamente la **presencia**, sin imprimir valores, de configuración dedicada de pruebas y de la configuración normal en el proceso: no estaba disponible. No se buscaron conexiones en archivos protegidos ni se leyó autenticación. La conexión productiva de Render no se usa como sustituto de una base de pruebas.

Por ello no se ejecutaron escrituras de prueba en MongoDB real. Permanecen los tres TODO: ciclo de vida de Meta, índice único parcial concurrente y cascada; también falta la persistencia real de D4. Para cerrarlos, el estudiante debe habilitar una base exclusiva de prueba con usuario acotado, configurar su acceso localmente sin enviar secretos al chat y confirmar el destino. La limpieza debe limitarse a los datos de esa ejecución, nunca a datos ajenos ni a una base productiva.

El guard rechazó el intento de revisar la plantilla sin mostrar valores; no se buscó una ruta alternativa para eludirlo. El estudiante confirmó manualmente que solo contiene valores ficticios. Alternativa segura: contrastar manualmente en VS Code los nombres necesarios del backend (`MONGODB_URI`, `MONGODB_DB`, `PORT`, `RAWG_API_KEY`) con el [README](../../README.md), y configurar `VITE_API_URL` en el frontend de Render. E2 no añade otras variables. No se modificó la plantilla ni se certificó automáticamente su completitud; no hay motivo para desactivar la protección.

## Harness comprobado

- AGENTS.md: 49 líneas, instrucciones persistentes y referencia a DESIGN.md; skill en `.agents/skills/preparar-spec/`; config y guard en `.codex/` presentes. No se alteraron estos mecanismos.
- Binario instalado: `codex-cli 0.164.0-alpha.11.1`. Su ayuda confirma las opciones de validación y `sandbox --permission-profile`.
- `codex app-server --strict-config --print-startup-config`: código 0, sin stderr; salida de configuración capturada y no mostrada. No cambió confianza ni configuración global. Un intento previo con Python no pudo cargar tomllib; se usó el parser nativo, sin instalar dependencias.
- Guard: 26 tests aprobados y rechazo observado en esta sesión. Esto no prueba por sí solo la selección efectiva del perfil, la confianza y activación en la interfaz de VS Code ni sustituye una captura real.
- La prueba de seis accesos ficticios rechazados y el fallo conocido de lectura de la plantilla son históricos; no se repitieron experimentos de excepciones. No se declara resuelto ese fallo.

Los hooks de proyecto requieren confianza y revisión de su definición; su existencia no basta para declararlos activos. Los perfiles de permisos pueden ceder ante ajustes antiguos de sandbox. Se contrastó con [OpenAI Docs: hooks](https://learn.chatgpt.com/docs/hooks) y [permisos](https://learn.chatgpt.com/docs/permissions). Falta que el estudiante muestre en su sesión de VS Code los mecanismos efectivos y guarde evidencia con señuelos sin secretos. No se crean configuraciones Claude ni se inventa equivalencia aceptada por el profesor; véase [harness histórico](../harness-codex.md).

## Render: observado sin modificar datos

| Comprobación | Resultado real |
| --- | --- |
| Frontend `https://playlog-frontend.onrender.com/` | HTTP 200; HTML y bundle públicos accesibles. |
| Ruta frontend `/videojuegos` | HTTP 200 con el HTML de la SPA. |
| Backend `https://playlog-backend-osik.onrender.com/` | HTTP 200 y mensaje de salud de la API. |
| Backend GET `/api/videojuegos` | HTTP 200, estructura de lista válida; no se publican títulos ni IDs de los usuarios. |
| Frontend real en Chrome, perfil temporal, sin sustituir fetch | Biblioteca visible, sin alert de error; recursos consultaron el origen real del backend; petición desde ese origen frontend obtuvo 200 y JSON con lista. Comunicación básica comprobada. |
| GET `/api/metas/invalido` | HTTP 404 «Ruta no encontrada»; la implementación E2 local debería devolver 400 para ese ID. |
| GET `/api/videojuegos/invalido/progreso-semanal` | HTTP 404 «Ruta no encontrada», no el 400 de la ruta E2. |
| Bundle frontend observado | `index-C_Q4xSTT.js`, sin marcador `progreso-semanal`; su origen de API es el backend indicado. Compatible con la interfaz anterior, no demuestra publicación T14. |

Conclusión limitada: **ambos servicios existentes responden y la comunicación básica funciona; E2 no está expuesta en la API observada**. No se conoce el SHA de despliegue desde el panel. No se hicieron POST/PUT/PATCH/DELETE sobre producción, ni se probaron allí metas/rachas/hitos, D3 o D4 como si ya estuvieran publicados.

Las consultas públicas se hicieron con curl GET y Chrome. El navegador de verificación arrancó con API real, sin la inyección ficticia usada por T13/T14. No se tomaron los datos productivos para pruebas destructivas. La capa web de consulta no pudo abrir inicialmente las URLs; los resultados de la tabla proceden de curl/Chrome, no de aquella respuesta fallida.

## Actualizar los dos servicios existentes, sin duplicarlos

No hay acceso autenticado al panel en esta sesión y el estudiante eligió gestión manual. Entrar en **los servicios de esas dos URLs**, no en New Service. Comprobar repositorio `juanessvargas/diario-gamer`, rama vinculada y último SHA antes de editar. No se conoce la configuración privada actual, así que no sobrescribir valores válidos a ciegas.

| Servicio | Configuración de referencia según el código |
| --- | --- |
| Backend existente, Node Web Service | Si Root Directory es `backend`: Build `npm ci && npm run build`; Start `npm run start`. Variables requeridas: MONGODB_URI, MONGODB_DB según el destino autorizado; PORT asignado por Render; RAWG_API_KEY para el catálogo. No mostrar sus valores. |
| Frontend existente, si es Static Site | Si Root Directory es `frontend`: Build `npm ci && npm run build`; Publish Directory `dist`. VITE_API_URL debe apuntar a `https://playlog-backend-osik.onrender.com` antes del build. Es una URL pública, no un secreto. No usar vite preview como servidor de producción nuevo. |
| Monorepo sin Root Directory configurado | Mantener esa estrategia si ya funciona: Build backend `npm --prefix backend ci && npm --prefix backend run build`; Start `npm --prefix backend run start`. Build frontend `npm --prefix frontend ci && npm --prefix frontend run build` y Publish Directory `frontend/dist`. No mezclar paths de raíz con comandos relativos al subdirectorio. |
| Compatibilidad | Confirmar Node compatible con Vite (`^20.19.0 || >=22.12.0`); la instalación local probada es 24.19.0. Render permite fijar NODE_VERSION. No asumir el valor privado actual ni modificar paquetes para resolver algo no demostrado. |
| SPA | Verificar Rewrite `/*` → `/index.html` para React Router si el servicio es estático. La ruta pública revisada ya respondió 200; no añadir reglas duplicadas sin revisar las existentes. |

El origen de frontend se compila en Vite: cambiar VITE_API_URL exige un build nuevo. La API ya toma PORT y usa CORS; no se demostró un bloqueo que requiera cambiar producción. Solo hay que publicar los commits E2/deudas y ajustar el panel si sus comandos difieren de los del paquete. No se añadió un Blueprint que pudiera crear servicios nuevos.

Estas instrucciones se contrastaron con la documentación oficial de [Express en Render](https://render.com/docs/deploy-node-express-app), [monorepos](https://render.com/docs/monorepo-support), [Static Sites](https://render.com/docs/static-sites), [rewrites](https://render.com/docs/redirects-rewrites) y [versión Node](https://render.com/docs/node-version).

Secuencia manual: publicar rama → crear/revisar PR → obtener aprobación explícita antes de merge → actualizar la rama elegida en los servicios existentes o desplegar el main aprobado → revisar logs sin revelar secretos → repetir GET y recorridos E2 con un juego de demo propio. Si se despliega temporalmente una rama antes del merge, comprobar que el panel permite esa selección y que se trata de los mismos servicios; esta preparación no afirma haberlo hecho.

Después de desplegar: confirmar que un ID inválido en E2 da 400, que un juego propio válido devuelve `{ progreso }`, abrir detalle, crear/editar/desactivar meta, registrar sesiones y provocar 409 solo en el juego propio. Usar únicamente datos de demo identificados y no borrar datos de usuarios. Si falta base de pruebas, esos recorridos productivos no cierran el ensayo aislado de índice/cascada.

## Git y PR manual

Remoto verificado: `https://github.com/juanessvargas/diario-gamer.git`, sin credenciales embebidas en la URL mostrada. Fetch de main realizado sin cambiar el main local. `origin/main` es `3f5ae3e` (merge del P3); la referencia local main continúa `00f1c73`. Antes del commit de preparación, la rama tenía 22 commits exclusivos frente a un commit exclusivo de main remoto.

`git merge-tree --write-tree origin/main HEAD` terminó sin conflictos; el árbol calculado coincidió con HEAD. No se hizo merge real ni se preparó un commit de integración. Revalidar si main avanza. Se revisaron estáticamente los 61 archivos del delta frente a origin/main sin encontrar patrones de secretos; no es una garantía de todo el historial. La plantilla, sin cambios frente a ese main, tuvo confirmación manual del estudiante.

El estudiante gestionará el push y la creación del PR; no se asumió acceso por una lectura pública. El título, cuerpo, comandos y destino exacto están en [PR-E2](../PR-E2.md). No se efectuó push, force push, creación de PR ni merge. La fusión a **juanessvargas/diario-gamer:main** requiere aprobación posterior del estudiante sobre el PR concreto.

## Resultados locales y siguiente intervención

Regresión repetida: backend 260 aprobadas/0 fallos/3 TODO; frontend API 14/0; navegador/runner 43/0; harness 26/0. Total 343 aprobadas y tres TODO. TypeScript de producción/tests backend, frontend y Vite, lint, build backend y frontend con carga de entorno deshabilitada: correctos. No se modificó código ni expectativas de tests.

Verificado localmente: dominio, contratos y recorridos con dobles según auditoría. Verificado en Render: disponibilidad y comunicación básica **solo lectura**. Verificado con MongoDB de pruebas real: **nada**. No verificado: publicación E2, flujos E2 productivos, persistencia real, perfil/skill en UI, demo grabada.

Intervención pendiente: base aislada autorizada, panel Render para actualizar los servicios, push/PR manual, aprobación de merge, evidencia visual del harness y criterios docentes. El [guion de demo](../DEMO-E2.md) está preparado, no grabado. La seguridad de la plantilla fue confirmada por el estudiante; su inspección automatizada permanece bloqueada y su completitud debe contrastarse manualmente con los nombres documentados.
