# Demo PLAYLOG! 2.0 — máximo seis minutos

**Guion preparado; no hay una grabación acreditada.** Duración prevista: 5:50, con 10 segundos de margen. El 2026-11-10 ambas URLs existentes respondieron, pero la API todavía devolvió 404 «Ruta no encontrada» en E2: no presentar la versión pública observada como si ya tuviera metas. Preparación y límites en [entrega](verificacion/preparacion-entrega.md).

## Antes de iniciar el cronómetro

- Actualizar los dos servicios existentes y comprobar sus rutas E2. Alternativamente, usar un entorno local con MongoDB de pruebas autorizado; indicar claramente cuál. Las colecciones simuladas de T15 son una evidencia alternativa etiquetada, no una demo completa con MongoDB.
- Abrir [frontend](https://playlog-frontend.onrender.com), [backend](https://playlog-backend-osik.onrender.com), VS Code con la spec, tests, Git y auditoría. No mostrar terminales/configuraciones con credenciales.
- Crear **un videojuego propio de demo**, identificable por título `E2 DEMO — datos propios`, calificación 8 y sin meta activa. Anotar solo su ID para no operar sobre juegos de usuarios. No usar el ID ficticio de los tests contra producción.
- Para mostrar racha rota sin manipular el reloj real, preparar en ese juego cinco sesiones de fechas pasadas distintas que terminen al menos dos días antes de hoy. Por ejemplo, cinco días consecutivos de la semana anterior: mejor racha 5 y actual 0 si también ayer quedó vacío. No asumir que ya hay cinco días elegibles en la semana actual ni registrar futuro para fingir actividad.
- Usar horas actuales elegibles para las sesiones durante la demo. Si hay actividad semanal previamente preparada, adaptar las cifras esperadas al endpoint, sin recalcularlas a mano en la aplicación.
- Tener los comandos de D3 listos, el cuerpo del 409 abajo y el [PR preparado](PR-E2.md). La defensa oral y la grabación son acciones del estudiante, no hechos ya realizados.

## Cronograma

| Tiempo | Acción concreta | Resultado que debe observarse |
| --- | --- | --- |
| 0:00–0:25 | Mostrar la URL y abrir el detalle del juego propio de demo. Declarar entorno y commit realmente desplegado. | Diario P3 visible; sin meta activa; racha rota/mejor histórica si se prepararon los datos. No afirmar un SHA de Render sin comprobarlo. |
| 0:25–1:05 | Crear meta: 2 horas, 2 días; hitos «Mitad» al 50 % y «Final» al 100 %. Guardar. | Meta activa, consulta nueva, barra/objetivos y hitos visibles. |
| 1:05–1:55 | Registrar desde la acción existente una partida de hoy, 60 minutos y avance 50 %. Volver al detalle automáticamente. | Con semana inicialmente vacía: 1.0 h, 50 %, un día, racha 1 y «Mitad» alcanzado. La mejor racha puede seguir en 5. |
| 1:55–2:30 | Editar la misma meta a 1 hora, conservar 2 días. Mostrar en Network el PUT y la consulta nueva de progreso. | Mismo ID; actividad conservada; ahora 100 % de horas, pero solo 1/2 días: no confundir horas con cumplimiento completo. |
| 2:30–3:10 | Registrar otra sesión de hoy, 30 minutos y avance 40 %. | Si no había otra actividad semanal: 1.5 h, 150 % con barra al 100 %, sigue un solo día y racha 1; «Mitad» vuelve a pendiente. |
| 3:10–3:40 | Intentar una segunda meta activa mediante el POST preparado, solo para el ID del juego propio. | HTTP 409 y mensaje claro; una sola activa. La UI normal edita la activa, no ofrece duplicarla. |
| 3:40–4:35 | Recorrer RN-05 → HU-E2-05 → CA-05.6 → T06/T07/T10/T14 → B-11/F-11 → test/código/auditoría. Mostrar `c9c99fe` anterior al código. | Cadena SDD real y pruebas identificables; sin afirmar ejecución CI inexistente. |
| 4:35–5:25 | D3: mostrar rechazo JSON 400 con requestId y control 500 en test. D4: quitar la calificación 8 del juego propio, guardar y consultar. Mostrar commits `c40e23d` / `7c6ac79`. | Error de cliente distinguido del interno; valor ausente tras lectura. Si MongoDB real aún no se verificó, indicarlo y mostrar la evidencia aislada como tal. |
| 5:25–5:50 | Mostrar resultados vigentes de las suites, auditoría, PR y pendientes. | Registro local: 343 aprobadas y tres TODO; actualizarlo solo si hay nueva ejecución. No presentar los TODO ni el despliegue como aprobados por tener documentación. |

## POST para provocar 409

En la consola del navegador, **estando en el detalle del juego de demo con meta activa**, comprobar primero que la URL contiene su ID. El siguiente código no usa claves ni contraseñas; apunta a la URL pública ya indicada por el estudiante. No ejecutarlo si todavía no se ha publicado E2, si no es tu juego o si no hay meta activa.

```js
const idDemo = location.pathname.split('/').filter(Boolean).at(-1);
if (!/^[a-f\d]{24}$/i.test(idDemo)) throw new Error('Abre el detalle del juego propio de demo');
const respuesta409 = await fetch('https://playlog-backend-osik.onrender.com/api/metas', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ videojuego: idDemo, horasSemanales: 1, diasPorSemana: 1, hitos: [] }),
});
console.log(respuesta409.status, await respuesta409.json());
```

Para D3 puede mostrarse `backend/node_modules/.bin/tsx --test backend/test/deuda-d3.test.ts`: son pruebas HTTP con dobles, no producción. No provocar un error interno real en Render para demostrar un 500. Para la trazabilidad, abrir [spec backend](specs/01-backend-metas-progreso.md), [test de progreso](../backend/test/progreso.test.ts), [dominio](../backend/src/dominio/progreso.ts) y [CA-05.6 auditado](AUDITORIA.md).

No es necesario borrar ningún juego para esta demo. Si se limpian datos después, eliminar exclusivamente los propios, tras identificar sus IDs y confirmar el entorno; nunca usar borrados masivos ni datos de usuarios como señuelos. Una demo con producción no sustituye las cuatro verificaciones pendientes de MongoDB aislado.
