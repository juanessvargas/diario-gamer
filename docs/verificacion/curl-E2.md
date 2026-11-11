# Tabla de peticiones curl — cierre documental E2

Ejecutada el 2026-11-10 sobre `7c6ac79`. **Nivel H: curl real → Express/controladores/servicios/dominio reales → colecciones simuladas. No MongoDB real.** No se arrancó index.ts ni se utilizaron servidores externos o datos de producción. El servidor se creó en loopback con puerto efímero y se cerró al terminar.

Reloj fijo: domingo `2026-11-15T12:00:00-05:00`. Juego ficticio: `000000000000000000000001`. Cada solicitud usó `curl -sS --max-time 5 -X MÉTODO -w '\n%{http_code}' URL`, añadiendo Content-Type y cuerpo JSON cuando corresponde.

| Petición / escenario | Respuesta observada | Comprobación |
| --- | --- | --- |
| GET progreso-semanal, sin partidas ni meta | 200 | Horas/días/rachas 0, meta y porcentaje null, hitos []. |
| POST metas: 5 h, 4 días, hito 50 % | 201 | Meta creada por los servicios reales sobre el doble. |
| Cinco POST partidas, lunes 9 a viernes 13 | 201 en las cinco | Cada una de 84 minutos y avance 60; cinco fechas distintas. |
| GET progreso-semanal el domingo | 200 | 7 h, 5 días, 140 %, racha actual 0, mejor 5, hito alcanzado. El sábado sin jugar rompe la racha. |
| GET progreso con ID inválido | 400 | Identificador rechazado. |
| GET progreso con ID válido inexistente | 404 | Juego no encontrado. |
| Segundo POST de meta activa | 409 | Conflicto real de servicio, sin segunda activa. No prueba índice MongoDB. |
| DELETE videojuego existente | 204 | Partidas y metas del doble eliminadas; cuerpo vacío. No prueba atomicidad. |

Resultado del script: **1 escenario de comprobación aprobado, 0 fallos**, con **12 peticiones curl**. Es evidencia adicional ejecutada, no una nueva prueba dentro del conteo 343 de las suites versionadas. No se generó una colección Thunder Client ni se fabricó evidencia de Atlas.

## Reproducción desde la raíz

Requiere las dependencias del proyecto ya presentes y curl disponible. No necesita una base ni un backend arrancado; no cambiar este script para apuntar a producción. El soporte importado bloquea conexiones reales de Mongoose y solo modifica filas ficticias en memoria.

```sh
node --import ./backend/node_modules/tsx/dist/loader.mjs --input-type=commonjs <<'JS'
const test = require('node:test');
const assert = require('node:assert/strict');
const { promisify } = require('node:util');
const { execFile } = require('node:child_process');
const { servidorIntegrado } = require('./backend/test/soporte-integracion.ts');
const { JUEGO, INEXISTENTE, datosMeta } = require('./backend/test/soporte-metas.ts');
const ejecutar = promisify(execFile);
test('Tabla curl contra Express real y colecciones simuladas', async (t) => {
 t.mock.method(console,'log',()=>{});
 t.mock.timers.enable({apis:['Date'],now:new Date('2026-11-15T12:00:00-05:00').getTime()});
 const e=await servidorIntegrado(t);
 async function pedir(nombre,metodo,ruta,cuerpo,status) {
  const args=['-sS','--max-time','5','-X',metodo,'-w','\n%{http_code}',`${e.url}/api${ruta}`];
  if(cuerpo!==undefined) args.push('-H','Content-Type: application/json','-d',JSON.stringify(cuerpo));
  const {stdout}=await ejecutar('curl',args);
  const corte=stdout.lastIndexOf('\n');
  const codigo=Number(stdout.slice(corte+1));
  const json=stdout.slice(0,corte)?JSON.parse(stdout.slice(0,corte)):null;
  assert.equal(codigo,status,nombre);
  process.stdout.write(JSON.stringify({caso:nombre,metodo,ruta,status:codigo,progreso:json?.progreso})+'\n');
  return json;
 }
 const ruta=`/videojuegos/${JUEGO}`;
 const vacio=await pedir('Sin partidas','GET',ruta+'/progreso-semanal',undefined,200);
 assert.deepEqual([vacio.progreso.horasSemana,vacio.progreso.diasJugadosSemana,vacio.progreso.rachaActual,vacio.progreso.mejorRacha],[0,0,0,0]);
 await pedir('Crear meta','POST','/metas',datosMeta(),201);
 for(let dia=9;dia<=13;dia++) await pedir('Sesión '+dia,'POST','/partidas',{videojuego:JUEGO,fecha:`2026-11-${String(dia).padStart(2,'0')}T12:00:00-05:00`,duracionMinutos:84,porcentajeAvance:60},201);
 const p=await pedir('Cinco días y racha rota','GET',ruta+'/progreso-semanal',undefined,200);
 assert.deepEqual([p.progreso.horasSemana,p.progreso.diasJugadosSemana,p.progreso.rachaActual,p.progreso.mejorRacha,p.progreso.porcentajeHoras],[7,5,0,5,140]);
 assert.equal(p.progreso.hitos[0].alcanzado,true);
 await pedir('ID inválido','GET','/videojuegos/invalido/progreso-semanal',undefined,400);
 await pedir('Juego inexistente','GET',`/videojuegos/${INEXISTENTE}/progreso-semanal`,undefined,404);
 await pedir('Segunda meta activa','POST','/metas',datosMeta(),409);
 await pedir('Cascada','DELETE',ruta,undefined,204);
 assert.equal(e.coleccion.filas.length,0);assert.equal(e.partidas.filas.length,0);
});
JS
```
