
export interface Logro {
  _id: string;
  nombre: string;
  obtenido: boolean;
}

export interface Videojuego {
  _id: string;
  titulo: string;
  genero: string;
  plataforma: string;
  estado: string;
  calificacion?: number;
  logros: Logro[];
  createdAt: string;
  updatedAt: string;
  imagen?: string | null;
}

export interface NuevoLogro {
  _id?: string;
  nombre: string;
  obtenido: boolean;
}

export interface NuevoVideojuego {
  titulo: string;
  imagen?: string | null;
  genero: string;
  plataforma: string;
  estado: string;
  calificacion?: number | null;
  logros: NuevoLogro[];
}

export interface Partida {
  _id: string;
  videojuego: string | Videojuego;
  fecha: string;
  duracionMinutos: number;
  porcentajeAvance: number;
  createdAt: string;
  updatedAt: string;
}

export interface NuevaPartida {
  videojuego: string;
  fecha: string;
  duracionMinutos: number;
  porcentajeAvance: number;
}

export interface ResumenVideojuego {
  totalPartidas: number;
  horasTotales: number;
  ultimaSesion: string | null;
  porcentajeAvance: number;
}
export interface JuegoCatalogo {
  id: number;
  nombre: string;
  imagen: string | null;
  lanzamiento: string | null;
}

export interface HitoMeta {
  descripcion: string;
  porcentajeObjetivo: number;
}

export interface ObjetivosMeta {
  horasSemanales: number;
  diasPorSemana: number;
  hitos: HitoMeta[];
}

export interface NuevaMeta extends ObjetivosMeta {
  videojuego: string;
}

export interface Meta extends NuevaMeta {
  _id: string;
  activa: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProgresoSemanal {
  semana: { inicio: string; fin: string };
  meta: Pick<ObjetivosMeta, "horasSemanales" | "diasPorSemana"> | null;
  horasSemana: number;
  porcentajeHoras: number | null;
  diasJugadosSemana: number;
  rachaActual: number;
  mejorRacha: number;
  hitos: (HitoMeta & { alcanzado: boolean })[];
}
