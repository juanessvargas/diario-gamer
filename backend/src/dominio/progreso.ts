export interface PartidaDominio {
  readonly videojuego: string;
  readonly fecha: Date;
  readonly duracionMinutos: number;
}

export interface ObjetivosMeta {
  readonly horasSemanales: number;
  readonly diasPorSemana: number;
}

export interface ActividadSemanal {
  horasSemana: number;
  diasJugadosSemana: number;
  porcentajeHoras: number | null;
}

export interface Rachas {
  rachaActual: number;
  mejorRacha: number;
}

export interface Hito {
  readonly descripcion: string;
  readonly porcentajeObjetivo: number;
}

export interface HitoCalculado {
  descripcion: string;
  porcentajeObjetivo: number;
  alcanzado: boolean;
}

const MILISEGUNDOS_DIA = 24 * 60 * 60 * 1000;
const formatoDia = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Guayaquil",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// Representar el día civil de Ecuador en una escala de días de calendario.
// El UTC de esta representación no sustituye el instante original de la sesión.
function numeroDia(fecha: Date): number {
  const partes = formatoDia.formatToParts(fecha);
  const anio = Number(partes.find((parte) => parte.type === "year")?.value);
  const mes = Number(partes.find((parte) => parte.type === "month")?.value);
  const dia = Number(partes.find((parte) => parte.type === "day")?.value);

  return Date.UTC(anio, mes - 1, dia) / MILISEGUNDOS_DIA;
}

function lunesDeSemana(ahora: Date): number {
  const hoy = numeroDia(ahora);
  const diaSemana = new Date(hoy * MILISEGUNDOS_DIA).getUTCDay();
  return hoy - (diaSemana + 6) % 7;
}

function fechaDelDia(dia: number): string {
  return new Date(dia * MILISEGUNDOS_DIA).toISOString().slice(0, 10);
}

function partidasElegibles(
  partidas: readonly PartidaDominio[],
  videojuegoId: string,
  ahora: Date,
): PartidaDominio[] {
  const instanteConsulta = ahora.getTime();
  return partidas.filter((partida) =>
    partida.videojuego === videojuegoId && partida.fecha.getTime() <= instanteConsulta
  );
}

export function calcularSemana(ahora: Date): { inicio: string; fin: string } {
  const lunes = lunesDeSemana(ahora);
  return { inicio: fechaDelDia(lunes), fin: fechaDelDia(lunes + 6) };
}

export function calcularActividadSemanal(
  partidas: readonly PartidaDominio[],
  videojuegoId: string,
  ahora: Date,
  meta: ObjetivosMeta | null,
): ActividadSemanal {
  const lunes = lunesDeSemana(ahora);
  const diasJugados = new Set<number>();
  let minutosSemana = 0;

  for (const partida of partidasElegibles(partidas, videojuegoId, ahora)) {
    const dia = numeroDia(partida.fecha);
    if (dia >= lunes && dia < lunes + 7) {
      minutosSemana += partida.duracionMinutos;
      diasJugados.add(dia);
    }
  }

  const horasSemana = Math.round(minutosSemana / 60 * 10) / 10;
  const porcentajeHoras = meta === null
    ? null
    : Math.round(horasSemana / meta.horasSemanales * 100);

  return { horasSemana, diasJugadosSemana: diasJugados.size, porcentajeHoras };
}

export function calcularRachas(
  partidas: readonly PartidaDominio[],
  videojuegoId: string,
  ahora: Date,
): Rachas {
  const dias = [...new Set(
    partidasElegibles(partidas, videojuegoId, ahora).map((partida) => numeroDia(partida.fecha))
  )].sort((a, b) => a - b);

  let anterior: number | undefined;
  let longitud = 0;
  let mejorRacha = 0;

  for (const dia of dias) {
    longitud = anterior !== undefined && dia === anterior + 1 ? longitud + 1 : 1;
    mejorRacha = Math.max(mejorRacha, longitud);
    anterior = dia;
  }

  const hoy = numeroDia(ahora);
  const rachaViva = anterior === hoy || anterior === hoy - 1;
  return { rachaActual: rachaViva ? longitud : 0, mejorRacha };
}

// Comprobación interna de ambos objetivos; no agrega campos al contrato HTTP.
export function cumpleMetaSemanal(actividad: ActividadSemanal, meta: ObjetivosMeta): boolean {
  return actividad.horasSemana >= meta.horasSemanales
    && actividad.diasJugadosSemana >= meta.diasPorSemana;
}

// El avance se recibe del resumen original de P3, sin filtrar fechas aquí.
export function calcularHitos(
  hitosDeMetaActiva: readonly Hito[] | null,
  porcentajeAvanceActual: number,
): HitoCalculado[] {
  if (hitosDeMetaActiva === null) {
    return [];
  }

  return hitosDeMetaActiva.map((hito) => ({
    descripcion: hito.descripcion,
    porcentajeObjetivo: hito.porcentajeObjetivo,
    alcanzado: porcentajeAvanceActual >= hito.porcentajeObjetivo,
  }));
}
