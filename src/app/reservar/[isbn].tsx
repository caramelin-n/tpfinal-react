import { useLocalSearchParams } from 'expo-router';

import { PantallaEnConstruccion } from '@/components/PantallaEnConstruccion';

export default function Reservar() {
  const { isbn } = useLocalSearchParams<{ isbn?: string | string[] }>();
  const isbnNormalizado = Array.isArray(isbn) ? isbn[0] : isbn;

  return (
    <PantallaEnConstruccion
      titulo="Confirmar reserva"
      detalle={`ISBN: ${isbnNormalizado ?? 'sin dato'}. La reserva se implementa en la Etapa 6.`}
    />
  );
}