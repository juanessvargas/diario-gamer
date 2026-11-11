# PLAYLOG! — instrucciones para Codex

## Proyecto
Diario de Progreso Gamer universitario: Express, TypeScript y Mongoose; React, TypeScript y Vite.
Trabajamos exclusivamente con Codex en VS Code; no crear configuración de Claude.
Conservar arquitectura, contratos e identidad visual existentes.

## Estructura y fuentes
- `backend/src`: modelos, servicios, controladores, rutas, middlewares y configuración.
- `frontend/src`: páginas, servicios HTTP en `api/`, tipos y CSS; recursos en `frontend/public/`.
- `ENUNCIADO-E2.md` es la fuente principal; `docs/diagnostico.md` conserva el diagnóstico histórico.
- D1 quedó resuelto en `4825f30`; D3 y D4 se corregirán en fase 8; D9 sigue diferido.
- Trabajar solo en la fase autorizada; no resolver reglas del PRD por suposición.

## Comandos desde la raíz
- Backend: `npm --prefix backend run dev`, `run build` y `run start`.
- Frontend: `npm --prefix frontend run dev`, `run build`, `run lint` y `run preview`.
- Tipos backend: `backend/node_modules/.bin/tsc -p backend/tsconfig.json --noEmit --incremental false`.
- Tipos frontend: `frontend/node_modules/.bin/tsc -p frontend/tsconfig.app.json --noEmit --incremental false`.
- Configuración Vite: `frontend/node_modules/.bin/tsc -p frontend/tsconfig.node.json --noEmit --incremental false`.
- Lint: `npm --prefix frontend run lint -- --no-cache`.
- Harness: `node --test .codex/hooks/proteger-entorno.test.mjs`.
- No existe aún `npm test`; no inventar scripts ni confundir lint con tests.
- Dev/start del backend y Vite pueden cargar entorno: no ejecutarlos si acceden a archivos protegidos.

## Seguridad y autorización
- Nunca abrir, leer, mostrar, modificar o borrar archivos `.env` reales ni sus variantes con secretos.
- `backend/.env.example` es una excepción de solo lectura; no afirmar que está libre de secretos sin revisarlo.
- No leer credenciales ni configuración de autenticación; no mostrar variables de entorno completas.
- No instalar dependencias, cambiar configuración global o acceder a MongoDB sin autorización.
- No hacer commits, push, despliegues, reset destructivo ni aplicar/eliminar stashes sin autorización.
- Antes de cambios fuera del alcance aprobado, explicar la propuesta y pedir autorización.
- Si una prueba falla o aparece una diferencia inesperada, explicar y detenerse antes de cambiar la solución.

## Desarrollo y verificación
- Ninguna funcionalidad nueva de PLAYLOG! sin una spec previa en `docs/specs/`.
- Mantener rutas → controladores → servicios → modelos y el manejo centralizado con `ApiError`.
- Seguir nombres en español y el estilo del archivo; evitar refactorizaciones ajenas al ticket.
- No cambiar modelos ni el resumen de P3 salvo corrección decidida y especificada.
- Ejecutar los tests pertinentes antes de finalizar; informar exactamente comandos, resultados y límites.
- La falta de tests de aplicación debe declararse; los tests del harness no demuestran que E2 funcione.
- No afirmar que funciona algo que no se comprobó; no acceder a datos reales para una prueba simulada.
- Mantener specs antes de código y commits por ticket cuando se autorice.

## Frontend
- Consultar `DESIGN.md` antes de tocar interfaz, estilos o textos.
- Conservar CSS propio, recursos y patrones actuales; no añadir librerías de UI ni rediseñar.
- Conservar carga, error, vacío, etiquetas, foco y movimiento reducido.
- El acceso HTTP permanece en `frontend/src/api/`, separado de las páginas.
