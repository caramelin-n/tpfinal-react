import { LIBROS } from '@/data/libros';
import type { Libro } from '@/types';

const FORMATO_ISBN = /^\d{13}$/;

export function esIsbnValido(isbn: string): boolean {
  return FORMATO_ISBN.test(isbn);
}

export function buscarLibro(isbn: string): Libro | undefined {
  return LIBROS.find((libro) => libro.isbn === isbn);
}