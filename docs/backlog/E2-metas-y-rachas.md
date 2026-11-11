# E2 — Metas y rachas: historias, criterios y tickets

## Estado, fuentes y límites

Backlog de la fase 4, creado a partir de la propuesta aprobada: nueve historias y diecisiete tickets, incluidos dos de deuda técnica para la fase 8. Todos los tickets están pendientes; este documento no constituye evidencia de implementación ni de pruebas ejecutadas.

Fuentes: [enunciado](../../ENUNCIADO-E2.md), [instrucciones del proyecto](../../AGENTS.md), [PRD aprobado](../prd/playlog-e2.md), [épicas](epicas.md) y [diagnóstico histórico](../diagnostico.md). D1 ya está resuelto. Se conserva el resumen original de P3 y la identidad visual de PLAYLOG!.

No se agregan notificaciones, recordatorios, rankings, metas compartidas, gráficos históricos, seguimiento mensual automático, pantallas nuevas de historial de metas, división de sesiones entre días ni un botón nuevo para eliminar videojuegos. No se implementa edición de partidas por suposición.

## Decisiones de negocio aprobadas

| Regla del PRD | Decisión que se conserva |
| --- | --- |
| RN-01 | Si ayer hubo partida, la racha sigue viva durante hoy aunque todavía no se haya jugado. Se rompe tras un día completo sin jugar. |
| RN-02 | Varias partidas del mismo juego en una fecha cuentan como un día; todas sus duraciones suman. |
| RN-03 | Toda la partida pertenece al día y semana de inicio según America/Guayaquil, aunque cruce medianoche. La fecha registrada representa el inicio. |
| RN-04 | Editar objetivos aplica inmediatamente los nuevos valores a toda la semana actual, en horas y días. |
| RN-05 | El porcentaje puede superar el 100 %; la barra visual se limita al 100 %. |
| RN-06 | Los hitos se recalculan desde el avance actual del resumen de P3 y pueden dejar de estar alcanzados si ese avance baja. |
| RN-07 | Los juegos completados o abandonados pueden tener metas activas. Su desactivación es explícita. |
| RN-08 | Eliminar un videojuego elimina todas sus metas, activas e inactivas, y sus hitos. |
| RA-01 | Cumplir una semana requiere alcanzar horas y días objetivo, sin compensación entre ambos. |
| RA-02 | Las partidas futuras se excluyen de horas, días y rachas hasta su fecha. Los hitos respetan exactamente el resumen original de P3, incluso si el avance procede de una partida futura. La diferencia es una regla explícita y una limitación conocida aceptada, no una decisión pendiente. |
| RA-03 | Crear una meta considera toda la actividad elegible de la semana, incluida la anterior a su creación. |
| RA-04 | Sin meta activa se muestran horas, días y rachas, pero no porcentaje de cumplimiento ni hitos anteriores; se invita a crear una meta. |
| RA-05 | Editar modifica la misma meta; desactivarla y crear otra conserva la anterior como historial, sin prometer versiones de cada edición ni una pantalla nueva. |
| RA-06 | La edición de partidas sigue pendiente de aclaración con el profesor. |

La semana es de lunes a domingo en America/Guayaquil. Las horas se calculan sumando minutos y dividiendo entre 60, con un decimal. El porcentaje usa esas horas redondeadas frente al objetivo y se redondea a entero. Las rachas consideran todo el historial elegible de cada videojuego, no solo la semana o la vigencia de la meta.

## Historias de usuario y criterios

Las historias se organizan por necesidades de valor identificable y verificable; las dependencias técnicas están en los tickets. La estimación de esfuerzo queda para la planificación, sin inventar horas o puntos. Los criterios delimitan el tamaño del trabajo y permiten comprobarlo por separado. Las reglas no resueltas no se convierten en supuestos de implementación.

### HU-E2-01 — Crear una meta

Como persona que utiliza PLAYLOG!, quiero establecer una meta para un videojuego, para orientar cuánto tiempo y cuántos días quiero jugar cada semana.

| ID | Criterio de aceptación |
| --- | --- |
| CA-01.1 | DADO un videojuego existente sin meta activa, CUANDO creo una meta con valores válidos, ENTONCES queda asociada al juego y activa. |
| CA-01.2 | DADO un intento de creación o edición, CUANDO las horas no son un número mayor que cero y menor o igual que 100, ENTONCES se rechaza la operación con una explicación y no se guarda el cambio. |
| CA-01.3 | DADO un intento de creación o edición, CUANDO los días no son un entero entre 1 y 7, ENTONCES se rechaza la operación con una explicación y no se guarda el cambio. |
| CA-01.4 | DADO un intento de creación o edición, CUANDO hay más de cinco hitos, un objetivo no es numérico o está fuera del intervalo de 1 a 100, o falta la descripción de un hito, ENTONCES se rechaza la operación indicando el problema. |
| CA-01.5 | DADO un videojuego con una meta activa, CUANDO intento crear otra activa, ENTONCES se rechaza con un mensaje claro y permanece una sola meta activa. |
| CA-01.6 | DADO un videojuego completado o abandonado sin meta activa, CUANDO creo una meta válida, ENTONCES se permite crearla igual que para los demás estados. |

Se verificarán los valores frontera válidos: 100 horas, 1 y 7 días, cinco hitos y objetivos del 1 % y 100 %. No se añade un mínimo de hitos que el enunciado no establece.

### HU-E2-02 — Consultar metas

Como persona que utiliza PLAYLOG!, quiero consultar una meta y las metas asociadas a un videojuego, para reconocer mi objetivo vigente y conservar referencia de los anteriores.

| ID | Criterio de aceptación |
| --- | --- |
| CA-02.1 | DADO que existe una meta, CUANDO la consulto, ENTONCES obtengo sus objetivos, hitos, videojuego asociado y condición activa o inactiva. |
| CA-02.2 | DADO un videojuego con metas activas e inactivas, CUANDO consulto sus metas, ENTONCES obtengo las de ese videojuego sin incluir las de otros juegos. |
| CA-02.3 | DADO un videojuego existente sin metas, CUANDO consulto sus metas, ENTONCES obtengo una lista vacía, sin presentarlo como un error. |

Esta historia cubre la consulta requerida y no exige una pantalla nueva de historial.

### HU-E2-03 — Editar la meta

Como persona que utiliza PLAYLOG!, quiero ajustar mi meta y sus hitos, para adaptar mis objetivos sin perder la identidad de la meta que estoy editando.

| ID | Criterio de aceptación |
| --- | --- |
| CA-03.1 | DADO que existe una meta, CUANDO guardo cambios válidos, ENTONCES se modifica esa misma meta sin crear otra ni alterar metas ajenas. |
| CA-03.2 | DADO que hay una meta activa y actividad acumulada esta semana, CUANDO cambio las horas o los días objetivo, ENTONCES el cumplimiento de toda la semana se evalúa inmediatamente frente a los nuevos objetivos. |
| CA-03.3 | DADO que existe una meta, CUANDO intento guardar objetivos o hitos inválidos, ENTONCES se aplican las validaciones de CA-01.2 a CA-01.4 y se conservan los valores anteriores. |
| CA-03.4 | DADO un videojuego con meta activa, CUANDO cambia a completado o abandonado, ENTONCES su meta permanece activa. |

Editar no promete conservar cada versión anterior ni autoriza un flujo nuevo de reactivación.

### HU-E2-04 — Desactivar y reemplazar una meta

Como persona que utiliza PLAYLOG!, quiero desactivar una meta y poder establecer otra, para cambiar mis objetivos conservando las metas anteriores.

| ID | Criterio de aceptación |
| --- | --- |
| CA-04.1 | DADO que hay una meta activa, CUANDO solicito desactivarla desde la interfaz, ENTONCES se pide confirmación antes de cambiarla. |
| CA-04.2 | DADO que se muestra esa confirmación, CUANDO cancelo, ENTONCES la meta permanece activa. |
| CA-04.3 | DADO que se muestra esa confirmación, CUANDO confirmo, ENTONCES la meta queda inactiva y permanece conservada con sus objetivos e hitos. |
| CA-04.4 | DADO un videojuego cuya meta anterior está inactiva, CUANDO creo una nueva meta válida, ENTONCES la anterior permanece inactiva y la nueva es la única activa. |
| CA-04.5 | DADO que hay una nueva meta activa creada durante la semana, CUANDO consulto el progreso, ENTONCES se consideran también las partidas elegibles de esa semana anteriores a su creación. |

### HU-E2-05 — Consultar el progreso semanal

Como persona que utiliza PLAYLOG!, quiero comparar mi actividad semanal con mi meta, para saber cuánto me falta o cuánto he superado mis objetivos.

| ID | Criterio de aceptación |
| --- | --- |
| CA-05.1 | DADO que se consulta el progreso, CUANDO se determina la semana actual, ENTONCES comprende de lunes a domingo según America/Guayaquil, independientemente de la zona del dispositivo. |
| CA-05.2 | DADO que existen partidas elegibles de esa semana, CUANDO consulto las horas, ENTONCES se suman sus minutos, se dividen entre 60 y se muestra el resultado redondeado a un decimal. |
| CA-05.3 | DADO que existen varias partidas del mismo videojuego en una fecha, CUANDO consulto el progreso, ENTONCES todas suman tiempo y esa fecha cuenta como un único día jugado. |
| CA-05.4 | DADO que una partida cruza medianoche, CUANDO se calcula la actividad, ENTONCES toda su duración y su día jugado pertenecen al día y semana de inicio en hora de Ecuador. |
| CA-05.5 | DADO que una partida tiene fecha futura, CUANDO consulto antes de esa fecha, ENTONCES no suma horas ni días; cuando deja de ser futura, puede contar según su semana de inicio. |
| CA-05.6 | DADO que hay una meta activa, CUANDO consulto el porcentaje de horas, ENTONCES se calcula con las horas semanales redondeadas y se redondea a entero; 7 horas frente a 5 muestran 140 %, con la barra llena hasta el 100 %. |
| CA-05.7 | DADO que hay una meta activa, CUANDO evalúo si se cumplió la semana, ENTONCES deben haberse alcanzado tanto las horas como los días objetivo; cumplir solo uno no basta. |
| CA-05.8 | DADO un videojuego sin meta activa, CUANDO consulto su progreso, ENTONCES se muestran horas, días y rachas, sin porcentaje de cumplimiento ni hitos anteriores, y la interfaz invita a crear una meta. |
| CA-05.9 | DADO un videojuego sin partidas, CUANDO consulto su progreso, ENTONCES las horas, días y rachas son cero y ningún hito está alcanzado. |
| CA-05.10 | DADO que hay videojuegos con partidas en distintas semanas, CUANDO consulto uno de ellos, ENTONCES su actividad semanal excluye los otros juegos y las partidas fuera de la semana actual. |

### HU-E2-06 — Consultar mis rachas

Como persona que utiliza PLAYLOG!, quiero conocer mi racha actual y mi mejor racha por videojuego, para reconocer mi constancia.

| ID | Criterio de aceptación |
| --- | --- |
| CA-06.1 | DADO que hay partidas en días consecutivos hasta ayer y ninguna hoy, CUANDO consulto durante hoy, ENTONCES la racha conserva la longitud alcanzada ayer. |
| CA-06.2 | DADO que hay una racha viva hasta ayer, CUANDO registro una partida de hoy, ENTONCES aumenta un día; más partidas de hoy no vuelven a incrementarla. |
| CA-06.3 | DADO un día completo sin jugar entre la última actividad y hoy, CUANDO consulto, ENTONCES la racha actual es cero. |
| CA-06.4 | DADO que existen distintas secuencias de días jugados, CUANDO consulto la mejor racha, ENTONCES se muestra la más larga de todo el historial elegible, aunque sea anterior a esta semana o a la meta. |
| CA-06.5 | DADO que existen partidas futuras, CUANDO calculo cualquiera de las rachas, ENTONCES no participan hasta que llegue su fecha. |

### HU-E2-07 — Consultar hitos de avance

Como persona que utiliza PLAYLOG!, quiero ver qué hitos cumple mi avance actual, para reconocer mi progreso dentro del videojuego.

| ID | Criterio de aceptación |
| --- | --- |
| CA-07.1 | DADO que hay una meta activa con hitos y un avance actual del resumen de P3, CUANDO consulto los hitos, ENTONCES están alcanzados aquellos cuyo objetivo es menor o igual que ese avance. |
| CA-07.2 | DADO un hito alcanzado, CUANDO el avance actual del resumen disminuye por debajo de su objetivo, ENTONCES deja de estar alcanzado. |
| CA-07.3 | DADO que se consultan los hitos, CUANDO se obtiene el avance, ENTONCES se utiliza el del resumen original de P3 sin modificarlo ni sustituirlo por otro cálculo. |

Regla explícita y limitación conocida aceptada: si una partida futura determina el avance del resumen original de P3, ese avance se utiliza para los hitos aunque la partida no cuente para horas, días ni rachas de E2. No se añade un filtro ni un segundo cálculo de avance. La decisión está resuelta y deja de bloquear E2-T08 y E2-T09; ambos siguen pendientes de implementación.

### HU-E2-08 — Eliminar las metas con su videojuego

Como persona que utiliza PLAYLOG!, quiero que al eliminar un videojuego se eliminen sus metas e hitos, para no conservar objetivos asociados a un juego que ya no existe.

| ID | Criterio de aceptación |
| --- | --- |
| CA-08.1 | DADO un videojuego con metas activas e inactivas, CUANDO su eliminación finaliza correctamente, ENTONCES desaparecen todas sus metas y sus hitos. |
| CA-08.2 | DADO que existen otros videojuegos con sus metas y partidas, CUANDO elimino un juego, ENTONCES los datos de los demás se conservan. |
| CA-08.3 | DADO un videojuego sin metas, CUANDO lo elimino correctamente, ENTONCES su eliminación y la de sus partidas mantienen el comportamiento existente. |

No se promete atomicidad ante fallos: D9 sigue diferido. No se añade un botón de eliminación.

### HU-E2-09 — Gestionar y consultar el progreso desde el detalle

Como persona que utiliza PLAYLOG!, quiero gestionar mi meta y ver el progreso actualizado desde el detalle del juego, para utilizar esta información sin abandonar mi flujo habitual.

| ID | Criterio de aceptación |
| --- | --- |
| CA-09.1 | DADO el detalle del juego, CUANDO creo o edito una meta mediante su formulario, ENTONCES puedo introducir sus objetivos e hitos y consultar el resultado actualizado tras guardar correctamente. |
| CA-09.2 | DADO que una consulta está en curso, CUANDO todavía no termina, ENTONCES se muestra un estado de carga distinguible de un resultado vacío o de cero actividad. |
| CA-09.3 | DADO que una consulta o modificación falla, CUANDO se comunica el resultado, ENTONCES se muestra un error comprensible y no se presenta la operación como realizada ni el fallo como progreso cero. |
| CA-09.4 | DADO un juego sin meta, sin partidas o con una meta sin hitos, CUANDO consulto el detalle, ENTONCES se representa el estado vacío correspondiente sin confundir esos casos. |
| CA-09.5 | DADO un registro o eliminación de partida completado correctamente, CUANDO vuelvo a consultar el detalle, ENTONCES se obtiene nuevamente el progreso y se reflejan los cambios en horas, días, rachas e hitos según sus reglas. |
| CA-09.6 | DADO que se muestra la sección de metas y progreso, CUANDO la utilizo, ENTONCES conserva la identidad visual, etiquetas, foco visible y estados establecidos para PLAYLOG!, y puede operarse con teclado. |

HU-E2-09 concentra presentación y estados comunes; no duplica las reglas de negocio de las demás historias.

## Contrato verificable de errores

Esta matriz complementa los criterios de producto. No sustituye la futura spec.

| Situación | Resultado esperado | Historias y tickets |
| --- | --- | --- |
| Identificador con formato inválido en una operación de E2 | 400 con explicación, sin aplicar modificaciones | HU-E2-01 a HU-E2-08 según operación; E2-T04, E2-T05, E2-T10, E2-T11 y E2-T15 |
| Horas, días o hitos inválidos | 400, sin guardar cambios | HU-E2-01 y HU-E2-03; E2-T03, E2-T04, E2-T05 y E2-T15 |
| Videojuego inexistente al crear, listar metas o consultar progreso | 404 | HU-E2-01, HU-E2-02 y HU-E2-05; E2-T04, E2-T10 y E2-T15 |
| Meta inexistente al consultar, editar o desactivar | 404 | HU-E2-02, HU-E2-03 y HU-E2-04; E2-T04, E2-T05 y E2-T15 |
| Segunda meta activa para el mismo videojuego | 409 con mensaje claro | HU-E2-01; E2-T03, E2-T04 y E2-T15 |
| Error inesperado del servidor | 500, distinguido de entradas inválidas | Transversal; E2-T04, E2-T05, E2-T10, E2-T15 y DT-D3 en su alcance |

La unicidad se conserva también ante solicitudes simultáneas. El mecanismo y la verificación correspondiente se definirán en la spec.

## Tickets y Definition of Done

DoD común de implementación: alcance y criterios asociados cubiertos; spec correspondiente aprobada y registrada antes del código; pruebas pertinentes ejecutadas con resultados y límites documentados; tipos y lint aplicables correctos; sin funciones ajenas al ticket; trazabilidad con el ID. Los fallos conocidos no se registran como aprobados. El commit por ticket se realiza cuando esté autorizado.

Los tickets de tests preceden al código: su cierre inicial exige pruebas ejecutables y fallos esperados identificados. La funcionalidad solo se cierra cuando pasan. Debe haber al menos un test por criterio de la futura spec verificable sin base de datos. No se elige ni instala una herramienta de tests por aprobar estos tickets.

| ID | Historia asociada | Tipo | Objetivo y alcance | Definition of Done específica | Dependencias |
| --- | --- | --- | --- | --- | --- |
| E2-T01 | HU-E2-01 a HU-E2-08 | documentación | Preparar en fase 5 la spec del backend, con reglas, criterios y trazabilidad. | Tablas criterio→verificación y ticket→archivos completas; puntos abiertos identificados; aprobación y registro antes del código. | Backlog aprobado; regla de hitos y partidas futuras resuelta. |
| E2-T02 | HU-E2-01 a HU-E2-09 | documentación | Preparar en fase 5 la spec del frontend. | Flujos, estados, diseño y verificaciones trazados; aprobación y registro antes del código. | Backlog aprobado; contrato acordado con E2-T01. |
| E2-T03 | HU-E2-01 a HU-E2-04 | test | Preparar pruebas de validaciones, unicidad, consulta y ciclo de vida. | Casos válidos, fronteras, rechazos y conservación del historial identificados; dobles e integración real diferenciados. | E2-T01. |
| E2-T04 | HU-E2-01 y HU-E2-02 | backend | Crear y consultar metas; validar referencia, objetivos e hitos; impedir segunda activa. | Creación, consulta por ID y listado por juego verificados; 400/404/409 y unicidad concurrente cubiertos. | E2-T01 y E2-T03. |
| E2-T05 | HU-E2-03 y HU-E2-04 | backend | Editar y desactivar; conservar metas anteriores al reemplazar. | Edición sobre la misma meta, desactivación e historial verificados; estados del juego no desactivan automáticamente. | E2-T04. |
| E2-T06 | HU-E2-05 y HU-E2-06 | test | Escribir primero tests de semana, horas, días y rachas. | Al menos un test por criterio verificable sin base; fronteras de semana, medianoche, duplicados, redondeo y futuro incluidos. | E2-T01. |
| E2-T07 | HU-E2-05 y HU-E2-06 | backend | Implementar cálculos de actividad mediante funciones puras. | Tests de E2-T06 aprobados; semana de Ecuador y reglas respetadas; resumen P3 intacto. | E2-T06. |
| E2-T08 | HU-E2-07 | test | Preparar tests de hitos desde el avance del resumen. | Igualdad, superación, descenso y ausencia de partidas cubiertos; tratamiento de futuro alineado con la regla aprobada del resumen de P3. | E2-T01. |
| E2-T09 | HU-E2-07 | backend | Calcular hitos sin un segundo cálculo de avance. | Tests de E2-T08 aprobados; usa el resumen original; no conserva un estado histórico de «alcanzado». | E2-T08. |
| E2-T10 | HU-E2-03 a HU-E2-07 | backend | Integrar la consulta del progreso semanal con metas y partidas. | Respuesta completa verificada con y sin meta y partidas; 400/404; cambios inmediatos de objetivos; cálculos fuera del acceso a datos. | E2-T05, E2-T07 y E2-T09. |
| E2-T11 | HU-E2-08 | backend | Extender el borrado del videojuego a todas sus metas e hitos. | Cascada normal, ausencia de metas y conservación de datos ajenos verificadas; riesgo D9 explícito. | E2-T04. |
| E2-T12 | HU-E2-01 a HU-E2-09 | frontend | Preparar el servicio separado metasApi.ts y el acceso al progreso. | Operaciones y errores compatibles con el contrato; acceso HTTP separado de componentes. | E2-T02, E2-T04, E2-T05 y E2-T10. |
| E2-T13 | HU-E2-01, HU-E2-03, HU-E2-04 y HU-E2-09 | frontend | Crear y editar mediante formulario; desactivar con confirmación. | Validaciones, cancelación, guardado y errores verificados; ninguna pantalla nueva de historial. | E2-T12. |
| E2-T14 | HU-E2-05, HU-E2-06, HU-E2-07 y HU-E2-09 | frontend | Mostrar progreso, rachas e hitos y actualizar tras registrar o eliminar partidas. | Barra limitada, porcentaje sin tope, carga/error/vacío y refresco verificados; revisión contra DESIGN.md. | E2-T12; coordinación con E2-T13 para refrescar tras gestionar metas. |
| E2-T15 | HU-E2-01 a HU-E2-09 | test | Verificar flujos integrados y registrar evidencia. | Casos del profesor: sin partidas, cinco o más partidas en días distintos y racha rota, 400/404/409; formularios, refresco y teclado comprobados; evidencia real separada de dobles. | E2-T11, E2-T13 y E2-T14. |
| DT-D3 | Corrección de E1: D3 | backend | Fase 8: corregir los dos casos diagnosticados de entradas inválidas con respuesta 500. | DT-CA-01 a DT-CA-03 cubiertos mediante criterio, test de regresión, código, verificación y commit propio autorizado. | Llegar a fase 8; no bloquea E2. |
| DT-D4 | Corrección de E1: D4 | frontend | Fase 8: corregir quitar calificación, incluido el contrato y ajuste backend que resulte necesario. | DT-CA-04 y DT-CA-05 cubiertos mediante criterio, test de regresión, código, verificación y commit propio autorizado. | Llegar a fase 8; no bloquea E2. |

DT-D4 se clasifica como frontend por el origen del flujo, sin limitar la corrección a esa capa. E2-T01 y E2-T02 quedan planificados, no ejecutados: no se redactan specs en esta fase.

## Deuda técnica

### Seleccionada para la fase 8

| ID | Problema | Criterio de aceptación |
| --- | --- | --- |
| DT-CA-01 | D3 | DADO un JSON mal formado, CUANDO se procesa la solicitud, ENTONCES se responde 400 y se conserva un identificador de solicitud. |
| DT-CA-02 | D3 | DADO un intento de actualizar un logro sin cuerpo, CUANDO se solicita, ENTONCES se responde 400 sin modificar el logro. |
| DT-CA-03 | D3 | DADO un fallo inesperado real, CUANDO se maneja, ENTONCES sigue respondiendo 500. |
| DT-CA-04 | D4 | DADO un videojuego calificado, CUANDO quito su calificación y guardo correctamente, ENTONCES al volver a consultarlo ya no tiene calificación. |
| DT-CA-05 | D4 | DADO que una edición no solicita quitar ni modificar la calificación, CUANDO guardo, ENTONCES conserva su valor anterior. |

D3 no se amplía para corregir D5. D4 requiere comprobar el resultado persistido en una base de pruebas autorizada; un doble no se presenta como integración real.

### Resto del diagnóstico

| ID | Estado y justificación |
| --- | --- |
| D1 | Resuelto mediante la incorporación de P3; no queda pendiente. |
| D2 | Documentación de ejecución y README pendiente para la entrega; no bloquea los cálculos ni se corrige por implicación en estos tickets. |
| D5 | Diferida la inconsistencia de títulos solo con espacios: no impide metas ni progreso. |
| D6 | No se añade un botón de eliminar videojuegos. Queda revisar la discrepancia documental; la interfaz de P3 no lo exigía expresamente. |
| D7 | Los tests de E2 cubren la verificación obligatoria de la nueva épica. La ausencia de una suite completa de regresión de P3 no se declara resuelta por esos tests. |
| D8 | Optimización diferida: patrón de consultas potencialmente costoso, sin lentitud medida. |
| D9 | Atomicidad diferida por decisión aprobada. Permanece el riesgo de borrado parcial; la cascada de metas de E2-T11 sigue siendo obligatoria. |

## Trazabilidad: requisitos, historias, criterios y tickets

Los intervalos de criterios son inclusivos. E2-T01 y E2-T02 especificarán los requisitos de sus historias; E2-T15 verificará los flujos integrados. Las filas siguientes identifican además sus responsables concretos.

| Requisito o decisión | Historias | Criterios | Tickets |
| --- | --- | --- | --- |
| Crear meta y validar horas, días e hitos | HU-E2-01 y HU-E2-03 | CA-01.1 a CA-01.4; CA-03.3 | E2-T03, E2-T04, E2-T05, E2-T12 y E2-T13 |
| Una sola meta activa, también con concurrencia | HU-E2-01 | CA-01.5; matriz 409 | E2-T03, E2-T04 y E2-T15 |
| Consultar por ID y listar las metas del juego | HU-E2-02 | CA-02.1 a CA-02.3 | E2-T03, E2-T04 y E2-T12 |
| Editar, desactivar con confirmación y conservar anteriores | HU-E2-03 y HU-E2-04 | CA-03.1 a CA-03.3; CA-04.1 a CA-04.4 | E2-T03, E2-T05, E2-T12 y E2-T13 |
| Semana de Ecuador, horas, redondeo y separación por juego | HU-E2-05 | CA-05.1, CA-05.2, CA-05.6 y CA-05.10 | E2-T06, E2-T07, E2-T10 y E2-T14 |
| RN-01: racha viva hasta ayer | HU-E2-06 | CA-06.1 a CA-06.3 | E2-T06, E2-T07, E2-T10 y E2-T14 |
| RN-02: un día, múltiples duraciones | HU-E2-05 y HU-E2-06 | CA-05.3 y CA-06.2 | E2-T06, E2-T07 y E2-T10 |
| RN-03: asignación al inicio y cruce de medianoche | HU-E2-05 | CA-05.4 | E2-T06, E2-T07 y E2-T10 |
| RN-04: cambio inmediato de objetivos | HU-E2-03 | CA-03.2 | E2-T05, E2-T10, E2-T13 y E2-T14 |
| RN-05: porcentaje sin tope y barra limitada | HU-E2-05 y HU-E2-09 | CA-05.6 y CA-09.1 | E2-T06, E2-T07, E2-T10 y E2-T14 |
| RN-06: hitos recalculados desde P3 | HU-E2-07 | CA-07.1 a CA-07.3 | E2-T08, E2-T09, E2-T10 y E2-T14 |
| RN-07: completados y abandonados | HU-E2-01 y HU-E2-03 | CA-01.6 y CA-03.4 | E2-T03, E2-T04 y E2-T05 |
| RN-08: eliminar todas las metas e hitos | HU-E2-08 | CA-08.1 a CA-08.3 | E2-T11 y E2-T15 |
| RA-01: horas y días para cumplir | HU-E2-05 | CA-05.7 | E2-T06, E2-T07 y E2-T10 |
| RA-02: exclusión futura solo de actividad | HU-E2-05, HU-E2-06 y HU-E2-07 | CA-05.5, CA-06.5 y CA-07.3; regla futura explícita | E2-T06, E2-T07, E2-T08 y E2-T09 |
| RA-03: actividad anterior a crear meta | HU-E2-04 | CA-04.5 | E2-T06, E2-T07 y E2-T10 |
| RA-04: sin meta activa | HU-E2-05 y HU-E2-09 | CA-05.8 y CA-09.4 | E2-T10, E2-T12 y E2-T14 |
| RA-05: editar frente a reemplazar | HU-E2-03 y HU-E2-04 | CA-03.1, CA-04.3 y CA-04.4 | E2-T03, E2-T05 y E2-T13 |
| RA-06: edición de partidas pendiente | Límite de HU-E2-09 | CA-09.5 cubre solo registro y eliminación | Sin ticket nuevo; E2-T01 y E2-T02 conservan la exclusión |
| Mejor racha sobre todo el historial | HU-E2-06 | CA-06.4 | E2-T06, E2-T07, E2-T10 y E2-T14 |
| Sin partidas | HU-E2-05 y HU-E2-07 | CA-05.9; CA-07.1 a CA-07.3 según contrato | E2-T06 a E2-T10 y E2-T15; resumen de P3 respetado |
| Errores 400, 404, 409 y 500 | Historias según operación | CA-01.2 a CA-01.5; CA-03.3; CA-09.3; matriz de errores | E2-T03, E2-T04, E2-T05, E2-T10, E2-T11 y E2-T15 |
| Interfaz y gestión de metas | HU-E2-09, HU-E2-01, HU-E2-03 y HU-E2-04 | CA-09.1; CA-04.1 a CA-04.3 | E2-T02, E2-T12 y E2-T13 |
| Estados loading, error y empty | HU-E2-09 | CA-09.2 a CA-09.4 | E2-T12, E2-T13, E2-T14 y E2-T15 |
| Refresco tras registrar o eliminar partidas | HU-E2-09 | CA-09.5 | E2-T12, E2-T14 y E2-T15 |
| Diseño y teclado | HU-E2-09 | CA-09.6 | E2-T02, E2-T13, E2-T14 y E2-T15 |
| Métrica de 3 de 4 semanas | Objetivo del PRD | CA-05.7 define cumplimiento semanal; medición mensual pendiente | Sin función adicional; E2-T01 y E2-T02 mantienen el límite |
| D3: entradas inválidas diagnosticadas | Corrección de E1 | DT-CA-01 a DT-CA-03 | DT-D3, fase 8 |
| D4: quitar calificación | Corrección de E1 | DT-CA-04 y DT-CA-05 | DT-D4, fase 8 |

## Orden de dependencias y puntos pendientes

- Metas: E2-T01 → E2-T03 → E2-T04 → E2-T05.
- Actividad y rachas: E2-T01 → E2-T06 → E2-T07.
- Hitos: E2-T01 → E2-T08 → E2-T09; decisión sobre partidas futuras resuelta.
- Consulta completa: E2-T05 + E2-T07 + E2-T09 → E2-T10. La dependencia de implementación de hitos se conserva, sin bloqueo por una decisión de negocio pendiente.
- Cascada: E2-T04 → E2-T11.
- Frontend: E2-T02 y servicios backend → E2-T12 → E2-T13 y E2-T14 → E2-T15. E2-T15 requiere también E2-T11.
- Deuda: DT-D3 y DT-D4 únicamente en fase 8.

| Punto pendiente | Tratamiento |
| --- | --- |
| Edición de partidas | Esperar aclaración del profesor. No hay ticket que cree esa funcionalidad ni compromiso de implementarla automáticamente. |
| Métrica mensual | Objetivo de producto: cumplir al menos tres de cuatro semanas durante un mes. Periodo y evidencia pendientes, sin gráficos ni seguimiento histórico automático. |

## Revisión documental

El documento contiene 45 criterios de E2 y cinco criterios de deuda técnica. Los criterios describen una precondición, una acción y un resultado observable; los de hitos respetan la regla explícita aprobada sobre el resumen de P3, incluso con partidas futuras. Las validaciones agrupadas se desglosarán en casos de prueba durante la spec sin inventar reglas adicionales. La matriz de errores complementa los criterios y no aumenta ese conteo.

Las historias, criterios y tickets aquí descritos son trabajo pendiente. Aprobar o registrar este archivo no autoriza ejecutar la fase 5, instalar herramientas, acceder a datos reales o implementar E2.

## Seguimiento de deuda — fase 8

- **DT-D3:** DT-CA-01 a DT-CA-03 corregidos y verificados con regresiones HTTP aisladas; [prueba previa, corrección y resultados](../verificacion/DT-D3.md). Se conservan los tres TODO de MongoDB real. El estado histórico de planificación de las secciones anteriores no constituye el estado de esta corrección.
