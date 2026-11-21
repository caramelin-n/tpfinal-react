import type { Recurso } from '@/types/biblioteca';


export const NOMBRES_RECURSO: Record<Recurso, string> = {
  camara: 'Cámara',
  notificaciones: 'Notificaciones',
};

export const BENEFICIOS: Record<Recurso, string> = {
  camara:
    'Usamos tu cámara para leer el código de barras del libro y abrir su ficha.',
  notificaciones:
    'Usamos tus notificaciones para recordarte cuándo tenés que devolver un libro y avisarte cuando llega tu turno.',
};

export function esRecurso(valor: string): valor is Recurso {
  return valor === 'camara' || valor === 'notificaciones';
}