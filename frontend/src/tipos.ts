
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
}

export interface NuevoLogro {
  _id?: string;
  nombre: string;
  obtenido: boolean;
}

export interface NuevoVideojuego {
  titulo: string;
  genero: string;
  plataforma: string;
  estado: string;
  calificacion?: number;
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
