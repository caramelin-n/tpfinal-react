import { useCallback, useEffect, useState } from 'react';

import { obtenerLibros } from '@/lib/api';
import type { Libro } from '@/types';

const MENSAJE_ERROR =
  'Revisá tu conexión e intentá de nuevo en unos segundos.';

export function useLibros() {
  const [libros, setLibros] = useState<Libro[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let cancelado = false;

    const cargar = async () => {
      try {
        const datos = await obtenerLibros();
        if (!cancelado) {
          setLibros(datos);
        }
      } catch {
        if (!cancelado) {
          setLibros([]);
          setError(MENSAJE_ERROR);
        }
      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    };

    void cargar();

    return () => {
      cancelado = true;
    };
  }, [intento]);

  const reintentar = useCallback(() => {
    setError(null);
    setCargando(true);
    setIntento((anterior) => anterior + 1);
  }, []);

  return { libros, cargando, error, reintentar };
}