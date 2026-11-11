# Checklist de rúbrica y entrega E2

Revisión documental del 2026-11-10 sobre la base `7c6ac79`. Fuente: [ENUNCIADO-E2.md](../ENUNCIADO-E2.md). No es una calificación ni aprobación del profesor. Los resultados por criterio están en la [auditoría](AUDITORIA.md).

Leyenda: `[x]` evidencia suficiente en el alcance indicado; `[ ]` pendiente o parcial, detallado en la fila. Una prueba con dobles no cierra una exigencia de MongoDB real.

| Estado | Exigencia del profesor | Evidencia / diferencia o acción restante |
| --- | --- | --- |
| [x] | Diagnóstico con tabla, clasificación y decisiones | [diagnóstico](diagnostico.md), `8ae1f60`; base integrada en `4825f30`. D3/D4 trazadas, D9 diferida. |
| [x] | AGENTS.md de máximo 60 líneas y reglas mínimas | [AGENTS.md](../AGENTS.md): 49 líneas; stack, estructura, comandos, autorización, entorno protegido, spec previa y tests. |
| [x] | Sistema de diseño documentado y mencionado desde instrucciones | [DESIGN.md](../DESIGN.md), sección frontend de AGENTS.md y revisión en [frontend/test/README.md](../frontend/test/README.md). |
| [ ] | Harness literal Claude: CLAUDE.md, skill y hook en sus rutas, / y /hooks | No se crearon archivos Claude por decisión explícita. Codex usa AGENTS.md, `.agents/skills/` y `.codex/`. Adaptación documentada, no aceptación docente demostrada. |
| [ ] | Skill y hook funcionando en el entorno del agente, con captura de /hooks | [skill](../.agents/skills/preparar-spec/SKILL.md) presente; hook 26/26 con eventos simulados; falta invocación/activación demostrada y captura equivalente desde VS Code. No se fabricó imagen. |
| [ ] | Seguridad del perfil efectivo | [harness](harness-codex.md): seis accesos ficticios rechazados, pero lectura de plantilla ficticia también rechazada; dos comprobaciones posteriores no ejecutadas. Falta selección efectiva del perfil y prueba de interfaz. El fallo conocido no se declara aprobado. |
| [x] | PRD de producto sin detalle técnico, ocho huecos y puntos abiertos | [PRD](prd/playlog-e2.md), reglas RN-01–08 y RA-01–06; hitos futuros resueltos preservando P3. |
| [x] | Épicas E1/E2, historias INVEST, criterios y tickets con DoD/dependencias | [épicas](backlog/epicas.md), [backlog](backlog/E2-metas-y-rachas.md): 9 historias, 45 criterios E2, 5 de deuda y 17 tickets; estado actualizado sin declarar cerradas verificaciones reales pendientes. |
| [x] | Dos specs con DEBE/NO DEBE y ambas tablas | [backend](specs/01-backend-metas-progreso.md), [frontend](specs/02-frontend-metas-rachas.md), registradas en `c9c99fe`. |
| [x] | Specs anteriores al código y commits identificados por ticket | Ancestros Git verificados; T03/T04, T06/T07 y T08/T09 conservan tests antes del código. D3/D4 tienen sus commits independientes. |
| [x] | Justificar Meta referenciada, hitos embebidos y alcanzado derivado | [spec backend](specs/01-backend-metas-progreso.md), justificación documental; ciclo de vida, lista acotada y resumen P3 reutilizado. La defensa oral aún corresponde al estudiante. |
| [ ] | Meta, CRUD, única activa, errores y persistencia comprobados | Implementados y cubiertos con modelos/servicios reales y dobles; falta MongoDB real para ciclo de vida e índice concurrente. |
| [x] | Funciones puras con al menos un test por criterio verificable sin base | [progreso](../backend/test/progreso.test.ts), [hitos](../backend/test/hitos.test.ts), suites de Meta/HTTP y matriz de [auditoría](AUDITORIA.md). |
| [x] | Sin partidas, cinco partidas en fechas distintas, racha rota y 400/404/409; tabla curl o Thunder Client | [T15](verificacion/E2-T15.md) y [curl ejecutado](verificacion/curl-E2.md): Express real con colecciones simuladas, no Atlas. |
| [ ] | Cascada sin metas huérfanas en la base | Código y casos H/R aprobados; falta cascada real en MongoDB. D9 no promete atomicidad ante fallos. |
| [x] | Formulario, confirmación, progreso, estados y servicio metasApi separado | T12–T14 y T15; la interfaz sí se conectó a Express con colecciones simuladas. |
| [x] | Diseño desde tokens, revisión, teclado y estados | Tabla de revisión frontend, pruebas de 320–1280 px, zoom por CDP, foco y movimiento reducido. No equivale a auditoría WCAG completa. |
| [ ] | Refresco después de registrar, editar y eliminar partidas | Registro y eliminación comprobados; **edición** no existe en P3 ni fue autorizada. El PRD la deja pendiente de aclaración docente; no se incorpora por suposición. |
| [x] | Auditoría por criterio y bitácora de 5–8 momentos | [AUDITORIA.md](AUDITORIA.md): 50 criterios y requisitos B/F; [bitácora](bitacora-agente.md): 8 momentos sustentados. |
| [ ] | Nota sobre un desvío del agente respecto a la spec | Se documenta un fallo real del agente en la verificación y su corrección. No hay evidencia de un desvío funcional detectado por el estudiante; no se inventa. Confirmar suficiencia literal con el profesor. |
| [ ] | Pagar dos deudas con criterio → test → código → verificación | D3: `c40e23d`, 11/11. D4: `7c6ac79`, 15/15 con dobles y navegador/API reales; falta confirmar persistencia real de D4. [Evidencia D3](verificacion/DT-D3.md), [D4](verificacion/DT-D4.md). |
| [x] | Resto de deuda con justificación | D5, D8, D9 y límites de P3 en backlog. README aclara eliminación por API y completa ejecución, sin añadir botón. |
| [x] | README con ejecución, variables sin secretos y proceso del agente | [README](../README.md); comandos contrastados con scripts y rutas. No se ejecutó instalación limpia ni arranque con base real. |
| [ ] | Archivos de entorno reales fuera de Git y plantilla actualizada sin secretos | `git ls-files` no mostró archivos de entorno reales; sí la plantilla del backend. Solo se revisaron nombres, sin abrir esos archivos. La plantilla no se actualizó ni certificó; revisión manual autorizada pendiente. Esto no certifica ausencia de secretos en todo el historial. |
| [ ] | Frontend/API E2 en los mismos servicios Render y Atlas | Sin despliegue autorizado ni URLs E2 verificadas; pruebas locales no son producción. |
| [ ] | PR con tickets y enlace a auditoría, integrado a main | Commits locales en `feature/e2-metas-rachas`; no se hizo push, PR ni merge. |
| [ ] | Demo en vivo o grabada, máximo 6 minutos, con trazabilidad completa | Pendiente de realización. Puede usar el guion de abajo; no se presenta un test como demo entregada. |

## Diferencias de harness que deben explicarse

| Literal Claude | Implementación de este proyecto | Límite |
| --- | --- | --- |
| CLAUDE.md con @AGENTS.md | AGENTS.md directo en Codex | No hay CLAUDE.md ni equivalencia aceptada por el profesor en el repositorio. |
| `.claude/skills/`, disable-model-invocation | `.agents/skills/preparar-spec/SKILL.md`, instrucciones que exigen autorización antes de guardar | No se copiaron claves Claude. La restricción de la skill es instruccional; no equivale a un control de permisos independiente. |
| `.claude/settings.json`, hooks y /hooks | `.codex/config.toml`, PreToolUse y perfil nativo, tests Node | Evidencia CLI local; activación y captura en VS Code pendientes. |
| Hook adicional de entorno | Guard de solicitudes más perfil de archivos | Capas complementarias, no dos hooks independientes ni aislamiento universal. La plantilla también se bloquea; acceso indirecto no queda cubierto por el analizador textual. |

No se instalan Claude ni herramientas extra para producir apariencia de cumplimiento literal. La decisión del estudiante autoriza la adaptación técnica, pero no sustituye la evaluación del profesor.

## Acciones restantes para entregar

1. Proporcionar una base MongoDB de pruebas autorizada y aislada: ejecutar ciclo de vida de Meta, índice único concurrente, cascada y lectura persistida de D4. Conservar evidencia sin tocar producción.
2. Verificar skill, confianza, hook y perfil efectivo desde VS Code con señuelos, y guardar captura real. Acordar con el profesor la equivalencia de Codex.
3. Revisar manualmente la plantilla de entorno y certificarla sin credenciales; confirmar la configuración real necesaria para Render. Esta entrega no modifica esos archivos.
4. Aclarar edición de partidas y el tipo de reflexión sobre desvíos que exige el profesor. No añadir funcionalidades por inferencia.
5. Con autorización posterior, actualizar/verificar frontend y API en Render con Atlas y registrar URLs públicas. Probar RAWG/configuración real si se usa en la demo.
6. Publicar la rama, preparar PR con E2-T01–T15, DT-D3/DT-D4 y enlace a auditoría; completar revisiones y merge a main cuando se autorice.
7. Realizar/grabar demo de máximo 6 minutos: crear meta con hitos → registrar partidas → horas/días/rachas → alcanzar/revertir hito → provocar 409 → recorrer RN/CA/ticket/spec/test/código/auditoría. No usar datos de producción como señuelos.

La métrica «3 de 4 semanas» sigue siendo objetivo de producto sin periodo/evidencia acordados; no exige inventar gráficos o seguimiento mensual automático. La rúbrica tiene una inconsistencia de ponderación: los títulos de Backend y Frontend dicen 4 puntos, pero sus escalas terminan en 2 y muestran /2. No se asume una nota total; corresponde aclararlo con el profesor.
