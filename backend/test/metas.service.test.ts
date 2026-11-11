import assert from "node:assert/strict";
import test from "node:test";
import { Types } from "mongoose";
import { Videojuego } from "../src/modelos/Videojuego.model";
import {
  cargarServicio, comprobarEstado, copiar, datosMeta, doblarColeccion, errorDuplicado, impedirConexion,
  INEXISTENTE, JUEGO, META, OTRA_META, OTRO_JUEGO, preparar, registroMeta,
} from "./soporte-metas";

// E2-T03: servicios reales, colecciones sustituidas. No Atlas ni MongoDB local.
// La unicidad NO está implementada por el doble; solo se simula un E11000.
test("Infraestructura de colecciones: Mongoose lee y escribe solo en el doble", async (t) => {
  impedirConexion(t);
  const { filas } = doblarColeccion(t, Videojuego, []);
  const juego = await new Videojuego({ titulo: "Ficticio", genero: "rol", plataforma: "PC" }).save();
  assert.equal(filas.length, 1);
  assert.equal((await Videojuego.findById(juego._id))?.titulo, "Ficticio");
  const actualizado = await Videojuego.findByIdAndUpdate(juego._id, { $set: { titulo: "Actualizado" } }, { new: true });
  assert.equal(actualizado?.titulo, "Actualizado");
  assert.equal((await Videojuego.find({}).sort({ createdAt: -1 })).length, 1);
  assert.equal(await Videojuego.countDocuments({}), 1);
});

test("CA-01.1: crear guarda referencia, objetivos e información temporal", async (t) => {
  const { coleccion } = preparar(t); const servicio = cargarServicio();
  const meta = await servicio.crearMeta(datosMeta());
  assert.equal(String(meta.videojuego), JUEGO); assert.equal(meta.activa, true);
  assert.equal(meta.horasSemanales, 5); assert.equal(meta.diasPorSemana, 4);
  assert.ok(meta.createdAt); assert.ok(meta.updatedAt);
  assert.equal(coleccion.filas.length, 1);
});
for (const estado of ["completado", "abandonado"]) {
  test(`CA-01.6: crear permite juego ${estado}`, async (t) => {
    const { juegos } = preparar(t); juegos.filas[0].estado = estado;
    const meta = await cargarServicio().crearMeta(datosMeta()); assert.equal(meta.activa, true);
  });
}
test("CA-01.5: segunda meta activa devuelve 409 sin insertar", async (t) => {
  const { coleccion } = preparar(t, [registroMeta()]); const antes = copiar(coleccion.filas);
  await assert.rejects(() => cargarServicio().crearMeta(datosMeta()), comprobarEstado(409));
  assert.deepEqual(coleccion.filas, antes); assert.equal(coleccion.escrituras.length, 0);
});
test("CA-01.5: dos solicitudes simultáneas traducen conflicto simulado a 409", async (t) => {
  const { Meta, coleccion } = preparar(t); const servicio = cargarServicio();
  // Ambos chequeos previos ven ausencia. El segundo insert simula al índice.
  t.mock.method(Meta.collection, "findOne", async () => null);
  let inserciones = 0;
  t.mock.method(Meta.collection, "insertOne", async (doc: any) => {
    inserciones += 1;
    if (inserciones > 1) throw errorDuplicado();
    coleccion.filas.push(copiar(doc));
    return { acknowledged: true, insertedId: doc._id };
  });
  const resultados = await Promise.allSettled([servicio.crearMeta(datosMeta()), servicio.crearMeta(datosMeta())]);
  assert.equal(inserciones, 2);
  assert.equal(resultados.filter((r) => r.status === "fulfilled").length, 1);
  const rechazo = resultados.find((r) => r.status === "rejected");
  assert.ok(rechazo && rechazo.status === "rejected"); comprobarEstado(409)(rechazo.reason);
  assert.equal(coleccion.filas.length, 1);
});
for (const activa of [true, false]) {
  test(`CA-02.1: consultar meta existente activa=${activa}`, async (t) => {
    preparar(t, [registroMeta({ activa })]); const meta = await cargarServicio().obtenerMeta(META);
    assert.equal(String(meta._id), META); assert.equal(meta.activa, activa);
    assert.equal(String(meta.videojuego), JUEGO); assert.equal(meta.hitos[0].porcentajeObjetivo, 50);
  });
}
test("CA-02.2: lista propias activas e inactivas, excluye ajenas", async (t) => {
  preparar(t, [registroMeta(), registroMeta({ _id: new Types.ObjectId(OTRA_META), activa: false }),
    registroMeta({ _id: new Types.ObjectId(INEXISTENTE), videojuego: new Types.ObjectId(OTRO_JUEGO) })]);
  const metas = await cargarServicio().listarMetasPorVideojuego(JUEGO);
  assert.deepEqual(metas.map((m) => String(m._id)).sort(), [META, OTRA_META].sort());
  assert.ok(metas.every((m) => String(m.videojuego) === JUEGO));
});
test("CA-02.3: juego existente sin metas devuelve lista vacía", async (t) => {
  preparar(t); assert.deepEqual(await cargarServicio().listarMetasPorVideojuego(JUEGO), []);
});
test("CA-03.1: editar no crea meta ni cambia datos ajenos o createdAt", async (t) => {
  const { coleccion } = preparar(t, [registroMeta(), registroMeta({ _id: new Types.ObjectId(OTRA_META), videojuego: new Types.ObjectId(OTRO_JUEGO) })]);
  const antes = copiar(coleccion.filas); const { videojuego: _, ...datos } = datosMeta({ horasSemanales: 8, diasPorSemana: 2, hitos: [] });
  const meta = await cargarServicio().actualizarMeta(META, datos);
  assert.equal(String(meta._id), META); assert.equal(meta.horasSemanales, 8); assert.equal(meta.diasPorSemana, 2);
  assert.equal(meta.hitos.length, 0); assert.equal(String(meta.videojuego), JUEGO);
  assert.equal(new Date(meta.createdAt).getTime(), antes[0].createdAt.getTime());
  assert.equal(coleccion.filas.length, 2); assert.deepEqual(coleccion.filas[1], antes[1]);
  assert.ok(!coleccion.escrituras.includes("insertOne"));
});
for (const cambio of [{ horasSemanales: 0 }, { diasPorSemana: 1.5 }, { hitos: [{ descripcion: "", porcentajeObjetivo: 101 }] }]) {
  test(`CA-03.3: edición inválida conserva información ${JSON.stringify(cambio)}`, async (t) => {
    const { coleccion } = preparar(t, [registroMeta()]); const antes = copiar(coleccion.filas);
    const { videojuego: _, ...datos } = datosMeta(cambio);
    await assert.rejects(() => cargarServicio().actualizarMeta(META, datos), comprobarEstado(400));
    assert.deepEqual(coleccion.filas, antes); assert.equal(coleccion.escrituras.length, 0);
  });
}
test("CA-04.3: desactivar conserva información y repetir es idempotente", async (t) => {
  const { coleccion } = preparar(t, [registroMeta()]); const servicio = cargarServicio();
  const antes = copiar(coleccion.filas[0]);
  for (let i = 0; i < 2; i += 1) {
    const meta = await servicio.desactivarMeta(META);
    assert.equal(meta.activa, false); assert.equal(String(meta._id), META);
    assert.equal(meta.horasSemanales, antes.horasSemanales); assert.equal(meta.diasPorSemana, antes.diasPorSemana);
    assert.equal(meta.hitos[0].descripcion, antes.hitos[0].descripcion);
  }
  assert.equal(coleccion.filas.length, 1); assert.equal(coleccion.filas[0].activa, false);
});
test("CA-04.4: nueva meta después de desactivar conserva la anterior", async (t) => {
  const { coleccion } = preparar(t, [registroMeta()]); const servicio = cargarServicio();
  await servicio.desactivarMeta(META); const nueva = await servicio.crearMeta(datosMeta({ horasSemanales: 8 }));
  assert.notEqual(String(nueva._id), META); assert.equal(nueva.activa, true);
  assert.equal(coleccion.filas.length, 2);
  assert.equal(coleccion.filas.find((m) => String(m._id) === META)?.activa, false);
  assert.equal(coleccion.filas.filter((m) => m.activa).length, 1);
});
for (const accion of ["crear", "listar"] as const) {
  test(`404: ${accion} sobre juego inexistente no escribe`, async (t) => {
    const { coleccion } = preparar(t); const servicio = cargarServicio();
    await assert.rejects(() => accion === "crear"
      ? servicio.crearMeta(datosMeta({ videojuego: INEXISTENTE }))
      : servicio.listarMetasPorVideojuego(INEXISTENTE), comprobarEstado(404));
    assert.equal(coleccion.escrituras.length, 0);
  });
}
for (const accion of ["obtener", "editar", "desactivar"] as const) {
  test(`404: ${accion} meta inexistente no escribe`, async (t) => {
    const { coleccion } = preparar(t); const servicio = cargarServicio();
    await assert.rejects(() => accion === "obtener" ? servicio.obtenerMeta(INEXISTENTE)
      : accion === "desactivar" ? servicio.desactivarMeta(INEXISTENTE)
      : servicio.actualizarMeta(INEXISTENTE, datosMeta()), comprobarEstado(404));
    assert.equal(coleccion.escrituras.length, 0);
  });
}

test.todo("INTEGRACIÓN REAL CA-01.5: dos creaciones contra índice MongoDB, una 201 y otra 409; requiere base de pruebas autorizada");
test.todo("INTEGRACIÓN REAL CA-03.1/CA-03.3/CA-04.3/CA-04.4: consultar persistencia de edición, rechazo, desactivación e historial; requiere base autorizada");
