// Tipos propios de la app (el tipo `Libro` viene del archivo entregado).
export type Prestamo = {
  isbn: string;
  vence: string; // ISO
  recordarme: boolean;
  notificacionId: string | null;
};

export type Aviso = {
  id: string;
  isbn: string;
  titulo: string;
  mensaje: string;
};

export type Recurso = 'camara' | 'notificaciones';

export type ResultadoReserva =
  | { tipo: 'prestamo' }
  | { tipo: 'espera'; posicion: number }
  | { tipo: 'ya' };