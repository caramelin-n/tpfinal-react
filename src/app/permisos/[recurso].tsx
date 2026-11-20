import { useLocalSearchParams } from 'expo-router';

import { PantallaEnConstruccion } from '@/components/PantallaEnConstruccion';
import { NOMBRES_RECURSO, esRecurso } from '@/constants/permisos';

export default function Permiso() {
  const { recurso } = useLocalSearchParams<{
    recurso?: string | string[];
  }>();
  const valor = Array.isArray(recurso) ? recurso[0] : recurso;
  const titulo =
    valor !== undefined && esRecurso(valor)
      ? `Permiso de ${NOMBRES_RECURSO[valor].toLowerCase()}`
      : 'Permiso desconocido';

  return (
    <PantallaEnConstruccion
      titulo={titulo}
      detalle="La pantalla previa de permisos se implementa en la Etapa 7."
    />
  );
}