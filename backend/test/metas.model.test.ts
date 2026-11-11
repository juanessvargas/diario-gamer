import assert from "node:assert/strict";
import test from "node:test";
import { cargarMeta, datosMeta, impedirConexion, JUEGO } from "./soporte-metas";

// E2-T03: validación Mongoose en memoria. Nunca save() ni conexión real.
test("CA-01.1: modelo válido, referencia y activa predeterminada", (t) => {
  impedirConexion(t);
  const Meta = cargarMeta(); const meta = new Meta(datosMeta());
  assert.equal(meta.validateSync(), undefined);
  assert.equal(String(meta.videojuego), JUEGO);
  assert.equal(meta.activa, true);
  assert.equal(Meta.schema.path("videojuego").options.ref, "Videojuego");
  assert.equal(Meta.schema.options.timestamps, true);
});

for (const horas of [undefined, null, -1, 0, 100.01, NaN, Infinity, -Infinity]) {
  test(`CA-01.2: modelo rechaza horas ${String(horas)}`, (t) => {
    impedirConexion(t); const Meta = cargarMeta();
    const error = new Meta(datosMeta({ horasSemanales: horas })).validateSync();
    assert.ok(error?.errors.horasSemanales);
  });
}
for (const horas of [0.01, 0.5, 100]) {
  test(`CA-01.2: modelo acepta horas frontera/fraccionarias ${horas}`, (t) => {
    impedirConexion(t); const Meta = cargarMeta();
    assert.equal(new Meta(datosMeta({ horasSemanales: horas })).validateSync(), undefined);
  });
}
for (const dias of [undefined, null, -1, 0, 1.5, 7.1, 8, NaN, Infinity]) {
  test(`CA-01.3: modelo rechaza días ${String(dias)}`, (t) => {
    impedirConexion(t); const Meta = cargarMeta();
    assert.ok(new Meta(datosMeta({ diasPorSemana: dias })).validateSync()?.errors.diasPorSemana);
  });
}
for (const dias of [1, 7]) {
  test(`CA-01.3: modelo acepta límite ${dias} días`, (t) => {
    impedirConexion(t); const Meta = cargarMeta();
    assert.equal(new Meta(datosMeta({ diasPorSemana: dias })).validateSync(), undefined);
  });
}
for (const cantidad of [0, 5]) {
  test(`CA-01.4: modelo acepta ${cantidad} hitos`, (t) => {
    impedirConexion(t); const Meta = cargarMeta();
    const hitos = Array.from({ length: cantidad }, (_, i) => ({ descripcion: `Hito ${i}`, porcentajeObjetivo: 1 + i }));
    assert.equal(new Meta(datosMeta({ hitos })).validateSync(), undefined);
  });
}
test("CA-01.4: omitir hitos produce una lista vacía", (t) => {
  impedirConexion(t); const Meta = cargarMeta(); const datos = datosMeta(); delete datos.hitos;
  const meta = new Meta(datos); assert.equal(meta.validateSync(), undefined); assert.equal(meta.hitos.length, 0);
});
test("CA-01.4: modelo rechaza seis hitos", (t) => {
  impedirConexion(t); const Meta = cargarMeta();
  const hitos = Array.from({ length: 6 }, () => ({ descripcion: "Hito", porcentajeObjetivo: 50 }));
  assert.ok(new Meta(datosMeta({ hitos })).validateSync());
});
for (const descripcion of [undefined, null, ""]) {
  test(`CA-01.4: descripción obligatoria ${String(descripcion)}`, (t) => {
    impedirConexion(t); const Meta = cargarMeta();
    assert.ok(new Meta(datosMeta({ hitos: [{ descripcion, porcentajeObjetivo: 50 }] })).validateSync());
  });
}
for (const porcentaje of [undefined, null, 0, -1, 100.01, NaN, Infinity]) {
  test(`CA-01.4: modelo rechaza objetivo ${String(porcentaje)}`, (t) => {
    impedirConexion(t); const Meta = cargarMeta();
    assert.ok(new Meta(datosMeta({ hitos: [{ descripcion: "Hito", porcentajeObjetivo: porcentaje }] })).validateSync());
  });
}
for (const porcentaje of [1, 50.5, 100]) {
  test(`CA-01.4: modelo acepta objetivo ${porcentaje}`, (t) => {
    impedirConexion(t); const Meta = cargarMeta();
    assert.equal(new Meta(datosMeta({ hitos: [{ descripcion: "Hito", porcentajeObjetivo: porcentaje }] })).validateSync(), undefined);
  });
}
test("B-01: videojuego es obligatorio", (t) => {
  impedirConexion(t); const Meta = cargarMeta(); const datos = datosMeta(); delete datos.videojuego;
  assert.ok(new Meta(datos).validateSync()?.errors.videojuego);
});
test("CA-01.5: declara índice único solo para metas activas (no prueba su ejecución)", (t) => {
  impedirConexion(t); const Meta = cargarMeta();
  assert.ok(Meta.schema.indexes().some(([campos, opciones]) =>
    campos.videojuego === 1 && Object.keys(campos).length === 1 && opciones.unique === true
      && opciones.partialFilterExpression?.activa === true));
});
