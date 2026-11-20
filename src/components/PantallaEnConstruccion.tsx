import { StyleSheet, Text, View } from 'react-native';

import { colores, espaciados, tamanios } from '@/constants/tema';

type Props = {
  titulo: string;
  detalle: string;
};

// Pantalla temporal de la Etapa 2: se reemplaza en las etapas siguientes.
export function PantallaEnConstruccion({ titulo, detalle }: Props) {
  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.titulo}>{titulo}</Text>
      <Text style={estilos.detalle}>{detalle}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: espaciados.lg,
    gap: espaciados.sm,
    backgroundColor: colores.fondo,
  },
  titulo: {
    fontSize: tamanios.titulo,
    fontWeight: '700',
    color: colores.texto,
    textAlign: 'center',
  },
  detalle: {
    fontSize: tamanios.cuerpo,
    color: colores.textoSuave,
    textAlign: 'center',
  },
});