# Auditoría E2 y deuda técnica

2026-11-10. Base: `7c6ac79`, rama `feature/e2-metas-rachas`. Solo se modifica documentación. Fuentes: [enunciado](../ENUNCIADO-E2.md), [PRD](prd/playlog-e2.md), [backlog](backlog/E2-metas-y-rachas.md) y specs [backend](specs/01-backend-metas-progreso.md) / [frontend](specs/02-frontend-metas-rachas.md).

**Cumplido** significa evidencia suficiente en el nivel indicado, no certificación de producción. **Parcial** significa implementado, con una verificación exigida todavía ausente. **Pendiente** significa sin evidencia suficiente. A = aislado/dominio/modelo; H = Express real con colecciones simuladas; N = Chrome con API ficticia; R = Chrome → Vite → Express → servicios/Mongoose/dominio reales, **colecciones simuladas**. I = MongoDB real: no ejecutado.

Los 45 criterios E2 únicos y cinco de deuda suman **37 cumplidos, 13 parciales y 0 pendientes**: E2 34/11/0, deuda 3/2/0. Cero pendientes en esos identificadores no cierra los requisitos externos de la [checklist](checklist-rubrica.md). Se unifican los criterios repetidos entre specs sin renumerarlos. Los parciales cubren persistencia, concurrencia, cascada y D4.

La [preparación final](verificacion/preparacion-entrega.md) reclasifica únicamente CA-03.3: la spec exige A/H y las pruebas comprueban validación previa a toda escritura. Esto no cierra el TODO de ciclo de vida persistido en MongoDB ni modifica los requisitos.

## Verificaciones ejecutadas en este cierre

| Suite | Aprobadas | Fallos | TODO | Nivel |
| --- | ---: | ---: | ---: | --- |
| Backend completo, incluidos T15 y D3/D4 | 260 | 0 | 3 | A/H/R, no I |
| API frontend | 14 | 0 | 0 | fetch sustituido |
| Navegador y limpieza del runner | 43 | 0 | 0 | N y pruebas de infraestructura |
| Hook | 26 | 0 | 0 | Eventos simulados y CLI, no VS Code |
| Total versionado | **343** | **0** | **3** | Incluye contenedores node:test |

TypeScript backend, todos sus tests TS, frontend app y configuración Vite: sin errores. Lint frontend, build backend, `tsc -b` y build frontend con `envDir: false`: sin errores. No se ejecutó el arranque contra MongoDB. No existe lint backend ni `npm test`. Las advertencias existentes de Mongoose por opciones/métodos obsoletos no fueron fallos. Los comandos reproducibles están en [README](../README.md) y las evidencias [T15](verificacion/E2-T15.md), [D3](verificacion/DT-D3.md) y [D4](verificacion/DT-D4.md).

Se ejecutaron además 12 peticiones con curl contra Express aislado: [tabla y script](verificacion/curl-E2.md). Su escenario adicional aprobado no se suma a las 343 pruebas versionadas ni acredita MongoDB real. Las suites de Chrome se ejecutaron secuencialmente.

## Criterio → implementación → prueba y resultado

Las referencias de archivos se definen al final. «Aprobado» se limita a las aserciones ejecutadas; no supone un resultado de I.

Algunos nombres de tests agrupan identificadores abreviados: por ejemplo `CA-04.1/04.2/04.3/04.4` incluye la cancelación CA-04.2, y `CA-01.1/01.6/09.1` incluye el formulario CA-09.1. La ausencia de una repetición literal del prefijo en esos nombres no se trata como ausencia de sus aserciones.

| ID | Requisito | Archivo / función | Prueba y resultado verificable | Estado |
| --- | --- | --- | --- | --- |
| CA-01.1 | Crear meta válida, asociada y activa | [Meta][MM], [crearMeta][MS], [FormularioMeta][EF] | [TM]/[TS]/[TH]/[TI]: A/H/R aprobados; persistencia I pendiente. | Parcial |
| CA-01.2 | Horas >0 y <=100 | [Meta][MM], [validarObjetivos][MS], [validar][EF] | [TM]/[TS]/[TF]/[TI]: fronteras, tipos y bypass del formulario aprobados. | Cumplido |
| CA-01.3 | Días enteros 1–7 | [MM], [MS], [EF] | [TM]/[TS]/[TF]/[TI]: inválidos y fronteras aprobados. | Cumplido |
| CA-01.4 | Máximo cinco hitos válidos | [MM], [MS], [EF] | [TM]/[TS]/[TF]/[TI]: vacío/cinco/seis, descripción/objetivo y agregar/quitar aprobados. | Cumplido |
| CA-01.5 | Una activa y conflicto 409 | [índice parcial][MM], [crearMeta][MS] | [TS]/[TH]/[TI]/[TF]: 409 y carrera simulada aprobados; índice/concurrencia I pendientes. | Parcial |
| CA-01.6 | Permitir completado/abandonado | [crearMeta][MS], [EF] | [TS]/[TF]/[TI]: estados sin restricción ni desactivación automática, aprobados. | Cumplido |
| CA-02.1 | Consultar meta por ID | [obtenerMeta][MS], [metasApi][MA] | [TS]/[TH]/[TA]/[TI]: respuesta activa/inactiva aprobada; lectura persistida pendiente. | Parcial |
| CA-02.2 | Listar propias sin mezclar ajenas | [listarMetasPorVideojuego][MS] | [TS]/[TH]/[TI]: filtros e historial aprobados; persistencia I pendiente. | Parcial |
| CA-02.3 | Lista vacía exitosa | [listarMetasPorVideojuego][MS], [MA] | [TS]/[TH]/[TA]/[TI]: vacío no confundido con 404. | Cumplido |
| CA-03.1 | Editar misma identidad/asociación | [actualizarMeta][MS], [EF] | [TS]/[TH]/[TF]/[TI]: ID/referencia conservados; persistencia I pendiente. | Parcial |
| CA-03.2 | Objetivos nuevos sobre toda la semana | [MS], [servicio progreso][PS], [detalle][ED] | [TPH]/[TN]/[TI]: 7 h, objetivo 5→10, porcentaje 140→70 sin reiniciar actividad. | Cumplido |
| CA-03.3 | Edición inválida conserva datos | [validarObjetivos / actualizarMeta][MS] | [TS]/[TH]/[TF]/[TI]: 400, datos anteriores intactos y cero escrituras en dobles; validación anterior a set/save. A/H exigidos cubiertos; no certifica I. | Cumplido |
| CA-03.4 | Estado no desactiva meta | [actualizarVideojuego][VS], [MM] | [TS]/[TI]: activa conservada en H/R; verificar persistencia I. | Parcial |
| CA-04.1 | Confirmar desactivación | [window.confirm / operar][EF] | [TF]/[TI]: confirmación condiciona petición; diálogo nativo en R. | Cumplido |
| CA-04.2 | Cancelar conserva activa | [EF] | [TF]/[TI]: sin PATCH en N; estado posterior conservado en R. | Cumplido |
| CA-04.3 | Desactivar conserva objetivos/hitos | [desactivarMeta][MS] | [TS]/[TH]/[TF]/[TI]: aprobado H/R; conservación persistida I pendiente. | Parcial |
| CA-04.4 | Reemplazar conserva anterior | [crearMeta / desactivarMeta][MS], [EF] | [TS]/[TH]/[TF]/[TI]: dos metas, una activa en memoria; historial I pendiente. | Parcial |
| CA-04.5 | Contar sesiones anteriores a crear meta | [calcularActividadSemanal][DP], [PS] | [TP]/[TPH]/[TI]: creación posterior a sesiones conserva su actividad elegible. | Cumplido |
| CA-05.1 | Semana de Ecuador, lunes-domingo | [calcularSemana][DP], [ProgresoSemanal][EP] | [TP]/[TPH]/[TN]/[TI]: calendario y fechas civiles sin desplazamiento. | Cumplido |
| CA-05.2 | Minutos a horas con un decimal | [calcularActividadSemanal][DP] | [TP]/[TPH]/[TN]/[TI]: suma/redondeos; 5×84 minutos produce 7 h. | Cumplido |
| CA-05.3 | Un día, todas las duraciones | [calcularActividadSemanal][DP] | [TP]: mismo día suma tiempo y cuenta una fecha, aprobado. | Cumplido |
| CA-05.4 | Asignar al día de inicio | [calcularActividadSemanal][DP] | [TP]: medianoche y domingo-lunes sin dividir duración, aprobado. | Cumplido |
| CA-05.5 | Excluir actividad futura | [partidasElegibles][DP] | [TP]/[TPH]/[TI]: consulta anterior/igual/posterior y caso futuro, aprobados. | Cumplido |
| CA-05.6 | Porcentaje entero sin tope; barra limitada | [calcularActividadSemanal][DP], [EP] | [TP]/[TPH]/[TN]/[TI]: 140 % real, ancho y aria-valuenow 100. | Cumplido |
| CA-05.7 | Exigir horas y días | [cumpleMetaSemanal][DP], [EP] | [TP]: solo horas/días, ambos y ninguno; N/R presentan ambos objetivos. | Cumplido |
| CA-05.8 | Sin activa, actividad sin hitos anteriores | [PS], [EP] | [TPH]/[TN]/[TI]: meta/porcentaje null, hitos vacíos e invitación. | Cumplido |
| CA-05.9 | Sin partidas: ceros e hitos pendientes | [DP], [PS], [EP] | [TP]/[THI]/[TPH]/[TN]/[TI]: vacío distinguible de carga/error. | Cumplido |
| CA-05.10 | Separar juegos y semanas | [partidasElegibles / calcularActividadSemanal][DP], [ED] | [TP]/[TPH]/[TN]: filtros y respuesta tardía de otro ID descartada. | Cumplido |
| CA-06.1 | Racha de ayer viva hoy | [calcularRachas][DP] | [TP]/[TPH]/[TN]: secuencia hasta ayer conservada. | Cumplido |
| CA-06.2 | Hoy añade un día máximo | [calcularRachas][DP] | [TP]/[TI]: registro de hoy incrementa; duplicados diarios no duplican en A. | Cumplido |
| CA-06.3 | Día completo vacío rompe racha | [calcularRachas][DP] | [TP]/[TI]: lunes-viernes, sábado vacío y domingo: racha 0. | Cumplido |
| CA-06.4 | Mejor racha histórica | [calcularRachas][DP], [EP] | [TP]/[TPH]/[TN]/[TI]: secuencias, duplicados e historia anterior a semana/meta en A. | Cumplido |
| CA-06.5 | Futuras no cuentan en rachas | [calcularRachas / partidasElegibles][DP] | [TP]/[TPH]/[TI]: exclusión y avance del reloj aprobados. | Cumplido |
| CA-07.1 | Alcanzado si avance >= objetivo | [calcularHitos][DP], [EP] | [THI]/[TPH]/[TN]/[TI]: inferior/igual/superior y límites 1/100. | Cumplido |
| CA-07.2 | Descenso revierte hito | [calcularHitos][DP], [PS] | [THI]/[TPH]/[TN]/[TI]: 60→40 revierte 50 y borrar recupera avance anterior. | Cumplido |
| CA-07.3 | Resumen P3, sin segundo avance | [PS], [obtenerResumenVideojuego][P3] | [TPH]/[THI]/[TN]/[TI]: orden fecha/createdAt/_id y futura 80 con actividad 0. | Cumplido |
| CA-08.1 | Cascada de activas/inactivas e hitos | [eliminarVideojuego][VS] | [TC]/[TI]: H/R aprobados; cascada I pendiente. | Parcial |
| CA-08.2 | Conservar datos ajenos | [eliminarVideojuego][VS] | [TC]/[TI]: juegos/partidas/metas ajenos intactos en dobles; comprobar I. | Parcial |
| CA-08.3 | Sin metas conserva borrado P3 | [eliminarVideojuego][VS] | [TC]/[TI]/[curl](verificacion/curl-E2.md): 204/400/404; cascada I pendiente. | Parcial |
| CA-09.1 | Formulario y resultado actualizado | [EF], [ED], [MA] | [TF]/[TN]/[TI]: creación/edición y nuevas consultas aprobadas. | Cumplido |
| CA-09.2 | Carga distinguible de cero/vacío | [EF], [EP] | [TF]/[TN]/[TI]: demora y bloqueo de doble envío aprobados. | Cumplido |
| CA-09.3 | Error comprensible sin éxito falso | [ErrorMetasApi][MA], [EF], [ED] | [TA]/[TF]/[TN]/[TI]: HTTP/red/refresco fallido; 503 inyectado, no incidente espontáneo. | Cumplido |
| CA-09.4 | Distinguir vacíos | [EF], [EP] | [TF]/[TN]/[TI]: sin meta, partidas e hitos diferenciados. | Cumplido |
| CA-09.5 | Refresco tras registro/eliminación | [ED], NuevaPartida/ListaPartidas existentes | [TN]/[TI]: pantallas originales y nueva consulta al volver; edición queda excluida por PRD. | Cumplido |
| CA-09.6 | Identidad visual, teclado y foco | [EF], [EP] y sus CSS | [TF]/[TN]/[TI], [revisión](../frontend/test/README.md): responsive/zoom/foco/movimiento reducido; no certifica WCAG completa. | Cumplido |
| DT-CA-01 | JSON inválido 400 con ID | [app][APP], [errorHandler][EH] | [TD3]: JSON inválido P3/Meta y encabezado/cuerpo con mismo ID, aprobado H. | Cumplido |
| DT-CA-02 | Logro sin cuerpo 400 sin cambios | [actualizarLogro controlador][VC] | [TD3]: ausente/null/incorrecto rechazado sin escritura; válido 200. | Cumplido |
| DT-CA-03 | Error inesperado sigue siendo 500 | [errorHandler][EH] | [TD3]: Error y SyntaxError internos inyectados: 500 genérico con ID. | Cumplido |
| DT-CA-04 | Quitar y releer sin calificación | [actualizarVideojuego][VS], [formulario P3][EV] | [TD4]/[TD4N]: null→$unset y GET sin campo; persistencia I pendiente. | Parcial |
| DT-CA-05 | Omisión conserva calificación | [actualizarVideojuego][VS], [EV] | [TD4]/[TD4N]: conserva 8, cero válido, otros campos y rechazos; lectura persistida I pendiente. | Parcial |

## DEBE / NO DEBE numerados de ambas specs

Estas filas complementan los 50 criterios, no se suman a ese conteo. Su resultado reutiliza las pruebas anteriores.

| Backend | Implementación y verificación | Estado |
| --- | --- | --- |
| B-01 | [MM]/[MS], [TM]/[TS]/[TI]: referencia y ciclo de vida; persistencia pendiente. | Parcial |
| B-02 | [MM]/[MS], [TM]/[TS]/[TH]/[TI]: horas, días y tipos. | Cumplido |
| B-03 | [MM]/[MS], [TM]/[TS]/[TI]: límites e hitos opcionales. | Cumplido |
| B-04 | [MM], [TM]: defaults/timestamps y sin alcanzado; escritura real pendiente. | Parcial |
| B-05 | [MM]/[MS], [TS]/[TH]/[TI]: duplicado simulado; índice real pendiente. | Parcial |
| B-06 | [MS], [TS]/[TH]/[TI]: identidad, campos protegidos e historial; persistencia pendiente. | Parcial |
| B-07 | [MS]/[VS], [TS]/[TI]: estados; conservación persistida pendiente. | Parcial |
| B-08 | [DP]/[PS], [TP]/[THI]/[TPH]: capas, reloj explícito y no mutación. | Cumplido |
| B-09 | [DP], [TP]: semana y fronteras Ecuador. | Cumplido |
| B-10 | [DP], [TP]/[TPH]: elegibilidad y día de inicio. | Cumplido |
| B-11 | [DP], [TP]/[TPH]/[TI]: suma, redondeo, porcentaje y días. | Cumplido |
| B-12 | [DP], [TP]: rachas históricas y duplicados. | Cumplido |
| B-13 | [MS]/[PS]/[DP], [TP]/[TPH]/[TI]: semana completa y ambos mínimos. | Cumplido |
| B-14 | [DP], [THI]: hitos puros, reversibles, sin mutar. | Cumplido |
| B-15 | [PS]/[P3], [TPH]/[TI]: avance futuro P3 conservado. | Cumplido |
| B-16 | [PS]/[DP], [TPH]/[TI]: ceros/null/vacíos y diferencia de futuro. | Cumplido |
| B-17 | [PS], [TPH]/[TI]: llama dominio y resumen original, sin modificarlo. | Cumplido |
| B-18 | [MS]/[EH], [TH]/[TPH]/[TI]: ApiError, 400/404/409/500; no prueba MongoDB. | Cumplido |
| B-19 | [VS], [TC]/[TI]: cascada y fallo simulado sin prometer rollback; falta I. | Parcial |
| B-20 | Git y [TP]/[THI]/[TS]: tests de dominio anteriores al código y niveles separados. | Cumplido |

| Frontend | Implementación y verificación | Estado |
| --- | --- | --- |
| F-01 | [MA], [TA]: fetch separado y base URL existente. | Cumplido |
| F-02 | [tipos][FT], tipos y [TA]/[TN]: null conservado; D4 es corrección separada documentada. | Cumplido |
| F-03 | [MA], [TA]: seis operaciones, envoltorios y errores HTTP/red. | Cumplido |
| F-04 | [EF]/[ED], [TI]/[TN]: activa del listado y métricas recibidas sin recálculo. | Cumplido |
| F-05 | [EF], [TF]: formulario, hitos opcionales y fracciones admitidas. | Cumplido |
| F-06 | [EF], [TF]/[TI]: límites y autoridad backend al eludir UI. | Cumplido |
| F-07 | [EF], [TF]/[TI]: precarga, identidad, refresco y doble envío. | Cumplido |
| F-08 | [EF], [TF]/[TI]: cancelación/confirmación, sin pantalla histórica. | Cumplido |
| F-09 | [EF], [TF]/[TI]: completado/abandonado sin bloqueo. | Cumplido |
| F-10 | [EP], [TN]/[TI]: campos del contrato y fechas civiles. | Cumplido |
| F-11 | [EP], [TN]/[TI]: porcentaje real y barra/ARIA limitada. | Cumplido |
| F-12 | [EP]/[ED]/[EF], [TN]/[TI] y A: reglas RN/RA sin otro cálculo. | Cumplido |
| F-13 | [EP], [TN]/[TI]: hitos sin estado histórico local. | Cumplido |
| F-14 | [EP], [TN]/[TI]: hito futuro con actividad cero. | Cumplido |
| F-15 | [EP], [TN]/[TI]: vacíos y actividad sin meta. | Cumplido |
| F-16 | [EP]/[EF]/[ED], [TF]/[TN]/[TI]: carga/error/vacío separados de P3. | Cumplido |
| F-17 | [EF]/[ED], [TF]/[TN]/[TI]: guardado y refresco fallido diferenciados. | Cumplido |
| F-18 | [ED], [TN]/[TI]: consulta al volver de registrar/eliminar, sin polling. | Cumplido |
| F-19 | [ED]/[EF], [TN]: limpieza y respuesta tardía descartada. | Cumplido |
| F-20 | [EF]/[EP], [TF]/[TN]/[TI]: labels, nombres, status y alert. | Cumplido |
| F-21 | [EF], [TF]/[TI]: tab, foco, mensajes, desactivación y quitar hito. | Cumplido |
| F-22 | CSS de [EF]/[EP], DESIGN.md y [revisión](../frontend/test/README.md): tokens, sin nueva biblioteca/paleta. | Cumplido |
| F-23 | [TN] y revisión: escritorio/móvil, zoom, texto ampliado, contraste observado y movimiento reducido; capturas temporales, no auditoría completa. | Cumplido |

## Pendientes y trazabilidad

Tres TODO existentes en [TS] y [TC]: ciclo de vida de Meta, índice único concurrente y cascada contra MongoDB autorizado. No se ejecutaron ni aprobaron en I. La persistencia real de D4 también falta; no tener un cuarto TODO ejecutable no significa que esté verificada.

Edición de partidas, equivalencia docente de Codex, activación/captura del harness, plantilla, Render, PR y demo están en la [checklist](checklist-rubrica.md). La métrica mensual no se midió; RAWG, instalación limpia y arranque con base real no se acreditaron. D9 sigue diferida; un fallo simulado no demuestra atomicidad.

Actualización de entrega: ambos servicios Render respondieron 200 y su comunicación básica se comprobó en navegador, pero las rutas E2 observadas devuelven 404 «Ruta no encontrada». El estudiante confirmó manualmente que la plantilla contiene valores ficticios; su inspección automatizada sigue bloqueada. Gestionará GitHub y Render manualmente. Se prepararon [PR](PR-E2.md) y [guion de demo](DEMO-E2.md), sin publicar, fusionar, desplegar ni grabar. Detalles y límites en [preparación final](verificacion/preparacion-entrega.md).

Se comprobó mediante ancestros Git que `c9c99fe` precede a `cdb1edb` y `4ec3c6f`, y los pares `98ecdde`→`cdb1edb`, `ad2be13`→`331e68e`, `8e5f28c`→`965ff16`. Frontend/deudas documentan su etapa roja/verde sin inventar commits separados de tests cuando no existen.

Ejemplo de trazabilidad para la demo: PRD RN-05 → HU-E2-05 → CA-05.6 → T06/T07/T10/T14 → B-11/F-11 → [TP]/[TPH]/[TN] → [DP]/[PS]/[EP] → fila CA-05.6. Esto no acredita una demo ya presentada.

En esta revisión el guard PLAYLOG_ENV_GUARD rechazó búsquedas por su patrón, incluso una consulta de metadatos que no abría archivos protegidos. No se tomó como prueba controlada de VS Code ni del perfil seleccionado. El [harness histórico](harness-codex.md) conserva sus seis rechazos ficticios, el fallo de la plantilla y las comprobaciones no ejecutadas; no se repitieron experimentos de permisos.

[MM]: ../backend/src/modelos/Meta.model.ts
[MS]: ../backend/src/services/metas.service.ts
[DP]: ../backend/src/dominio/progreso.ts
[PS]: ../backend/src/services/progreso.service.ts
[P3]: ../backend/src/services/partidas.service.ts
[VS]: ../backend/src/services/videojuegos.service.ts
[VC]: ../backend/src/controllers/videojuegos.controller.ts
[APP]: ../backend/src/app.ts
[EH]: ../backend/src/middlewares/errorHandler.ts
[MA]: ../frontend/src/api/metasApi.ts
[EF]: ../frontend/src/componentes/FormularioMeta.tsx
[EP]: ../frontend/src/componentes/ProgresoSemanal.tsx
[ED]: ../frontend/src/paginas/DetalleVideojuego.tsx
[EV]: ../frontend/src/paginas/FormularioVideojuego.tsx
[FT]: ../frontend/src/tipos.ts
[TM]: ../backend/test/metas.model.test.ts
[TS]: ../backend/test/metas.service.test.ts
[TH]: ../backend/test/metas.http.test.ts
[TP]: ../backend/test/progreso.test.ts
[THI]: ../backend/test/hitos.test.ts
[TPH]: ../backend/test/progreso.http.test.ts
[TC]: ../backend/test/videojuegos.eliminacion.test.ts
[TI]: ../backend/test/integracion.e2.test.ts
[TF]: ../frontend/test/formularioMeta.test.mjs
[TN]: ../frontend/test/progresoSemanal.test.mjs
[TA]: ../frontend/test/metasApi.test.ts
[TD3]: ../backend/test/deuda-d3.test.ts
[TD4]: ../backend/test/deuda-d4.test.ts
[TD4N]: ../backend/test/deuda-d4.interfaz.test.ts
