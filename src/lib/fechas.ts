import { DIAS_PRESTAMO } from '@/constants/biblioteca';

export function sumarDias(fecha: Date, dias: number): Date {
  const resultado = new Date(fecha);
  resultado.setDate(resultado.getDate() + dias);
  return resultado;
}

// Devuelve la fecha de devolución en ISO para guardarla en el préstamo.
export function calcularVencimiento(dias: number = DIAS_PRESTAMO): string {
  return sumarDias(new Date(), dias).toISOString();
}

// Formato dd/mm/aaaa para mostrar en pantalla.
export function formatearFecha(iso: string): string {
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso));
}