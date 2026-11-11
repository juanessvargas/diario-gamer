# Spec 02 — Frontend de metas y rachas

## Estado, objetivo y fuentes

Fase 5. Documento para revisión, sin commit, implementación ni pruebas de interfaz realizadas en esta fase. Especifica E2-T02 y el trabajo de E2-T12 a E2-T15.

Fuentes: [enunciado](../../ENUNCIADO-E2.md), [AGENTS.md](../../AGENTS.md), [PRD](../prd/playlog-e2.md), [épicas](../backlog/epicas.md), [backlog](../backlog/E2-metas-y-rachas.md), [DESIGN.md](../../DESIGN.md) y [contrato backend](01-backend-metas-progreso.md).

Objetivo: gestionar metas y mostrar progreso, constancia e hitos desde el detalle existente de cada videojuego, conservando los flujos de P3.

## Alcance y exclusiones

Incluye formulario de creación/edición con hitos, confirmación para desactivar, sección de progreso semanal, servicio HTTP separado, carga/error/vacío, actualización de datos y revisión de accesibilidad y diseño.

NO DEBE añadir pantallas de historial de metas, gráficos, notificaciones, rankings, edición de partidas, reactivación de metas, botón nuevo para eliminar videojuegos ni seguimiento mensual automático. NO DEBE modificar el resumen de P3, las reglas aprobadas, la navegación principal ni los contratos de partidas. NO DEBE instalar dependencias o librerías de UI.

## Requisitos DEBE / NO DEBE

### Servicio y tipos

- F-01: todas las operaciones nuevas DEBEN estar en frontend/src/api/metasApi.ts; los componentes NO DEBEN ejecutar fetch directamente. Se DEBE conservar el patrón de base URL existente, sin leer archivos de entorno durante esta fase.
- F-02: tipos de Meta, sus entradas y ProgresoSemanal DEBEN añadirse a tipos.ts sin cambiar los contratos existentes. Los campos anulables DEBEN representarse como tales: null NO DEBE convertirse en cero para el porcentaje sin meta.
- F-03: el servicio DEBE exponer crearMeta, obtenerMeta, listarMetasVideojuego, actualizarMeta, desactivarMeta y obtenerProgresoSemanal de acuerdo con la spec 01. DEBE desenvolver { meta }, { total, metas } y { progreso }. Los fallos DEBEN producir un error interpretable por la interfaz, preservando el estado HTTP y el mensaje del servidor cuando sea adecuado mostrarlo.
- F-04: el detalle DEBE obtener la meta activa a partir de las metas del juego para gestionar su ID, y obtener el progreso calculado del backend. NO DEBE recomputar horas, días, rachas ni avance desde partidas en React.

### Formularios y acciones

- F-05: el formulario DEBE estar integrado en el detalle, en modo creación o edición de la meta activa. DEBE mostrar horas semanales, días objetivo y hasta cinco hitos con descripción y porcentaje. DEBE permitir una lista sin hitos; NO DEBE exigir enteros para horas o porcentajes de hitos.
- F-06: la validación DEBE coincidir con el backend: horas finitas > 0 y <= 100, días enteros 1–7, hitos numéricos 1–100 con descripción. Una entrada inválida DEBE explicar el problema y NO DEBE anunciar guardado. El servidor sigue siendo la autoridad incluso si se elude el formulario.
- F-07: editar DEBE precargar la meta existente y conservar su identidad. La creación/edición correcta DEBE renovar la meta y el progreso; un fallo NO DEBE cerrar como exitosa la operación. Mientras guarda, DEBE evitar envíos duplicados usando el patrón existente.
- F-08: desactivar DEBE pedir confirmación. Se propone window.confirm, ya usado para eliminar partidas, sin un modal ni biblioteca nuevos. Cancelar NO DEBE enviar la operación; confirmar correctamente DEBE dejar la sección sin meta activa y renovar el progreso. El historial anterior se conserva en backend sin crear una pantalla nueva.
- F-09: completado o abandonado NO DEBE ocultar ni bloquear la creación, edición o desactivación de la meta por ese motivo. NO DEBE dispararse desactivación automática.

### Progreso y reglas aprobadas

- F-10: la sección DEBE mostrar semana actual, horas frente a objetivo, porcentaje, días frente a objetivo, racha actual, mejor racha y hitos de la meta activa. Los datos DEBEN corresponder al videojuego abierto. Las fechas de semana ya son fechas civiles de Ecuador: NO DEBEN desplazarse un día al interpretarlas en otra zona del dispositivo.
- F-11: el texto del porcentaje DEBE conservar valores superiores a 100. El llenado visual y aria-valuenow DEBEN limitarse a 0–100 cuando se utilice una barra con ese rango; aria-valuetext o texto asociado DEBE comunicar el porcentaje real y horas frente a objetivo. NO DEBE sugerirse que cumplir solo horas equivale a cumplir los días.
- F-12: la presentación DEBE respetar RN-01 a RN-08 y RA-01 a RA-06 del PRD: día único por fecha, inicio como referencia, meta nueva sobre toda la semana, rachas históricas y explícita desactivación. NO DEBE introducir reglas distintas del cálculo backend.
- F-13: hitos DEBE mostrar descripcion, porcentajeObjetivo y estado calculado. NO DEBE mantener localmente un estado histórico «alcanzado» ni impedir que retroceda. NO DEBE confundirse con los logros ya existentes.
- F-14: REGLA RESUELTA Y LIMITACIÓN CONOCIDA: el estado de hitos DEBE proceder del avance original de P3, incluso si la sesión más reciente es futura. El frontend NO DEBE filtrarlo ni calcular otro avance. El caso de actividad cero y un hito alcanzado por una partida futura es válido. No se crea un aviso o control adicional no solicitado.
- F-15: sin meta activa DEBE mostrar actividad y rachas, sin porcentaje de cumplimiento ni hitos anteriores, e invitar a crear una. Sin partidas DEBE mostrar ceros y ningún hito alcanzado; con meta sin hitos DEBE representar la lista vacía sin tratarla como error.

### Estados y actualización

- F-16: loading, error, éxito con datos y éxito vacío DEBEN ser distinguibles. La sección nueva DEBE manejar su estado sin convertir un fallo de E2 en progreso cero ni reemplazar datos del resumen de P3. Un error DEBE usar un mensaje comprensible y NO DEBE exponer una traza interna.
- F-17: al crear, editar o desactivar correctamente una meta, DEBE volver a consultar metas y progreso. Ante un error de refresco posterior a un guardado correcto, DEBE distinguir que se guardó pero no pudo actualizarse la vista, sin anunciar que falló el guardado ni mostrar datos antiguos como recién consultados.
- F-18: al entrar al detalle DEBE consultar el progreso; registrar una partida ya navega hacia ese detalle y DEBE provocar una consulta nueva. Tras eliminar desde el historial, volver al detalle DEBE obtener progreso nuevo, sin reutilizar un resultado obsoleto. NO DEBE añadirse navegación automática desde el historial, polling ni WebSockets para ello. Si el flujo real no vuelve a montar el detalle, se DEBE resolver su recarga en el punto existente, sin agregar pantallas.
- F-19: cambiar el ID del detalle o abandonar la vista NO DEBE permitir que respuestas anteriores sobrescriban el juego actual. Se DEBE conservar el patrón de limpieza de useEffect o cancelación equivalente.

### Accesibilidad y diseño

- F-20: inputs DEBEN tener etiquetas asociadas y límites visibles; controles de hitos DEBEN tener nombre accesible. Los errores DEBEN poder identificarse sin depender solo del color. Carga DEBE comunicarse con role=status y error con role=alert cuando corresponda.
- F-21: los flujos DEBEN funcionar con teclado, foco visible y orden coherente. Se DEBE conservar el foco al guardar o mostrar errores y dirigirlo de forma coherente si desaparece el control tras desactivar. NO DEBE añadirse un diálogo que atrape foco sin gestionar su cierre.
- F-22: estilos nuevos DEBEN usar las variables existentes de DESIGN.md para colores, conservar DM Sans/Barlow Condensed, bordes oscuros, sombras sólidas, radios y espaciado del componente vecino. NO DEBE rediseñarse el CSS global, introducir colores de marca nuevos ni añadir librerías de UI.
- F-23: se DEBE revisar en navegador el detalle junto con los componentes nuevos, en escritorio y móvil, con zoom y teclado; comprobar etiquetas, mensajes, contraste observado, desbordamiento y movimiento reducido. NO DEBE declararse una auditoría completa de accesibilidad o conformidad sin evidencia.

## Contratos y comportamiento de integración

El servicio DEBE usar exactamente estas operaciones de la spec 01:

| Acción | Petición | Resultado para la interfaz |
| --- | --- | --- |
| Crear | POST /api/metas con videojuego, horasSemanales, diasPorSemana e hitos | Meta activa; renovar progreso |
| Obtener / listar | GET /api/metas/:id y GET /api/videojuegos/:id/metas | Meta o lista, incluidas anteriores sin pantalla nueva |
| Editar | PUT /api/metas/:id con horasSemanales, diasPorSemana e hitos | Misma meta con nuevos objetivos |
| Desactivar | PATCH /api/metas/:id/desactivar, después de confirmar | Meta inactiva; actividad sin objetivo si no queda activa |
| Consultar progreso | GET /api/videojuegos/:id/progreso-semanal | Desenvolver progreso y mostrar los datos sin recalcularlos |

El formulario NO envía cambios de videojuego ni de activa para editar. La sección conserva separados el avance general de P3, los logros existentes y el progreso semanal de E2. No se agrega un porcentaje de días no solicitado.

| Estado o error | Comportamiento esperado |
| --- | --- |
| Consulta en curso | Mensaje de carga; no aparenta lista vacía ni cero |
| Sin meta activa | Horas/días/rachas y llamada a crear meta; sin porcentaje ni hitos anteriores |
| Sin partidas | Actividad y rachas cero; hitos no alcanzados; mensaje de ausencia de sesiones |
| Meta sin hitos | Lista vacía, sin error y sin inventar hitos predeterminados |
| 400 | Explicar datos o identificador inválidos; no anunciar éxito |
| 404 | Explicar meta/juego no disponible; no crear una meta ficticia para sustituirlo |
| 409 | Explicar que ya existe una meta activa; no anunciar creación de otra |
| 500 o fallo de red | Mensaje comprensible; no cambiar a cero ni tratar como vacío |
| Guardado correcto y refresco fallido | Distinguir ambos resultados y no presentar la vista anterior como actualizada |

## Tabla criterio → verificación

N = navegador con datos de prueba y evidencia; C = contraste de contrato HTTP y resultados backend. Estas verificaciones son futuras. No existe hoy un runner de tests de componentes: NO se instala uno ni se presenta lint/tipos como sustituto de pruebas funcionales. Las funciones comprobables sin base en la spec backend sí tienen tests automatizados previstos.

| Criterio | Verificación prevista | Nivel |
| --- | --- | --- |
| CA-01.1 | Crear desde el detalle y comprobar meta activa del juego y progreso actualizado. | N/C |
| CA-01.2 | Horas inválidas/frontera, mensaje y ausencia de éxito; verificar rechazo servidor si se elude formulario. | N/C |
| CA-01.3 | Días fraccionarios/fuera de rango y fronteras 1/7. | N/C |
| CA-01.4 | Agregar/editar/quitar hitos; máximo cinco, descripciones y objetivos válidos; lista vacía permitida. | N/C |
| CA-01.5 | Conflicto 409 visible, sin anunciar una segunda creación. | N/C |
| CA-01.6 | Crear desde detalle de juego completado y abandonado sin bloqueo de interfaz. | N/C |
| CA-03.1 | Precargar y editar; mismo ID y datos actualizados. | N/C |
| CA-03.2 | Cambiar horas/días a mitad de semana y comprobar comparación inmediata, sin reiniciar actividad. | N/C |
| CA-03.3 | Edición inválida deja valores persistidos anteriores; no éxito falso. | N/C |
| CA-03.4 | Estado completado/abandonado conserva acciones y meta activa. | N/C |
| CA-04.1 | Acción desactivar muestra confirmación antes de enviar petición. | N |
| CA-04.2 | Cancelar no envía desactivación y conserva estado. | N/C |
| CA-04.3 | Confirmar actualiza estado; backend conserva meta e hitos. | N/C |
| CA-04.4 | Crear otra tras desactivar, sin nueva pantalla de historial y con anterior conservada. | N/C |
| CA-04.5 | Meta creada después de partidas semanales muestra su actividad acumulada. | N/C |
| CA-05.1 | Fechas de lunes/domingo no cambian al consultar desde un dispositivo con otra zona. | N/C |
| CA-05.6 | Caso 7 h / 5 h: texto 140 %, barra al 100 % y texto accesible real. | N/C |
| CA-05.7 | Mostrar ambos objetivos y comparar casos solo horas, solo días y ambos, sin equivalencia falsa. | N/C |
| CA-05.8 | Sin activa: actividad visible, invitación a crear, sin porcentaje ni hitos anteriores. | N/C |
| CA-05.9 | Sin partidas: ceros y ningún hito alcanzado; distinguirlo de carga. | N/C |
| CA-06.1 | Presentar sin alteración la racha viva hasta ayer. | N/C |
| CA-06.4 | Mostrar mejor racha histórica del contrato, aunque exceda días de esta semana. | N/C |
| CA-07.1 | Estados y objetivos de hitos coinciden con resultado backend, incluida igualdad. | N/C |
| CA-07.2 | Tras menor avance, un hito deja de estar marcado; no queda estado local histórico. | N/C |
| CA-07.3 | Caso futuro determina hito según P3 aunque no sume actividad; no recálculo frontend. | N/C |
| CA-09.1 | Crear y editar objetivos e hitos desde detalle; comprobar consulta nueva y resultado. | N/C |
| CA-09.2 | Demorar respuesta y observar carga, sin falso vacío o cero. | N |
| CA-09.3 | Provocar fallos de consulta/guardado y refresco; mensajes distinguen operación fallida de vista no actualizada. | N/C |
| CA-09.4 | Casos sin meta, sin partidas y sin hitos diferenciados. | N/C |
| CA-09.5 | Registrar y eliminar mediante flujos existentes; verificar en red una consulta nueva al detalle y datos modificados. | N/C |
| CA-09.6 | Revisión de diseño, teclado, etiquetas, foco, mensajes y movimiento reducido. | N |

Los criterios no repetidos aquí están cubiertos por la spec 01: consultas técnicas de metas, cálculo de actividad y rachas y cascada. La unión de las tablas cubre los 45 criterios originales; ninguno se renumera ni se reemplaza por los cinco de deuda técnica.

## Tabla ticket → archivos

Rutas relativas a la raíz. Las rutas nuevas son previstas para las fases de implementación.

| Ticket | Archivos previstos |
| --- | --- |
| E2-T02 | docs/specs/02-frontend-metas-rachas.md |
| E2-T12 | Nuevo: frontend/src/api/metasApi.ts; existente: frontend/src/tipos.ts |
| E2-T13 | Nuevos: frontend/src/componentes/FormularioMeta.tsx y FormularioMeta.css; existente: frontend/src/paginas/DetalleVideojuego.tsx |
| E2-T14 | Nuevos: frontend/src/componentes/ProgresoSemanal.tsx y ProgresoSemanal.css; existentes: frontend/src/paginas/DetalleVideojuego.tsx y DetalleVideojuego.css. Verificar frontend/src/paginas/NuevaPartida.tsx y ListaPartidas.tsx antes de proponer cambios necesarios; no modificarlos por defecto. |
| E2-T15 | Verificar componentes y flujos anteriores en navegador junto a los tests/contratos backend; guardar evidencia identificable para auditoría posterior, sin instalar herramientas nuevas |

E2-T01 y E2-T03 a E2-T11 están mapeados en la spec 01. DT-D3 y DT-D4 pertenecen a fase 8; no se corrigen al incorporar este formulario.

## Revisión visual prevista contra PLAYLOG!

| Referencia existente | Comprobación de la sección nueva |
| --- | --- |
| DetalleVideojuego.tsx y DetalleVideojuego.css | Sección semanal diferenciada del avance general; tarjetas, botones y jerarquía coherentes |
| FormularioVideojuego y NuevaPartida | Etiquetas, campos, ayudas, estados y bloqueo de doble envío compatibles |
| index.css y DESIGN.md | Variables de color, tipografías, foco naranja, bordes y sombras existentes; sin nuevos colores de marca |
| responsive.css y estilos del detalle | Móvil/escritorio, zoom, textos largos de hitos y ausencia de desbordamiento; no normalizar todos los breakpoints |
| Patrones role=status / role=alert y prefers-reduced-motion | Mensajes anunciables, movimiento reducido y error que no depende solo del color |

Cada comprobación DEBE registrar caso, resultado y evidencia cuando se realice. Hoy no hay capturas ni resultados inventados.

## Cierre y límites

Esta spec DEBE aprobarse y registrarse antes del código frontend. T12 depende de T02, T04, T05 y T10; T13 y T14 dependen de T12; T15 también requiere T11. El cliente consume los contratos de la spec 01, sin ajustes silenciosos del backend.

La regla de partidas futuras e hitos está resuelta y no bloquea implementación. Edición de partidas y medición mensual siguen pendientes como exclusiones de alcance, no como funciones a construir. La disponibilidad de una base de pruebas autorizada y de una sesión de navegador con señuelos condiciona la evidencia de integración, no autoriza acceder a datos reales. La revisión de esta fase es documental; no se declara E2 funcionando.
