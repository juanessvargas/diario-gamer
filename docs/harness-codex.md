# Harness de Codex — fase 2

Fecha de preparación: 10 de noviembre de 2026.

## Alcance autorizado

El harness mantiene el frontend y backend de PLAYLOG! sin cambios y utiliza exclusivamente Codex en VS Code. No inicia PRD, backlog, specs o implementación E2; tampoco corrige D3, D4 o D9 ni autoriza commits o push.

Archivos del harness: `AGENTS.md`, `DESIGN.md`, `.agents/skills/preparar-spec/SKILL.md`, `.codex/config.toml`, `.codex/hooks/proteger-entorno.mjs`, `.codex/hooks/proteger-entorno.test.mjs` y este documento.

El diagnóstico conserva su estado histórico. D1 quedó resuelto mediante los commits `8ae1f60` y `4825f30`.

## Instalación y fuentes verificadas

- Extensión de VS Code: `openai.chatgpt 26.1021.22027`, macOS ARM64.
- Binario incluido: `codex-cli 0.164.0-alpha.11.1`.
- Su ayuda documenta `app-server --strict-config --print-startup-config`.
- La ayuda de `sandbox` documenta `--permission-profile` y `--cd`.
- La combinación `--strict-config` con `sandbox` falló en la exploración previa; se descartó con autorización del estudiante.
- Se consultaron los esquemas generados por el binario y el esquema oficial, sin modificar configuración global.

Referencias oficiales: [AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md), [skills](https://learn.chatgpt.com/docs/build-skills), [hooks](https://learn.chatgpt.com/docs/hooks), [permisos](https://learn.chatgpt.com/docs/permissions) y [esquema de configuración](https://learn.chatgpt.com/docs/config-schema.json).

## Memoria, skill y diseño

`AGENTS.md` debe permanecer en un máximo de 60 líneas. Enumera los comandos existentes, prohíbe acceso a archivos de entorno reales y exige autorización, specs previas y tests pertinentes.

La skill `preparar-spec` tiene frontmatter de Codex con `name` y `description`. Puede preparar una propuesta en la conversación; guardar requiere autorización y la fase correspondiente. En fase 2 debe informar prerrequisitos pendientes y no crear una spec.

`DESIGN.md` documenta los colores, tipografías, geometría, componentes, textos y patrones de accesibilidad observados. No supone una auditoría visual ya completada ni cambia los estilos actuales.

## Dos mecanismos de seguridad distintos

El hook `PreToolUse` inspecciona el evento recibido por stdin; no abre rutas mencionadas en la solicitud. Rechaza referencias explícitas a archivos de entorno, operaciones de patch y rutas de herramientas de archivos. Solo la plantilla conocida tiene una excepción de lectura. Un rechazo usa `hookSpecificOutput.permissionDecision = "deny"` y el identificador `PLAYLOG_ENV_GUARD`; permitir no añade una aprobación.

El análisis de comandos es una barrera complementaria: no interpreta todos los programas, expansiones, enlaces o accesos indirectos. Un error de ejecución o una configuración no confiada del hook puede impedir que se aplique. Por eso sus tests no equivalen a aislamiento del sistema de archivos.

El perfil nativo `playlog` extiende `:workspace` y deniega `**/.env` y `**/.env.*`. Contiene una entrada de solo lectura para `backend/.env.example`, pero la prueba integrada también rechazó esa lectura. Por decisión expresa del estudiante se conserva exactamente esta política y se acepta el bloqueo adicional como limitación conocida. No se afirma que la excepción funcione. El perfil debe estar realmente seleccionado para proteger los procesos cubiertos por el sandbox. Los ajustes antiguos `sandbox_mode` pueden prevalecer; no se modifican automáticamente.

La confianza del proyecto, la revisión del hook y la activación efectiva en VS Code están pendientes hasta comprobarlas desde la interfaz. No se cambian ajustes globales ni se elude la revisión de confianza. La protección no cubre la terminal manual del estudiante ni herramientas externas ajenas al sandbox.

## Comandos de verificación

Desde la raíz:

```sh
wc -l AGENTS.md
node --check .codex/hooks/proteger-entorno.mjs
node --check .codex/hooks/proteger-entorno.test.mjs
node --test .codex/hooks/proteger-entorno.test.mjs
backend/node_modules/.bin/tsc -p backend/tsconfig.json --noEmit --incremental false
frontend/node_modules/.bin/tsc -p frontend/tsconfig.app.json --noEmit --incremental false
frontend/node_modules/.bin/tsc -p frontend/tsconfig.node.json --noEmit --incremental false
npm --prefix frontend run lint -- --no-cache
git diff --check
git status --short
```

La configuración se validará con el binario incluido mediante `app-server --strict-config --print-startup-config`. La validación temporal de la confianza del proyecto, si se necesita para cargar su capa, será un override solo de esa invocación; no se escribe configuración global ni se aprueba el hook automáticamente.

El siguiente comando es el registro histórico de la prueba integrada, con la ruta del binario utilizada entonces. No se repitió en este cierre: su expectativa de lectura de la plantilla sigue siendo incompatible con la limitación aceptada. La instalación actual está en `openai.chatgpt-26.51021.22027-darwin-arm64` y reportó la misma versión `0.164.0-alpha.11.1` durante el diagnóstico posterior.

```sh
PLAYLOG_CODEX_BIN='/Users/juanestebanvargasjerez/.vscode/extensions/openai.chatgpt-26.1021.22027-darwin-arm64/bin/macos-aarch64/codex' \
  node .codex/hooks/proteger-entorno.test.mjs --integration
```

Esta prueba crea un directorio temporal propio con marcador, controles y archivos de entorno ficticios. Lee únicamente las entradas del perfil en el TOML del proyecto y las transmite como una única tabla inline mediante `-c permissions={...}` al proceso `sandbox --permission-profile playlog --cd <temporal>`. Las rutas con puntos permanecen como claves dentro del valor TOML. Así prueba los valores del perfil sin depender de la confianza de otro proyecto temporal ni cambiar configuración global. El formato admitido por ese lector es deliberadamente el de las tablas de cadenas del perfil actual; la validación TOML completa corresponde al parser de Codex.

El proceso protegido comprueba lecturas y escrituras de los señuelos, la plantilla ficticia de solo lectura y operaciones normales permitidas. El proceso padre verifica que los señuelos sigan intactos y elimina exclusivamente el directorio que creó. No utiliza el `.env` real del proyecto. No se ejecuta el arranque de Express ni Vite, que pueden cargar archivos de entorno.

## Resultados reales

| Comprobación | Estado |
| --- | --- |
| Ayuda del binario y versión | Confirmadas antes de crear los archivos. |
| Límite de líneas e inspección de AGENTS.md | Comprobado nuevamente: 49 líneas; cumple el máximo de 60. Skill y `DESIGN.md` presentes y leídos. Frontmatter de la skill con `name` y `description`; figura en el catálogo de skills de esta sesión, pero no se probó su invocación desde la interfaz. |
| Sintaxis de los dos módulos Node | Repetidos ambos comandos `node --check` en este cierre: código 0, sin errores. |
| Configuración con parser estricto de Codex | Se repitió `app-server --strict-config --print-startup-config`: código 0 y sin stderr. La confianza temporal se transmitió como una tabla `projects={...}`, sin persistirla ni imprimir la configuración. No demuestra activación en VS Code. |
| Hook con eventos simulados y protocolo CLI | Repetido `node --test .codex/hooks/proteger-entorno.test.mjs` en este cierre: 26 aprobadas, cero fallos, canceladas u omitidas; código 0. Solo inspecciona solicitudes simuladas y no ejecuta sus comandos de acceso a entorno. |
| Perfil con señuelos en sandbox nativo | La tabla `permissions={...}` fue reconocida y se ejecutó el proceso protegido. FALLÓ la comprobación 9 de 11: leer la plantilla ficticia `backend/.env.example` produjo `EPERM`. Por el orden secuencial del comprobador, antes se completaron lectura y escritura normales y seis rechazos sobre `.env`, `.env.local` y `backend/.env`. Las dos comprobaciones posteriores no se ejecutaron y no hubo un resumen exitoso de integración. |
| Tipos y lint del código existente | Ejecutados en este cierre los tres comandos `tsc --noEmit --incremental false` indicados arriba (backend, frontend app y configuración Vite) y `npm --prefix frontend run lint -- --no-cache`: los cuatro terminaron con código 0, sin errores. El backend no declara un script de lint y ninguno declara `test`; no se inventan comandos. No se ejecutaron build, servidores, MongoDB ni pruebas de aplicación. |
| Preservación de archivos existentes y estado Git | La comparación inicial registró 70 archivos versionados no protegidos intactos. En este cierre `git diff --exit-code -- backend frontend`, `git diff --cached --exit-code` y `git diff --check` terminaron con código 0. Los otros seis archivos del harness conservan sus SHA-256 iniciales de este cierre, incluida la política y el comprobador. Solo se actualizó este documento. Git sigue mostrando los siete archivos del harness sin versionar; no se hicieron commits ni push. |
| Detección de la skill, confianza y ejecución del hook en VS Code | Pendiente de prueba en la interfaz. |

Esta tabla se actualizará únicamente con los resultados efectivamente obtenidos. Si falla una prueba se registra el error, se explica y se detiene el trabajo antes de cambiar la solución.

### Incidencias de la prueba integrada

La primera ejecución reconoció `sandbox --permission-profile playlog`, pero rechazó los overrides individuales con `data did not match any variant of untagged enum FilesystemPermissionToml`. El estudiante autorizó corregir su transmisión y repetir las comprobaciones.

Se sustituyeron esos overrides por una única tabla TOML `permissions={...}`. La ayuda del binario confirma que el valor de `-c` se interpreta como TOML. La nueva validación estricta terminó correctamente; la integración llegó a ejecutar el proceso con el perfil seleccionado. No se modificaron reglas, patrones ni excepciones de `.codex/config.toml`.

La segunda ejecución se detuvo con `EPERM: operation not permitted, open '<temporal>/backend/.env.example'`. Este archivo era una plantilla ficticia creada por el propio comprobador; la política acordada debía permitir leerla. Se verificaron las ocho comprobaciones previas por el orden de ejecución, pero no pasó la suite integrada. El bloque `finally` eliminó el directorio temporal en ambas ejecuciones. No se accedió a archivos de entorno reales.

El estudiante decidió no continuar investigando la excepción ni ejecutar una matriz experimental. Se acepta el bloqueo adicional de la plantilla como limitación conocida no crítica para continuar el trabajo académico. Se mantienen la política, los nombres de archivos y el comprobador; la integración conserva su fallo conocido, no se marca como aprobada y no se repite en este cierre. Las dos comprobaciones que quedaron sin ejecutar siguen sin evidencia. No se ha confirmado la causa interna de la discrepancia entre la excepción configurada y el rechazo del sandbox.

El rechazo del hook sigue comprobado únicamente con entradas simuladas en su proceso CLI. El sandbox demostró los seis rechazos indicados y las operaciones normales previas, pero la excepción de la plantilla no cumple lo esperado. La interceptación de herramientas en VS Code permanece pendiente; no se declara el harness completamente operativo.

En este cierre se revisaron las capacidades disponibles de la sesión: no hay una herramienta de control de la interfaz de VS Code ni de consulta de la activación y ejecución del hook en su sesión activa. No se ejecutó un acceso a un señuelo como si eso, por sí solo, demostrara la interceptación. La activación real y la selección efectiva del perfil en VS Code quedan pendientes de comprobación manual; no se cambió la confianza ni la configuración global. Es una brecha de verificación explícita, no evidencia de que el mecanismo esté activo. La decisión del estudiante permite continuar con esta limitación documentada, sin iniciar todavía la fase 3.

## Comprobación pendiente en VS Code

1. Recargar Codex y confirmar que carga `AGENTS.md` y ofrece `$preparar-spec`.
2. Pedir a la skill identificar los prerrequisitos de una spec sin escribir; debe respetar la fase 2.
3. Revisar la configuración y confiar explícitamente en el proyecto y en el hook mediante la interfaz disponible.
4. Seleccionar el perfil `playlog` y comprobar el perfil efectivo; no darlo por activo por existir el TOML.
5. Ejecutar una prueba autorizada contra un señuelo ficticio y verificar el rechazo identificable del hook, no solo una negativa del modelo o un error de archivo inexistente.
6. Conservar evidencia visual de la configuración y del bloqueo. No se ha generado una captura ficticia.

## Adaptación respecto de Claude y la rúbrica

Por decisión expresa del estudiante no se crean `CLAUDE.md` ni `.claude/`. La memoria es `AGENTS.md`, la skill se descubre en `.agents/skills/` y el hook se configura en TOML de Codex. No se copian `disable-model-invocation` ni configuraciones de Claude.

Se preservan los objetivos académicos de memoria, skill, seguridad verificable, diseño, SDD, tests y trazabilidad. Los archivos y la captura literal de Claude no quedarían cubiertos; se sustituye su evidencia por la configuración real de Codex, los resultados locales y la comprobación posterior en VS Code. No se afirma una aceptación del profesor que no se haya documentado.


## Comprobación de preparación final — 2026-11-10

Se confirmó `codex-cli 0.164.0-alpha.11.1` en la extensión instalada y la ayuda de sus opciones. La validación nativa `app-server --strict-config --print-startup-config` terminó con código 0, sin mostrar la configuración capturada. El intento previo de usar tomllib no estaba disponible en Python del sistema; no se instaló nada. Los 26 tests del guard volvieron a pasar. AGENTS.md conserva 49 líneas y la skill y DESIGN.md están presentes.

El guard rechazó la revisión de la plantilla en esta sesión; no se intentó eludirlo. El estudiante confirmó manualmente que solo contiene valores ficticios. Esta confirmación no demuestra una excepción de lectura funcional ni una revisión automatizada de nombres. Se mantienen los seis rechazos ficticios históricos, la limitación conocida y las dos comprobaciones posteriores no ejecutadas, sin nuevos experimentos.

Sigue pendiente demostrar confianza, invocación de la skill y perfil/hook efectivos desde la interfaz de VS Code con captura y señuelos. La validación CLI y un rechazo observado no sustituyen esa evidencia. La documentación oficial de [hooks](https://learn.chatgpt.com/docs/hooks) exige revisión/confianza para hooks de proyecto; la de [permisos](https://learn.chatgpt.com/docs/permissions) advierte sobre ajustes de sandbox que pueden prevalecer. No se cambió configuración global ni se crearon archivos Claude. Véase el [registro final](verificacion/preparacion-entrega.md).
