# DT-D4 — Quitar calificación sin perder valores omitidos

Fase 8, 2026-11-10. Criterios aprobados: DT-CA-04 y DT-CA-05 del [backlog](../backlog/E2-metas-y-rachas.md). Corrección implementada y verificada con navegador/API/modelos reales y colecciones simuladas; **la comprobación de persistencia en MongoDB real permanece pendiente**.

## Contrato de actualización

Se conserva el significado de los números y del campo omitido en el PUT existente. La acción de quitar debe sobrevivir a JSON.stringify, a diferencia del undefined diagnosticado:

| Entrada | Resultado |
| --- | --- |
| Campo calificacion omitido, incluido undefined omitido por serialización | Conservar la calificación anterior. |
| Número válido de 0 a 10 | Guardar ese número; cero no significa borrar. |
| calificacion: null | Borrado explícito mediante $unset; GET ya no incluye el campo. No se guarda null como sustituto de ausencia. |

El botón existente envía null únicamente al quitar durante una edición; al crear un juego sin calificación continúa omitiéndola. `NuevoVideojuego` representa el marcador nullable. El servicio transforma solo el caso de borrado en `$unset` y conserva los demás campos mediante `$set`, sin mutar la entrada. Se mantienen los validadores de Mongoose, los modelos, endpoints y códigos HTTP existentes. No se modificaron el resumen de P3, estilos, componentes de metas ni cálculos E2.

## Criterio, prueba previa y resultado

| Criterio | Verificación ejecutada |
| --- | --- |
| DT-CA-04 | Quitar desde el formulario, guardar y consultar por GET; comprobar ausencia del campo en respuesta y fila del doble. Verificar la instrucción $unset generada por Mongoose. Repetir el borrado conserva la ausencia. Videojuegos ajenos no cambian. |
| DT-CA-05 | Cambiar solo título u omitir calificación conserva 8; undefined serializado también conserva 8. Elegir 0 o 10 guarda esos valores. Valores -1 y 11 devuelven 400 conservando 8. Quitar y volver a elegir 0 en la interfaz guarda 0/10. |
| Regresiones complementarias | IDs inválido/inexistente mantienen 400/404, sin cambios ajenos; el servicio no muta el objeto recibido. |

Antes del código se añadieron `backend/test/deuda-d4.test.ts` y `backend/test/deuda-d4.interfaz.test.ts`: **11 registros aprobados y 4 fallidos**. Fallaron el borrado explícito, su repetición y el recorrido de la interfaz, junto con su contenedor. Se observó que el campo anterior seguía presente; no fueron errores de sintaxis/importación de los tests.

Después de la corrección: **15 registros aprobados, 0 fallos** (11 casos HTTP/servicio, tres escenarios de interfaz y su contenedor). La interfaz ejecuta React → servicio HTTP existente → Express → servicio de videojuegos → Mongoose, sin sustituir fetch. Solo las colecciones se simulan; RAWG está bloqueado en esos recorridos porque no pertenece a la deuda.

Regresión backend final, incluidas D3, D4 y T15: **260 aprobadas, 0 fallos y 3 TODO**. TypeScript de producción/tests backend, frontend y configuración Vite, lint y build frontend con `envDir: false`: sin errores. No se cambiaron expectativas de pruebas aprobadas para conseguir estos resultados.

Comandos ejecutados desde la raíz:

```sh
backend/node_modules/.bin/tsx --test --test-concurrency=1 backend/test/deuda-d4.test.ts backend/test/deuda-d4.interfaz.test.ts
backend/node_modules/.bin/tsx --test --test-concurrency=1 backend/test/*.test.ts
backend/node_modules/.bin/tsc -p backend/tsconfig.json --noEmit --incremental false
backend/node_modules/.bin/tsc --noEmit --strict --target es2022 --module nodenext --moduleResolution nodenext --types node --typeRoots backend/node_modules/@types --skipLibCheck backend/test/*.ts
frontend/node_modules/.bin/tsc -p frontend/tsconfig.app.json --noEmit --incremental false
frontend/node_modules/.bin/tsc -p frontend/tsconfig.node.json --noEmit --incremental false
npm --prefix frontend run lint -- --no-cache
node --input-type=module -e 'import { build } from "./frontend/node_modules/vite/dist/node/index.js"; await build({root:"frontend",envDir:false});'
git diff --check
```

Regresión frontend final y comprobación del harness, también ejecutadas sin errores:

```sh
node --test --test-concurrency=1 frontend/test/formularioMeta.test.mjs frontend/test/progresoSemanal.test.mjs frontend/test/navegador-cierre.test.mjs
backend/node_modules/.bin/tsx --test frontend/test/metasApi.test.ts
node --test .codex/hooks/proteger-entorno.test.mjs
```

Resultado: **43 aprobadas** en navegador/runner, **14 aprobadas** de API frontend y **26 aprobadas** del harness, cero fallos y ningún TODO adicional. Con las 260 del backend suman **343 aprobadas, 0 fallos y 3 TODO**. Las pruebas del harness no acreditan la corrección funcional ni persistencia de D4.

## Límites

El doble comprueba el comando y la lectura posterior en memoria; **no demuestra persistencia real**. DT-CA-04 deberá volver a comprobarse con una base MongoDB de pruebas autorizada, mediante PUT, nueva lectura y ausencia real del campo. No se accedió a credenciales, archivos de entorno ni bases reales; no se instalaron dependencias. Permanecen intactos los tres TODO existentes de MongoDB: ciclo de vida de Meta, índice concurrente y cascada. La ausencia de MongoDB de pruebas y los límites de T15 están documentados en [E2-T15](E2-T15.md). La atomicidad D9 continúa diferida.
