# PRD — PLAYLOG! con E2: Metas y rachas

## Estado y fuentes

Documento de producto de la fase 3, preparado para revisión. Las reglas de negocio fueron aprobadas por el estudiante en la conversación de descubrimiento. Esta entrega no implica que E2 esté implementada ni verificada.

La fuente principal es el enunciado del profesor y su ficha de hechos. Se conservan las funcionalidades de P3 descritas en el diagnóstico y las decisiones aprobadas posteriormente. El diagnóstico es histórico: la base de P3 ya fue incorporada y la fase de harness ya se cerró.

## Problema y usuario

PLAYLOG! permite a la persona registrar sus videojuegos, sesiones, tiempo y avance. Sin embargo, esos registros no le permiten comparar claramente lo jugado con lo que se propuso para la semana ni reconocer su constancia. Puede concentrar muchas horas en un fin de semana y luego pasar semanas sin jugar.

El usuario de E2 es la misma persona que ya utiliza el diario. Quiere fijarse objetivos por videojuego y consultar su cumplimiento semanal, sus días consecutivos de actividad y sus hitos de avance desde el detalle del juego.

## Objetivo y métrica de éxito

Permitir que la persona evalúe si está cumpliendo sus metas y manteniendo la constancia en cada videojuego.

La métrica de éxito de la ficha es cumplir la meta semanal al menos en 3 de 4 semanas durante un mes. Una semana se cumple cuando se alcanzan tanto las horas objetivo como los días objetivo; superar uno no compensa incumplir el otro. Esta es una meta de resultado del producto, no un resultado ya observado.

La definición del periodo de observación y la forma de recoger evidencia de esa métrica quedan abiertas. No se deduce de ella una función de gráficos históricos, seguimiento automático mensual ni una pantalla adicional.

## Alcance del producto

### Base existente que se conserva: E1

Biblioteca de videojuegos con búsqueda y filtros; creación y edición de su ficha; estado, calificación y logros; selección de portadas del catálogo RAWG; registro, consulta y eliminación de partidas; detalle con resumen e historial; y eliminación de videojuegos con sus partidas relacionadas, disponible sin exigir un botón nuevo en la interfaz.

El resumen de P3 conserva su significado: cantidad de partidas, tiempo acumulado y avance de la sesión más reciente por su fecha. El progreso semanal es una vista adicional y no sustituye ese resumen. Se mantiene la identidad visual de PLAYLOG!.

### Evolución prevista: E2

- Crear, consultar y editar metas asociadas a videojuegos existentes, y consultar las metas de un videojuego.
- Tener como máximo una meta activa por videojuego. Intentar crear una segunda meta activa se rechaza con un mensaje claro.
- Fijar horas semanales mayores que cero y de hasta 100 horas, y un objetivo entero de entre 1 y 7 días por semana.
- Definir hasta cinco hitos por meta, cada uno con descripción y un objetivo de avance entre el 1 % y el 100 %.
- Desactivar una meta mediante una acción explícita con confirmación y conservar las metas anteriores mientras exista el videojuego.
- Mostrar en el detalle las horas de la semana frente a la meta, su porcentaje y barra, los días jugados frente al objetivo, la racha actual, la mejor racha y los hitos de la meta activa.
- Distinguir carga, error y ausencia de datos. Sin meta activa, invitar a crear una y seguir mostrando la actividad disponible.
- Reflejar los cambios de progreso después de registrar o eliminar partidas. La edición de partidas permanece como punto abierto de alcance.
- Eliminar las metas y sus hitos cuando se elimina el videojuego al que pertenecen.

## No-alcance

- Notificaciones, recordatorios, metas compartidas entre usuarios, rankings y gráficos históricos.
- Nuevas pantallas de historial de metas o de evaluación mensual no solicitadas en la ficha.
- Agregar edición de partidas sin aclaración del profesor y autorización posterior.
- Incorporar un botón de eliminación de videojuegos que no fue exigido para la interfaz de P3.
- Dividir una partida entre varios días, rediseñar PLAYLOG! o cambiar las reglas del resumen existente.
- Resolver deudas diferidas fuera de la fase y el alcance aprobados. Las correcciones de entradas inválidas y de quitar la calificación siguen asignadas a la fase 8.

## Reglas comunes de actividad y progreso

- Cada meta corresponde a un videojuego. Su actividad se evalúa por separado de la de los demás juegos.
- La semana actual comprende de lunes a domingo y los días se interpretan según America/Guayaquil.
- Las horas semanales son la suma de los minutos de las partidas elegibles de esa semana, dividida entre 60 y redondeada a un decimal.
- El porcentaje de horas se obtiene dividiendo las horas semanales mostradas entre las horas objetivo y multiplicando por 100; se redondea a un entero.
- Los días jugados son fechas distintas con al menos una partida del videojuego. Las rachas se basan en todo su historial elegible, no solo en la semana actual.
- La racha actual es la secuencia consecutiva que llega hasta hoy o, si hoy no se ha jugado, hasta ayer. Si no llega a ninguno de esos días, es cero. La mejor racha es la mayor secuencia consecutiva del historial elegible.
- Sin partidas elegibles para la actividad, las horas, días y rachas son cero. Sin ninguna partida registrada, ningún hito está alcanzado. Si solo existen partidas futuras, los hitos utilizan igualmente el avance del resumen de P3: pueden estar alcanzados aunque la actividad de E2 sea cero.

## Ocho decisiones de negocio aprobadas

| ID | Situación | Regla aprobada y consecuencia |
| --- | --- | --- |
| RN-01 | Hoy todavía no hay partida, pero ayer sí | La racha sigue viva durante hoy. Se rompe cuando transcurre un día completo sin jugar. Jugar hoy añade un día a la secuencia; no jugar hoy hace que mañana ya no siga viva. |
| RN-02 | Varias partidas en el mismo día | Cuentan como un único día jugado para ese videojuego y para su racha. Todas sus duraciones suman al tiempo correspondiente. |
| RN-03 | Una partida cruza medianoche | Pertenece al día de inicio según America/Guayaquil. Toda su duración se asigna a ese día y a su semana, incluso si termina en la siguiente. La fecha registrada representa el inicio de la partida. |
| RN-04 | Cambia la meta durante la semana | Los cambios se aplican inmediatamente a toda la semana actual, tanto para las horas como para los días objetivo. El cumplimiento puede subir o bajar al editar la meta. |
| RN-05 | Se supera la meta de horas | El porcentaje puede superar el 100 %. La barra visual se limita al 100 %. Por ejemplo, 7 horas frente a una meta de 5 muestran 140 %. |
| RN-06 | El avance disminuye después de alcanzar un hito | Los hitos se recalculan desde el avance actual del resumen de P3. Un hito está alcanzado cuando ese avance iguala o supera su objetivo; puede dejar de estarlo si el avance disminuye. No representa una conquista histórica permanente. |
| RN-07 | Videojuego completado o abandonado | Puede conservar una meta activa. El cambio de estado del videojuego no la desactiva automáticamente: desactivarla es una decisión explícita de la persona. |
| RN-08 | Se elimina un videojuego | Se eliminan todas sus metas, activas e inactivas, junto con sus hitos. El historial de metas no se conserva después de eliminar el videojuego y no deben quedar metas sin juego asociado. |

## Decisiones adicionales aprobadas

| ID | Regla |
| --- | --- |
| RA-01 | Cumplir una semana requiere alcanzar simultáneamente las horas y los días objetivo. |
| RA-02 | Las partidas con fecha futura no cuentan para las horas, los días ni las rachas de E2 hasta que llegue su fecha. Los hitos utilizan exactamente el avance del resumen original de P3, incluso si procede de una partida futura. No se modifica el resumen ni se introduce otro cálculo de avance. Esta diferencia es una regla explícita y una limitación conocida aceptada, no una decisión pendiente. |
| RA-03 | Crear una meta incluye todas las partidas elegibles de la semana actual, también las anteriores a su creación. No se reinicia la actividad acumulada al crearla. |
| RA-04 | Sin meta activa se muestran horas, días y rachas, pero no un porcentaje de cumplimiento ni hitos de metas anteriores. Se invita a crear una meta. |
| RA-05 | Editar una meta modifica la existente. Desactivarla y crear otra conserva la anterior como historial. La nueva meta activa se evalúa sobre toda la semana actual. Conservar ese historial no implica añadir una pantalla nueva. |
| RA-06 | La edición de partidas permanece pendiente de aclaración con el profesor. No se incorpora por suposición. |

## Supuestos y límites

- Se utiliza el diario de la misma persona; esta épica no introduce colaboración ni nuevas funciones de gestión de usuarios.
- La fecha registrada es la referencia para el día de inicio; el momento en que se introduce la partida no reemplaza esa fecha.
- La meta tiene un ciclo de vida propio: puede cambiarse, desactivarse y reemplazarse sin cambiar la ficha del videojuego. Sus hitos solo tienen sentido dentro de esa meta y desaparecen con ella.
- Los hitos de metas no se confunden con los logros que ya existen en la ficha del videojuego.
- El historial de metas se conserva al reemplazarlas, pero editar una meta no promete conservar cada versión anterior de sus objetivos.
- La eliminación completa es un requisito del producto; el riesgo de eliminación parcial registrado como D9 continúa diferido y no se presenta como resuelto.
- Limitación conocida aceptada: una partida futura puede determinar el avance de los hitos mediante el resumen de P3 aunque todavía no sume horas, días ni rachas. La decisión queda resuelta y no bloquea los tickets de hitos.

## Puntos abiertos justificados

| Asunto | Motivo y límite hasta resolverlo |
| --- | --- |
| Edición de partidas | El enunciado pide actualizar el progreso después de editar, pero P3 no ofrece esa función. Se espera aclaración del profesor antes de comprometer un flujo nuevo. No afecta al compromiso de actualizar tras registrar o eliminar. |
| Evidencia de la métrica mensual | Falta precisar qué cuatro semanas se observarán y cómo se evaluarán semanas sin meta o con cambios de objetivo. La meta de éxito se conserva; no se crea seguimiento histórico automático por suposición. |

Las reglas aprobadas se trasladarán a las historias, criterios y verificaciones en las fases posteriores. Este documento no los sustituye ni autoriza comenzar su implementación.
