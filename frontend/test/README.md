# Verificación E2-T12, E2-T13 y E2-T14

Los IDs de los casos corresponden al backlog y a la spec 02. Las pruebas de navegador usan Chrome ya instalado, Vite con `envDir: false`, un perfil temporal y una API ficticia en memoria. No arrancan Express ni conectan MongoDB. Las fuentes externas se bloquean en estas pruebas; se conservan las familias y sus respaldos definidos por PLAYLOG!.

Desde la raíz, sin instalar dependencias:

```sh
backend/node_modules/.bin/tsx --test frontend/test/metasApi.test.ts
node --test frontend/test/formularioMeta.test.mjs frontend/test/progresoSemanal.test.mjs
frontend/node_modules/.bin/tsc -p frontend/tsconfig.app.json --noEmit --incremental false
frontend/node_modules/.bin/tsc -p frontend/tsconfig.node.json --noEmit --incremental false
npm --prefix frontend run lint -- --no-cache
node --input-type=module -e 'import { build } from "./frontend/node_modules/vite/dist/node/index.js"; await build({root:"frontend",envDir:false});'
```

El build programático deshabilita la carga de archivos de entorno; no equivale a verificar la configuración de un despliegue. El runner usa la ruta local de Chrome en macOS y requiere Node con WebSocket global. No incorpora un runner de componentes ni paquetes adicionales.

## Resultados ejecutados

| Comprobación | Resultado |
| --- | --- |
| T12: métodos, rutas, cuerpos y envoltorios; 400/404/409/500, red y respuestas ilegibles | 14 aprobadas, 0 fallos |
| T13 antes del código, tras corregir la espera del título del helper | 21 registros fallidos por ausencia del formulario, sin acreditar funcionalidad |
| T13 final: 23 escenarios más el contenedor de node:test | 24 aprobados, 0 fallos |
| T14 antes del código | 15 registros fallidos por ausencia de la sección, sin acreditar funcionalidad |
| T14 final: 14 escenarios más el contenedor de node:test | 15 aprobados, 0 fallos |
| Regresión conjunta de navegador | 39 aprobados, 0 fallos, 0 TODO |
| Regresión backend | 221 aprobadas, 0 fallos, 3 TODO de MongoDB real |
| TypeScript de aplicación, configuración Vite y backend; lint frontend; build con entorno deshabilitado | Sin errores |

Las aserciones de las interacciones se ejecutan en la fase verde, incluidos los casos que inicialmente no podían avanzar porque faltaba la interfaz. Los datos de progreso de los dobles son respuestas fijadas: no constituyen un segundo cálculo de negocio. Registrar/eliminar partidas se comprueba mediante las pantallas y navegación existentes, renovando las consultas al volver al detalle.

## Trazabilidad de cobertura

| Criterios / reglas | Evidencia automatizada |
| --- | --- |
| CA-01.1–CA-01.6, CA-03.1, CA-03.3, CA-03.4 | Formulario: creación, edición sobre mismo ID, horas/días/hitos inválidos y fronteras; cinco hitos; conflicto de creación; completado/abandonado sin bloqueo. La autoridad de validación y la persistencia corresponden al backend. |
| CA-02.1–CA-02.3 | API: obtener y listar; desenvoltorios y lista vacía. El detalle selecciona la activa del listado; no añade una pantalla de historial. |
| CA-04.1–CA-04.4 | Confirmación simulada aceptada/cancelada, desactivación conservando la meta anterior y creación posterior. |
| CA-03.2, CA-04.5 | Progreso: nueva consulta tras editar/crear; conserva actividad semanal recibida y actualiza objetivos. |
| CA-05.1, CA-05.2, CA-05.6–CA-05.10 | Semana sin reinterpretación horaria; horas recibidas con un decimal; 140 % con barra/ARIA en 100; ambos objetivos visibles; sin meta y sin partidas; cambio de videojuego sin respuesta vieja. |
| CA-06.1–CA-06.5 | Presentación de rachas recibidas, incluida mejor racha mayor que la actividad semanal. El cálculo y sus fronteras siguen cubiertos por la suite del dominio backend; no se duplican en React. |
| CA-07.1–CA-07.3 | Hitos desde el resultado backend, reversión tras registrar menor avance y hito alcanzado con actividad cero. |
| CA-09.1–CA-09.5, F-17, F-19 | Carga/error/vacío, reintento, doble envío, guardado correcto con refresco fallido, renovación tras metas y flujos existentes de partidas; respuesta tardía descartada. |
| CA-09.6 | Etiquetas, tabulación, foco visible, foco en mensajes/desactivación, responsive y movimiento reducido; revisión visual descrita abajo. |

CA-05.3–CA-05.5 y las reglas de cálculo no repetidas aquí permanecen en las pruebas puras/HTTP del backend. La cascada CA-08.1–CA-08.3 no se modifica en estos tickets. Esta tabla no declara integración real entre navegador, API y MongoDB.

## Revisión de diseño contra DESIGN.md

| Referencia | Caso y resultado observado |
| --- | --- |
| Detalle existente | Capturas inspeccionadas en Chrome a 1280 y 390 px: secciones nuevas entre estadísticas y logros, avance P3 separado, navegación e identidad conservadas. Capturas temporales fuera del repositorio. |
| Tokens y componentes | Morado, amarillo, tinta, papel y blanco existentes; bordes de 2 px, radios y sombras sólidas; tipografías heredadas. No se añadieron librerías, fuentes ni colores de marca. |
| Formularios | Etiquetas asociadas, límites visibles, agregar/quitar hitos con nombre y bloqueo durante guardado comprobados. |
| Estados | Carga con status, errores con alert, resultado vacío diferenciado; fallo de consulta no se convierte en cero; porcentaje real accesible con barra limitada. |
| Teclado y foco | Tab de horas a días, contorno visible, mensaje enfocado tras error y título tras desactivar comprobados. Al quitar un hito de una lista llena, el foco pasa a Agregar hito después de habilitarse; se reprodujo el fallo y se corrigió el momento de enfoque. No equivale a una auditoría completa con lector de pantalla. |
| Responsive, zoom y texto ampliado | Sin desbordamiento horizontal a 1280, 640, 390 y 320 px; zoom por CDP al 200 % comprobado mediante visualViewport.scale; texto de la sección al 200 % sin desbordamiento. No verifica todas las combinaciones de zoom nativo y dispositivo. |
| Movimiento reducido | Emulación de prefers-reduced-motion y duración reducida de la animación global comprobadas. No se añadieron animaciones. |
| Contraste observado | Texto de la sección rgb(33,20,45) sobre blanco; estados de hitos incluyen texto, además de color. No se declara una auditoría completa de contraste o conformidad WCAG. |

## Límites pendientes

Permanecen los tres TODO de MongoDB real: índice único concurrente, persistencia del ciclo de vida y cascada. Los flujos aquí usan respuestas simuladas y no acreditan persistencia, transacciones, datos reales ni despliegue. La verificación integrada y evidencia de E2-T15 siguen fuera de este trabajo, al igual que las deudas D3/D4 y la atomicidad D9.
