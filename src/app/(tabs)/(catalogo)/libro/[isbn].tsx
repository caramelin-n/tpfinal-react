import { useLocalSearchParams } from 'expo-router';

import { PantallaEnConstruccion } from '@/components/PantallaEnConstruccion';

export default function DetalleLibro() {
  const { isbn } = useLocalSearchParams<{ isbn?: string | string[] }>();
  const isbnNormalizado = Array.isArray(isbn) ? isbn[0] : isbn;

  return (
    <PantallaEnConstruccion
      titulo="Detalle del libro"
      detalle={`ISBN recibido: ${isbnNormalizado ?? 'sin dato'}. Se implementa en la Etapa 4.`}
    />
  );
}