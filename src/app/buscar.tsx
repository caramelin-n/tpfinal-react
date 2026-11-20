import { useLocalSearchParams } from 'expo-router';

import { PantallaEnConstruccion } from '@/components/PantallaEnConstruccion';

export default function Buscar() {
  const { q } = useLocalSearchParams<{ q?: string | string[] }>();
  const consulta = Array.isArray(q) ? q[0] : q;

  return (
    <PantallaEnConstruccion
      titulo="Buscar"
      detalle={
        consulta
          ? `Búsqueda actual: «${consulta}». El buscador se implementa en la Etapa 5.`
          : 'El buscador se implementa en la Etapa 5.'
      }
    />
  );
}