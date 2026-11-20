import { useContext } from 'react';

import {
  ContextoBiblioteca,
  type ValorBiblioteca,
} from '@/context/BibliotecaContext';

export function useBiblioteca(): ValorBiblioteca {
  const valor = useContext(ContextoBiblioteca);
  if (!valor) {
    throw new Error('useBiblioteca debe usarse dentro de BibliotecaProvider');
  }
  return valor;
}