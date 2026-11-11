import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { actualizarMeta, crearMeta, desactivarMeta, listarMetasVideojuego } from "../api/metasApi";
import type { Meta, ObjetivosMeta } from "../tipos";
import "./FormularioMeta.css";

interface Campos {
  horas: string;
  dias: string;
  hitos: { descripcion: string; objetivo: string }[];
}

function camposDe(meta: Meta | null): Campos {
  return {
    horas: meta ? String(meta.horasSemanales) : "",
    dias: meta ? String(meta.diasPorSemana) : "",
    hitos: meta?.hitos.map((h) => ({ descripcion: h.descripcion, objetivo: String(h.porcentajeObjetivo) })) ?? [],
  };
}

function validar(campos: Campos): ObjetivosMeta {
  const horasSemanales = Number(campos.horas);
  const diasPorSemana = Number(campos.dias);
  if (!Number.isFinite(horasSemanales) || horasSemanales <= 0 || horasSemanales > 100)
    throw new Error("Las horas deben ser mayores que 0 y como máximo 100.");
  if (!Number.isInteger(diasPorSemana) || diasPorSemana < 1 || diasPorSemana > 7)
    throw new Error("Los días deben ser un número entero entre 1 y 7.");
  if (campos.hitos.length > 5) throw new Error("Puedes agregar hasta cinco hitos.");
  const hitos = campos.hitos.map((h) => {
    const porcentajeObjetivo = Number(h.objetivo);
    if (!h.descripcion.trim()) throw new Error("Cada hito necesita una descripción.");
    if (!Number.isFinite(porcentajeObjetivo) || porcentajeObjetivo < 1 || porcentajeObjetivo > 100)
      throw new Error("El objetivo de cada hito debe estar entre 1 y 100 %.");
    return { descripcion: h.descripcion.trim(), porcentajeObjetivo };
  });
  return { horasSemanales, diasPorSemana, hitos };
}

export function FormularioMeta({ videojuegoId, onActualizada }: {
  videojuegoId: string;
  onActualizada?: () => Promise<void>;
}) {
  const [meta, setMeta] = useState<Meta | null>(null);
  const [campos, setCampos] = useState<Campos>(() => camposDe(null));
  const [cargando, setCargando] = useState(true);
  const [bloqueada, setBloqueada] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [esError, setEsError] = useState(false);
  const vivo = useRef(false);
  const enCurso = useRef(false);
  const titulo = useRef<HTMLHeadingElement>(null);
  const aviso = useRef<HTMLParagraphElement>(null);
  const agregar = useRef<HTMLButtonElement>(null);
  const enfocarTitulo = useRef(false);

  useEffect(() => {
    let activo = true;
    vivo.current = true;
    async function cargar() {
      try {
        const metas = await listarMetasVideojuego(videojuegoId);
        if (!activo) return;
        const actual = metas.find((m) => m.activa) ?? null;
        setMeta(actual); setCampos(camposDe(actual));
      } catch (error) {
        if (!activo) return;
        setBloqueada(true); setEsError(true);
        setMensaje(error instanceof Error ? error.message : "No pudimos cargar la meta.");
      } finally {
        if (activo) setCargando(false);
      }
    }
    void cargar();
    return () => { activo = false; vivo.current = false; };
  }, [videojuegoId]);

  useEffect(() => {
    if (mensaje) {
      if (enfocarTitulo.current) titulo.current?.focus();
      else aviso.current?.focus();
      enfocarTitulo.current = false;
    }
  }, [mensaje]);

  async function refrescar() {
    const [metas] = await Promise.all([listarMetasVideojuego(videojuegoId), onActualizada?.()]);
    if (!vivo.current) return;
    const actual = metas.find((m) => m.activa) ?? null;
    setMeta(actual); setCampos(camposDe(actual)); setBloqueada(false);
  }

  async function operar(desactivar: boolean, objetivos?: ObjetivosMeta) {
    if (enCurso.current) return;
    enCurso.current = true; setGuardando(true); setMensaje(""); setEsError(false);
    try {
      const resultado = desactivar && meta ? await desactivarMeta(meta._id)
        : meta ? await actualizarMeta(meta._id, objetivos!)
          : await crearMeta({ ...objetivos!, videojuego: videojuegoId });
      if (!vivo.current) return;
      setMeta(resultado.activa ? resultado : null);
      setCampos(camposDe(resultado.activa ? resultado : null));
      try {
        await refrescar();
        if (!vivo.current) return;
        enfocarTitulo.current = desactivar;
        setMensaje(desactivar ? "Meta desactivada. Puedes crear una nueva; la anterior se conserva." : "Meta guardada.");
      } catch {
        if (!vivo.current) return;
        setBloqueada(true); setEsError(true);
        setMensaje(desactivar
          ? "La meta se desactivó, pero no pudimos actualizar la vista. Reintenta la consulta."
          : "La meta se guardó, pero no pudimos actualizar la vista. Reintenta la consulta.");
      }
    } catch (error) {
      if (vivo.current) {
        setEsError(true);
        setMensaje(error instanceof Error ? error.message : "No pudimos guardar la meta.");
      }
    } finally {
      enCurso.current = false;
      if (vivo.current) setGuardando(false);
    }
  }

  function guardar(evento: FormEvent) {
    evento.preventDefault();
    if (enCurso.current || bloqueada) return;
    try { void operar(false, validar(campos)); }
    catch (error) { setEsError(true); setMensaje((error as Error).message); }
  }

  async function reintentar() {
    if (enCurso.current) return;
    enCurso.current = true; setCargando(true); setMensaje("");
    try { await refrescar(); if (vivo.current) { setEsError(false); setMensaje("Datos actualizados."); } }
    catch { if (vivo.current) { setEsError(true); setMensaje("No pudimos actualizar la vista. Inténtalo nuevamente."); } }
    finally { enCurso.current = false; if (vivo.current) setCargando(false); }
  }

  function cambiarHito(indice: number, campo: "descripcion" | "objetivo", valor: string) {
    setCampos((actual) => ({ ...actual, hitos: actual.hitos.map((h, i) => i === indice ? { ...h, [campo]: valor } : h) }));
  }

  return <section className="detalle-seccion meta-seccion" aria-labelledby="meta-titulo">
    <h2 id="meta-titulo" ref={titulo} tabIndex={-1}>{meta ? "TU META SEMANAL" : "CREA TU META SEMANAL"}</h2>
    {cargando && <p role="status">Cargando tu meta...</p>}
    {!cargando && bloqueada && <>
      <p id="meta-mensaje" ref={aviso} tabIndex={-1} role="alert">{mensaje}</p>
      <button type="button" onClick={() => void reintentar()}>Reintentar metas</button>
    </>}
    {!cargando && !bloqueada && <form className="meta-formulario" aria-label="Meta semanal" noValidate onSubmit={guardar} aria-busy={guardando}>
      {!meta && <p>Sin meta activa. Crea una para comparar tu actividad semanal.</p>}
      <p>Objetivos para toda la semana, de lunes a domingo en hora de Ecuador. Para cumplirla necesitas alcanzar horas y días.</p>
      <fieldset disabled={guardando}>
        <legend>Objetivos semanales</legend>
        <div className="meta-objetivos">
          <div><label htmlFor="meta-horas">Horas por semana (mayor que 0, máximo 100)</label>
            <input id="meta-horas" type="number" min="0" max="100" step="any" required value={campos.horas} onChange={(e) => setCampos({ ...campos, horas: e.target.value })} /></div>
          <div><label htmlFor="meta-dias">Días por semana (entero de 1 a 7)</label>
            <input id="meta-dias" type="number" min="1" max="7" step="1" required value={campos.dias} onChange={(e) => setCampos({ ...campos, dias: e.target.value })} /></div>
        </div>
        <h3>Hitos de avance (opcionales, máximo 5)</h3>
        {campos.hitos.map((h, indice) => <fieldset className="meta-hito" key={indice}>
          <legend>Hito {indice + 1}</legend>
          <label htmlFor={`meta-descripcion-${indice}`}>Descripción del hito {indice + 1}</label>
          <input id={`meta-descripcion-${indice}`} required value={h.descripcion} onChange={(e) => cambiarHito(indice, "descripcion", e.target.value)} />
          <label htmlFor={`meta-objetivo-${indice}`}>Avance objetivo (1 a 100 %)</label>
          <input id={`meta-objetivo-${indice}`} type="number" min="1" max="100" step="any" required value={h.objetivo} onChange={(e) => cambiarHito(indice, "objetivo", e.target.value)} />
          <button type="button" onClick={() => { setCampos({ ...campos, hitos: campos.hitos.filter((_, i) => i !== indice) }); agregar.current?.focus(); }}>Quitar hito {indice + 1}</button>
        </fieldset>)}
        <div className="meta-acciones">
          <button type="button" ref={agregar} disabled={campos.hitos.length >= 5} onClick={() => setCampos({ ...campos, hitos: [...campos.hitos, { descripcion: "", objetivo: "" }] })}>Agregar hito</button>
          <button type="submit">{guardando ? "Guardando..." : meta ? "Guardar cambios" : "Guardar meta"}</button>
          {meta && <button type="button" onClick={() => { if (!enCurso.current && window.confirm("¿Desactivar esta meta? Sus objetivos e hitos se conservarán.")) void operar(true); }}>Desactivar meta</button>}
        </div>
      </fieldset>
      {guardando && <p role="status">Guardando...</p>}
      {mensaje && <p id="meta-mensaje" ref={aviso} tabIndex={-1} role={esError ? "alert" : "status"}>{mensaje}</p>}
    </form>}
  </section>;
}
