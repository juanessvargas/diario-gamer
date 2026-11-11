# Épicas de PLAYLOG!

Documento de la fase 3 para revisión, basado en el enunciado, el diagnóstico histórico y el [PRD actualizado](../prd/playlog-e2.md). Define objetivos y alcance; no contiene todavía historias, tickets ni specs.

## E1 — Diario de Progreso Gamer: base del Proyecto 3

**Objetivo:** permitir a la persona reconocer qué videojuegos tiene, qué está jugando, cuánto tiempo les dedica y cuál es su avance actual.

**Estado:** funcionalidades existentes en el código de P3 incorporado al proyecto. El diagnóstico distingue lo inspeccionado y probado en aislamiento de las verificaciones de aplicación completa aún pendientes; esta descripción no afirma funcionamiento integral en producción.

**Alcance existente que se conserva:**

- Biblioteca con búsqueda y filtros, creación y edición de videojuegos, estados y calificación.
- Consulta del catálogo RAWG para seleccionar títulos y portadas, sin dar por verificada su integración real.
- Gestión de los logros asociados al videojuego.
- Registro, consulta e historial de partidas y eliminación de sesiones.
- Detalle con cantidad de partidas, tiempo total y avance de la sesión más reciente según su fecha.
- Eliminación de videojuegos y sus partidas relacionadas, sin añadir un botón nuevo de interfaz.
- Identidad visual y estados existentes de carga, error y ausencia de datos.

**Límites:** E1 no incluye edición de partidas existente ni metas o rachas ya implementadas. Las deudas identificadas no se consideran corregidas: D3 y D4 se pagan en la fase 8 y la atomicidad de D9 sigue diferida.

## E2 — Metas y rachas

**Objetivo:** permitir que la misma persona compare su actividad de cada videojuego con lo que se propuso para la semana y reconozca su constancia y avance.

**Estado:** producto definido para revisión en fase 3; implementación pendiente. La métrica de éxito es cumplir la meta semanal al menos en 3 de 4 semanas durante un mes, alcanzando tanto las horas como los días objetivo. No es un resultado ya medido.

**Alcance previsto:**

- Crear, consultar, editar y desactivar metas por videojuego, con un máximo de una activa y conservación de las anteriores al reemplazarlas.
- Objetivos de más de cero y hasta 100 horas semanales, y entre 1 y 7 días enteros por semana.
- Hasta cinco hitos por meta, con descripción y porcentaje objetivo entre 1 y 100; su estado depende del avance actual y puede retroceder.
- Progreso de lunes a domingo en America/Guayaquil: horas, porcentaje, días jugados frente al objetivo, racha actual, mejor racha e hitos en el detalle del juego.
- Reglas RN-01 a RN-08 y RA-01 a RA-06 del PRD: racha viva hasta ayer, días distintos, asignación al inicio, cambios inmediatos de meta, porcentaje sin tope con barra limitada, hitos recalculados, metas permitidas en juegos completados o abandonados y eliminación de todas las metas con el juego.
- Exclusión de partidas futuras; inclusión de la actividad de la semana anterior a crear la meta; y presentación de horas, días y rachas sin hitos anteriores cuando no hay meta activa.
- Formularios de creación y edición, desactivación con confirmación, estados de carga, error y vacío e invitación a crear una meta cuando no hay ninguna activa.
- Actualización del progreso después de registrar o eliminar una partida. La edición permanece pendiente de aclaración.

**No-alcance:** notificaciones, recordatorios, metas compartidas, rankings, gráficos históricos, nuevas pantallas de historial de metas, seguimiento mensual automático, división de sesiones entre días y rediseño del producto. No se agregan edición de partidas ni un botón de eliminación de videojuegos sin autorización.

**Dependencia y límites:** E2 se apoya en los videojuegos y partidas de E1 y conserva el significado del resumen existente. Los puntos abiertos sobre edición de partidas, evidencia mensual y avance futuro para los hitos se mantienen como están justificados en el PRD. No se omite la eliminación obligatoria de metas por diferir la atomicidad de D9.

La descomposición de E2 en historias, criterios y tickets corresponde a la fase 4 y todavía no se realiza.
