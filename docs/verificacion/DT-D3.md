# DT-D3 — Errores de validación HTTP

Fase 8, 2026-11-10. Criterios aprobados: DT-CA-01, DT-CA-02 y DT-CA-03 del [backlog](../backlog/E2-metas-y-rachas.md). El [diagnóstico](../diagnostico.md) conserva la evidencia histórica de P3.

| Criterio | Regresión y resultado comprobado |
| --- | --- |
| DT-CA-01 | JSON mal formado en P3 y Meta devuelve 400, sin escrituras. X-Request-Id coincide con requestId del JSON. |
| DT-CA-02 | Actualizar logro con cuerpo ausente, null, vacío, arreglo u obtenido no booleano devuelve 400, sin escrituras ni modificación de los datos en memoria. Un cuerpo válido conserva 200. |
| DT-CA-03 | Error y SyntaxError internos siguen devolviendo 500 genérico con requestId, sin exponer detalles. |

Primero se creó `backend/test/deuda-d3.test.ts`: **6 aprobadas y 5 fallidas**. Se reprodujeron respuestas 500 en vez de 400 y ausencia del identificador; no fueron fallos de sintaxis/importación de los tests. Después de corregir producción: **11 aprobadas, 0 fallos**.

Corrección mínima: asignar requestId antes de los parsers; reconocer únicamente el SyntaxError del parser identificado por `type: entity.parse.failed` y `status: 400`; comprobar que el cuerpo del logro sea objeto y obtenido booleano antes de acceder a sus campos. No se convierte cualquier SyntaxError en 400. No se modificaron modelos, resumen de P3, reglas de E2 ni D5.

Comandos ejecutados desde la raíz:

```sh
backend/node_modules/.bin/tsx --test backend/test/deuda-d3.test.ts
backend/node_modules/.bin/tsx --test --test-concurrency=1 backend/test/*.test.ts
backend/node_modules/.bin/tsc -p backend/tsconfig.json --noEmit --incremental false
backend/node_modules/.bin/tsc --noEmit --strict --target es2022 --module nodenext --moduleResolution nodenext --types node --typeRoots backend/node_modules/@types --skipLibCheck backend/test/*.ts
git diff --check
```

Regresión completa del backend, incluido el navegador conectado a Express de T15: **245 aprobadas, 0 fallos y 3 TODO**. TypeScript de producción/tests y diff check: sin errores.

Las solicitudes usan Express y los middlewares/controladores/servicios reales, con colecciones sustituidas en memoria y conexión de Mongoose bloqueada. Se inyectan errores internos para comprobar el manejo 500. No se accedió a una base real ni a archivos de entorno. Los tres TODO de integración MongoDB permanecen pendientes; esta corrección de HTTP no acredita persistencia real. La [verificación T15](E2-T15.md) conserva sus resultados históricos anteriores a esta deuda.
