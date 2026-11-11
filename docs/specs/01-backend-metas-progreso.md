# Spec 01 — Backend de metas y progreso semanal

> Nota de cierre documental: aprobada y registrada en `c9c99fe` antes del código. Los estados futuros que siguen corresponden a fase 5; la verificación actual está en [auditoría](../AUDITORIA.md). D3/D4 se corrigieron después en sus commits de fase 8, con los límites de persistencia allí indicados. No se reescriben los requisitos para acomodar resultados.

## Estado, objetivo y fuentes

Fase 5. Documento para revisión, todavía sin commit, implementación ni tests de E2. Especifica E2-T01 y el trabajo backend de E2-T03 a E2-T11, con verificación integrada en E2-T15. Aprobar este texto no acredita que sus requisitos funcionen.

Fuentes: [enunciado](../../ENUNCIADO-E2.md), [AGENTS.md](../../AGENTS.md), [PRD](../prd/playlog-e2.md), [épicas](../backlog/epicas.md), [backlog y criterios](../backlog/E2-metas-y-rachas.md). La [spec frontend](02-frontend-metas-rachas.md) consume estos contratos.

Objetivo: gestionar metas por videojuego y calcular actividad semanal, rachas e hitos sin alterar los contratos de P3.

## Alcance y exclusiones

Incluye crear, consultar, listar, editar y desactivar metas; restricciones y unicidad concurrente; progreso semanal; funciones puras; errores; cascada al borrar un videojuego y pruebas asociadas.

NO DEBE modificar los modelos Videojuego y Partida, el significado ni la implementación de obtenerResumenVideojuego, ni las rutas existentes del resumen. NO DEBE añadir edición de partidas, reactivación de metas, eliminación individual de metas, gráficos, notificaciones, rankings o seguimiento mensual automático.

D3 y D4 siguen en fase 8. D9 sigue diferido: la cascada debe eliminar metas, pero no se promete atomicidad ni se añaden transacciones en este alcance. No se instalan dependencias nuevas.

## Requisitos DEBE / NO DEBE

### Justificación del modelo

Meta se referencia porque tiene creación, edición, desactivación, reemplazo e historial propios, sin sustituir la ficha de Videojuego. Los hitos se embeben porque son como máximo cinco y solo tienen sentido durante la vida de su meta. `alcanzado` no se persiste: se deriva del avance actual del resumen P3, evitando duplicar un estado que debe revertirse cuando baja ese avance. Esta explicación explicita las decisiones ya presentes en B-01, B-03, B-04 y B-14; no añade campos ni operaciones.

### Datos y validación

- B-01: Meta DEBE pertenecer a una colección propia, con videojuego como ObjectId obligatorio y referencia a Videojuego. El servicio DEBE comprobar que el juego existe. Su ciclo de vida es independiente de la ficha del juego.
- B-02: horasSemanales DEBE ser un número finito mayor que cero y menor o igual que 100. diasPorSemana DEBE ser un número entero entre 1 y 7. El contrato HTTP NO DEBE aceptar cadenas numéricas como sustituto de números.
- B-03: hitos DEBE ser un arreglo de hasta cinco elementos, cada uno con descripcion de tipo string no vacía y porcentajeObjetivo numérico finito entre 1 y 100. NO DEBE exigir que ese porcentaje sea entero ni imponer un mínimo de hitos. Al crear, omitir hitos equivale a un arreglo vacío.
- B-04: activa DEBE tener valor predeterminado true; createdAt y updatedAt DEBEN gestionarse mediante timestamps. NO DEBE persistirse alcanzado: es un resultado calculado.
- B-05: DEBE existir como máximo una meta activa por videojuego. Se DEBE declarar un índice único sobre videojuego con filtro parcial activa: true; las inactivas no consumen esa unicidad. La comprobación previa del servicio NO DEBE ser la única defensa ante concurrencia.
- B-06: crear DEBE generar una meta activa. Editar DEBE modificar la misma meta y solo sus objetivos e hitos, conservando videojuego, identidad, estado y fecha de creación. NO DEBE permitir reactivar ni reasociar metas mediante el cuerpo de edición. Desactivar DEBE conservar el documento e hitos; repetir la desactivación de una meta existente devuelve su estado inactivo sin crear otra.
- B-07: el estado completado o abandonado del juego NO DEBE impedir crear o conservar su meta activa ni provocar desactivación automática.

### Arquitectura y cálculos

- B-08: DEBE mantenerse rutas → controladores → servicios → modelos. El dominio DEBE vivir en src/dominio/progreso.ts y recibir datos simples y un instante de consulta explícito, sin MongoDB, llamadas HTTP, efectos secundarios ni lectura interna de un reloj variable.
- B-09: semana, fechas diarias y rachas DEBEN interpretarse en America/Guayaquil. La semana DEBE ser el intervalo desde el lunes a las 00:00 inclusive hasta el lunes siguiente a las 00:00 exclusive. inicio y fin públicos DEBEN ser fechas locales YYYY-MM-DD de lunes y domingo.
- B-10: para horas, días y rachas, una partida DEBE ser elegible cuando fecha <= instante de consulta. Su fecha representa el inicio. Toda su duración DEBE asignarse a ese día local, incluso si termina otro día o semana. NO DEBE fraccionarse.
- B-11: horasSemana DEBE sumar los minutos elegibles de la semana y dividir entre 60, redondeando a un decimal. porcentajeHoras DEBE usar esas horas redondeadas / horasSemanales × 100, redondeado a entero y sin tope superior. diasJugadosSemana DEBE contar fechas locales distintas, sin duplicar un día por varias partidas.
- B-12: rachaActual DEBE medir la secuencia que llega a hoy o, sin actividad hoy, a ayer. Si no llega a ninguno, DEBE ser cero. mejorRacha DEBE ser la secuencia más larga del historial elegible. Ambas DEBEN ignorar orden de entrada y duplicados diarios; NO DEBEN limitarse a la semana o a la creación de la meta.
- B-13: editar objetivos DEBE aplicarlos a toda la semana actual. Crear o reemplazar meta DEBE incluir la actividad elegible anterior de esa semana. Cumplir la semana requiere alcanzar tanto horas como días objetivo; NO DEBE compensarse uno con el otro. No se añade un campo de evaluación mensual al contrato.
- B-14: hitos DEBE calcularse mediante una función pura que reciba los hitos y porcentajeAvance del resumen original de P3. alcanzado DEBE ser porcentajeAvance >= porcentajeObjetivo. DEBE revertirse si disminuye el avance. NO DEBE calcular otro avance desde las partidas ni tomar su máximo histórico.
- B-15: REGLA RESUELTA Y LIMITACIÓN CONOCIDA: el servicio DEBE obtener el avance mediante obtenerResumenVideojuego existente, incluso si procede de una partida futura. NO DEBE filtrar esa entrada del resumen. Una partida futura puede alcanzar hitos mientras suma cero actividad en E2. Esto NO bloquea E2-T08 ni E2-T09.
- B-16: sin meta activa, DEBE devolver meta: null, porcentajeHoras: null e hitos: [], calculando horas, días y rachas igualmente. Sin ninguna partida, DEBE devolver horas, días y rachas en cero, con ningún hito alcanzado. Si solo hay partidas futuras, B-15 permite hitos alcanzados aunque la actividad sea cero.

### Integración, errores y eliminación

- B-17: los servicios DEBEN consultar los datos y llamar al dominio. El servicio de progreso DEBE separar las partidas elegibles para actividad del avance recibido del resumen. NO DEBE cambiar partidas.service.ts para introducir las reglas de E2.
- B-18: las rutas nuevas DEBEN validar IDs y cuerpos antes de guardar; los errores esperados DEBEN convertirse en ApiError y pasar al errorHandler existente. Un conflicto del índice de meta activa DEBE convertirse en 409, sin convertir otros errores inesperados en conflictos.
- B-19: al eliminar correctamente un juego, videojuegos.service.ts DEBE borrar todas sus metas mediante su referencia, incluidas inactivas, con sus hitos embebidos, además de conservar la eliminación existente de partidas. NO DEBE afectar datos de otros juegos. Si una operación falla, NO DEBE responder éxito ni afirmar reversión de borrados anteriores; D9 sigue vigente.
- B-20: los tests de dominio y los casos verificables sin base DEBEN automatizarse antes del código correspondiente. La integración real DEBE diferenciarse de pruebas con dobles y ejecutarse solo con una base de pruebas autorizada. NO DEBE accederse a datos reales ni archivos de entorno para simular un caso.

## Contratos HTTP

Todas las rutas son nuevas excepto la eliminación de videojuego existente. Los cuerpos son objetos JSON. Los controladores DEBEN devolver los envoltorios que ya utiliza PLAYLOG!, sin introducir una envoltura global distinta.

| Método y ruta | Entrada | Éxito |
| --- | --- | --- |
| POST /api/metas | videojuego, horasSemanales, diasPorSemana; hitos opcional | 201, { meta } activa |
| GET /api/metas/:id | ID de meta | 200, { meta } |
| GET /api/videojuegos/:id/metas | ID de videojuego | 200, { total, metas }; incluye activas e inactivas del juego |
| PUT /api/metas/:id | horasSemanales, diasPorSemana e hitos; edición de los objetivos completos | 200, { meta } con la misma identidad |
| PATCH /api/metas/:id/desactivar | ID de meta; no requiere cuerpo | 200, { meta } con activa: false |
| GET /api/videojuegos/:id/progreso-semanal | ID de videojuego; semana actual determinada por el servidor | 200, { progreso } |
| DELETE /api/videojuegos/:id | Contrato existente | 204 sin cuerpo; cascada ampliada a metas |

Meta devuelta DEBE incluir _id, videojuego, horasSemanales, diasPorSemana, activa, hitos, createdAt y updatedAt. Los hitos contienen descripcion y porcentajeObjetivo; sus identificadores internos, si los genera Mongoose, no representan una operación nueva de producto. Una lista sin metas DEBE tener total: 0 y metas: []. No se crea listado histórico adicional en la interfaz.

El objeto progreso DEBE tener este contrato:

| Campo | Tipo y significado |
| --- | --- |
| semana | { inicio: string, fin: string }, fechas de lunes y domingo locales |
| meta | { horasSemanales: number, diasPorSemana: number } o null |
| horasSemana | number, redondeado a un decimal; JSON no exige conservar un cero final |
| porcentajeHoras | number entero sin tope o null sin meta activa |
| diasJugadosSemana | number entero de 0 a 7 |
| rachaActual, mejorRacha | number entero no negativo |
| hitos | arreglo de { descripcion, porcentajeObjetivo, alcanzado: boolean } de la meta activa; [] sin ella |

Para gestionar la meta por ID, el cliente puede utilizar el listado de metas del juego; NO se amplía el objeto meta del progreso con otro contrato distinto del acordado.

### Matriz de errores

| Caso | Respuesta y efecto |
| --- | --- |
| ID de formato inválido | 400; sin modificaciones |
| Cuerpo ausente o no objeto donde se requiere; horas/días/hitos inválidos | 400; sin guardar ni modificar la meta anterior |
| Videojuego inexistente al crear, listar o consultar progreso | 404 |
| Meta inexistente al consultar, editar o desactivar | 404 |
| Segunda meta activa, incluida carrera concurrente | 409 y mensaje claro; máximo una persistida |
| Fallo inesperado de consulta, guardado o cascada | 500; no se informa éxito |

Los errores DEBEN usar { error, requestId } según el errorHandler existente; pueden conservar detalle de validación donde ya corresponde. No se expone una traza interna al usuario. El JSON mal formado que falla antes del middleware de requestId pertenece a D3, pendiente de fase 8; esta spec NO afirma que ese defecto global ya esté corregido.

## Funciones de dominio y pruebas previstas

Se propone separar dentro de progreso.ts las responsabilidades calcularSemana, calcularActividadSemanal, calcularRachas y calcularHitos. Los nombres pueden ajustarse al implementar sin cambiar entradas observables ni reglas. Los datos no se mutan. El instante de consulta debe fijarse una vez por solicitud y pasarse al dominio.

Se utilizarán node:test y el tsx ya instalado, sin nuevas dependencias. Comando previsto desde la raíz, una vez existan las pruebas: backend/node_modules/.bin/tsx --test backend/test/*.test.ts. No se ejecuta ni se acredita ahora. Las pruebas HTTP pueden montar app/controladores con dobles y puerto local efímero, sin arrancar index.ts, cargar archivos de entorno ni conectar MongoDB.

Leyenda: A = test automatizado sin base; H = prueba HTTP con dobles, sin probar persistencia; I = integración real autorizada. Cada fila A/H DEBE tener al menos un test; las entradas agrupadas DEBEN desglosarse en casos válidos, inválidos y frontera pertinentes. Las comprobaciones visuales complementarias están en la spec 02.

## Tabla criterio → verificación

| Criterio | Verificación prevista | Nivel |
| --- | --- | --- |
| CA-01.1 | Crear con juego existente, referencia correcta y activa true; confirmar persistencia después. | A/H + I |
| CA-01.2 | Ausente, cero, negativo, mayor de 100, no número o no finito; aceptar 100 y valores positivos fraccionarios; no guardar inválidos. | A/H |
| CA-01.3 | Ausente, fraccionario, fuera de 1–7 o no numérico; aceptar 1 y 7. | A/H |
| CA-01.4 | Cero/cinco/seis hitos; descripción ausente o inválida; objetivos inferiores/iguales/superiores a los límites; no exigir porcentaje entero. | A/H |
| CA-01.5 | Rechazo previo y duplicado del índice traducidos a 409; dos creaciones simultáneas dejan solo una activa. | A/H + I |
| CA-01.6 | Crear meta para completado y abandonado, sin restricción por estado. | A/H |
| CA-02.1 | Consultar ID y verificar objetivos, hitos, asociación y estado activo/inactivo. | A/H + I |
| CA-02.2 | Listado filtrado por juego conserva activas e inactivas y excluye ajenas. | A/H + I |
| CA-02.3 | Juego existente sin metas: total 0 y lista vacía, no 404. | A/H |
| CA-03.1 | Actualizar misma identidad sin cambiar referencias, metas ajenas ni createdAt. | A/H + I |
| CA-03.2 | Mantener partidas y cambiar ambos objetivos; porcentaje y comparación de días usan los nuevos valores en toda la semana. | A/H |
| CA-03.3 | Repetir validaciones inválidas durante edición y comprobar ausencia de escritura. | A/H |
| CA-03.4 | Completado/abandonado no dispara desactivación; regresión del cambio de estado existente. | A/H + I |
| CA-04.3 | Desactivar conserva meta e hitos; repetir deja inactiva. Confirmación visual en spec 02. | A/H + I |
| CA-04.4 | Desactivar y crear otra: ambas conservadas, anterior inactiva y nueva única activa. | A/H + I |
| CA-04.5 | Crear meta jueves y contar partidas elegibles desde el lunes. | A/H |
| CA-05.1 | Reloj fijo; domingo/lunes, cambio de mes/año y fechas UTC que corresponden a otro día en Ecuador. | A |
| CA-05.2 | Suma y división, cero, duraciones fraccionarias ya admitidas por P3 y redondeo a un decimal. | A |
| CA-05.3 | Varias sesiones de un día suman minutos y cuentan una sola fecha. | A |
| CA-05.4 | Inicio antes de medianoche, fin posterior y cruce domingo/lunes; duración completa en semana de inicio. | A |
| CA-05.5 | Comparar misma partida con reloj anterior, igual y posterior a su inicio; inclusión según su semana. | A |
| CA-05.6 | Redondeo de horas antes del porcentaje; 7/5 devuelve 140; no limitar el dato a 100. | A/H |
| CA-05.7 | Alcanzar solo horas, solo días, ambos y ninguno; verificar comparación de ambos objetivos, sin compensaciones. | A |
| CA-05.8 | Sin meta activa, incluso con anteriores: meta y porcentaje null, hitos [], actividad calculada. | A/H |
| CA-05.9 | Sin ninguna partida: ceros; hitos activos todos false o [] si no hay meta. | A/H |
| CA-05.10 | Excluir otros juegos y sesiones fuera del intervalo semanal, conservando el historial propio para rachas. | A/H |
| CA-06.1 | Secuencia terminada ayer conserva longitud durante hoy. | A |
| CA-06.2 | Añadir hoy incrementa una vez; duplicados diarios no incrementan. | A |
| CA-06.3 | Un día completo sin actividad antes de hoy deja racha actual 0. | A |
| CA-06.4 | Secuencias desordenadas, duplicadas y anteriores a semana/meta; escoger la más larga. | A |
| CA-06.5 | Excluir fechas futuras de ambas rachas y comprobar nueva elegibilidad al avanzar reloj. | A |
| CA-07.1 | Avance por debajo, igual y encima del objetivo; varios hitos y arreglo vacío. | A |
| CA-07.2 | Reducir avance y comprobar que el resultado deja de estar alcanzado, sin estado persistido. | A |
| CA-07.3 | Servicio usa obtenerResumenVideojuego; preservar desempates fecha/createdAt/_id con dobles; caso futuro 80 % frente a hito 50 % alcanzado, aunque actividad 0. | A/H |
| CA-08.1 | Borrar todas las metas activas e inactivas e hitos del juego tras eliminación correcta. | A/H + I |
| CA-08.2 | Datos de otros juegos y partidas permanecen; filtros de eliminación precisos. | A/H + I |
| CA-08.3 | Juego sin metas conserva borrado de partidas y 204; IDs inválidos/inexistentes no borran datos. | A/H + I |

Los otros ocho criterios, CA-04.1, CA-04.2 y CA-09.1 a CA-09.6, corresponden a interacción frontend y están cubiertos en la spec 02. Los 37 identificadores de esta tabla más esos ocho cubren los 45 sin renumerarlos.

## Tabla ticket → archivos

Rutas relativas a la raíz; «nuevo» describe trabajo futuro, no archivos creados en esta fase.

| Ticket | Archivos previstos |
| --- | --- |
| E2-T01 | docs/specs/01-backend-metas-progreso.md |
| E2-T03 | Nuevos: backend/test/metas.model.test.ts, backend/test/metas.service.test.ts, backend/test/metas.http.test.ts |
| E2-T04 | Nuevos: backend/src/modelos/Meta.model.ts, backend/src/services/metas.service.ts, backend/src/controllers/metas.controller.ts, backend/src/routes/metas.routes.ts; existentes: backend/src/app.ts, backend/src/routes/videojuegos.routes.ts |
| E2-T05 | Archivos de servicio, controlador y rutas de metas de E2-T04; tests de E2-T03 |
| E2-T06 | Nuevo: backend/test/progreso.test.ts |
| E2-T07 | Nuevo: backend/src/dominio/progreso.ts; backend/test/progreso.test.ts |
| E2-T08 | Nuevo: backend/test/hitos.test.ts; sin bloqueo por partidas futuras |
| E2-T09 | backend/src/dominio/progreso.ts; backend/test/hitos.test.ts |
| E2-T10 | Nuevos: backend/src/services/progreso.service.ts, backend/src/controllers/progreso.controller.ts, backend/test/progreso.http.test.ts; existente: backend/src/routes/videojuegos.routes.ts |
| E2-T11 | Existente: backend/src/services/videojuegos.service.ts; nuevo: backend/test/videojuegos.eliminacion.test.ts |
| E2-T15 | Tests anteriores; comprobaciones HTTP y persistencia autorizada, con evidencia para la auditoría posterior |

DT-D3 y DT-D4 no se implementan aquí. Sus cinco criterios de deuda no se mezclan con los 45 de E2.

## Límites, cierre y dependencias

El índice único y la persistencia solo se acreditan cuando exista evidencia contra una base de pruebas autorizada; no basta un modelo o un doble. Su preparación NO está autorizada por escribir esta spec. Los fallos simulados de cascada deben reconocer D9 y no prometer rollback.

Antes de implementar, esta spec DEBE aprobarse y existir en Git. T03/T06/T08 preceden al código correspondiente; T10 depende de T05, T07 y T09, y T11 de T04. La decisión futura/hitos está resuelta y no añade una dependencia pendiente. Edición de partidas y medición mensual siguen fuera del alcance implementable actual; no bloquean estos contratos. Los resultados de las pruebas se registrarán cuando se ejecuten; aquí todos son previstos.
