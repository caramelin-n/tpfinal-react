import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

// Ejecuta `revisar` cuando la app vuelve a primer plano después de haber
// estado en segundo plano o inactiva (por ejemplo, al volver de Ajustes).
export function useRevisarAlVolver(revisar: () => void) {
  const anterior = useRef(AppState.currentState);

  useEffect(() => {
    const suscripcion = AppState.addEventListener('change', (nuevo) => {
      const estabaAfuera =
        anterior.current === 'background' ||
        anterior.current === 'inactive';
      if (estabaAfuera && nuevo === 'active') {
        revisar();
      }
      anterior.current = nuevo;
    });

    return () => suscripcion.remove();
  }, [revisar]);
}