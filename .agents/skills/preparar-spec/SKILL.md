---
name: preparar-spec
description: Preparar una propuesta de spec SDD de PLAYLOG! a partir de requisitos y tickets aprobados; no implementar funcionalidades ni guardar archivos sin autorización.
---

# Preparar una spec de PLAYLOG!

Usar esta skill cuando el estudiante pida preparar o revisar una spec del proyecto. Su salida inicial es una propuesta en la conversación. La selección de la skill no autoriza cambios.

## Antes de proponer

1. Consultar las instrucciones del proyecto en [AGENTS.md](../../../AGENTS.md) y confirmar la fase autorizada.
2. Si seguimos en diagnóstico o harness, informar los prerrequisitos pendientes; no redactar specs de E2 ni crear archivos.
3. Leer los documentos aprobados relevantes: enunciado, PRD, historias, criterios y tickets. Si faltan o se contradicen, explicar el hueco y pedir una decisión.
4. Consultar solo el código necesario para contrastar contratos y dependencias; respetar la prohibición de acceso a archivos de entorno y credenciales.
5. Para interfaz, consultar [DESIGN.md](../../../DESIGN.md). Conservar las decisiones del diagnóstico, incluida la deuda diferida.

## Propuesta

- Identificar el ticket, los criterios que cubre, el objetivo y los límites.
- Distinguir requisitos aprobados, supuestos y decisiones pendientes. No inventar producto para completar una tabla.
- Expresar las reglas de la spec mediante DEBE y NO DEBE.
- Incluir una tabla criterio → verificación, con escenarios y evidencia prevista.
- Incluir una tabla ticket → archivos afectados, sin prometer rutas o APIs que no se hayan acordado.
- Precisar los casos de error pertinentes y qué se prueba sin base de datos.
- Mantener el detalle técnico en la spec; no reescribir el PRD como documento técnico.
- No generar implementación, nuevas dependencias, PRD o backlog como efecto secundario.

## Guardado y trazabilidad

Presentar la propuesta antes de persistirla. Guardar únicamente si existe autorización explícita para esa spec, su archivo y la fase correspondiente; la autorización puede estar en la conversación y no debe pedirse de nuevo si ya cubre la acción.

Si se autoriza guardar, limitar el cambio al alcance aprobado y mostrar qué se escribió. Un archivo existente requiere revisar sus diferencias, sin sobrescribir trabajo ajeno.

No ejecutar `git add`, commits, merges ni push con esta skill. La spec debe quedar registrada antes que el código que la implementa cuando se autoricen los commits correspondientes.

## Verificación de la skill

En fase 2, la invocación `$preparar-spec` debe reconocer que todavía faltan los artefactos de producto y limitarse a informar. La detección y el comportamiento reales en la extensión se comprobarán tras recargar Codex; no basta con que este archivo exista.
