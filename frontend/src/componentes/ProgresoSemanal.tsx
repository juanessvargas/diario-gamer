import type { ProgresoSemanal as DatosProgreso } from "../tipos";
import "./ProgresoSemanal.css";

export function ProgresoSemanal({ datos, cargando, error, sinPartidas, onReintentar }: {
  datos: DatosProgreso | null;
  cargando: boolean;
  error: string;
  sinPartidas: boolean;
  onReintentar: () => void;
}) {
  const barra = Math.min(100, Math.max(0, datos?.porcentajeHoras ?? 0));

  return <section id="progreso-semanal" className="detalle-seccion progreso-semanal" aria-labelledby="progreso-titulo" aria-busy={cargando}>
    <h2 id="progreso-titulo">TU PROGRESO SEMANAL</h2>
    {cargando ? <p role="status">Cargando progreso semanal...</p>
      : error ? <>
        <p role="alert">{error}</p>
        <button type="button" onClick={onReintentar}>Reintentar progreso</button>
      </>
        : datos && <div data-actividad>
          <p>Semana del <time dateTime={datos.semana.inicio}>{datos.semana.inicio}</time> al <time dateTime={datos.semana.fin}>{datos.semana.fin}</time> · Hora de Ecuador</p>
          {sinPartidas && <p>Sin partidas registradas. Registra tu primera sesión para empezar.</p>}
          <div className="progreso-cifras">
            <div><h3>Horas esta semana</h3><strong>{datos.horasSemana.toFixed(1)} h{datos.meta && ` de ${datos.meta.horasSemanales} h`}</strong></div>
            <div><h3>Días jugados</h3><strong>{datos.diasJugadosSemana}{datos.meta && ` de ${datos.meta.diasPorSemana}`} días</strong></div>
            <div><h3>Constancia</h3><p>Racha actual: <strong>{datos.rachaActual}</strong> días</p><p>Mejor racha: <strong>{datos.mejorRacha}</strong> días</p></div>
          </div>
          {datos.meta ? <>
            <p className="progreso-porcentaje">{datos.porcentajeHoras} % de las horas objetivo</p>
            <div className="progreso-barra" role="progressbar" aria-label="Horas de la meta semanal" aria-valuemin={0} aria-valuemax={100} aria-valuenow={barra}
              aria-valuetext={`${datos.porcentajeHoras} %: ${datos.horasSemana.toFixed(1)} h de ${datos.meta.horasSemanales} h`}>
              <span style={{ width: `${barra}%` }} />
            </div>
            <p>Para cumplir tu meta, alcanza las horas y días objetivo.</p>
            <h3>Hitos de avance</h3>
            {datos.hitos.length === 0 ? <p>Esta meta no tiene hitos.</p> : <ul className="progreso-hitos">
              {datos.hitos.map((hito, indice) => <li key={indice} data-hito className={hito.alcanzado ? "progreso-hito-alcanzado" : ""}>
                <strong>{hito.descripcion}</strong><span>Objetivo: {hito.porcentajeObjetivo} % · {hito.alcanzado ? "✓ Alcanzado" : "Pendiente"}</span>
              </li>)}
            </ul>}
          </> : <p>Sin meta activa. Crea una en el formulario de abajo para comparar tu actividad con tus objetivos.</p>}
        </div>}
  </section>;
}
