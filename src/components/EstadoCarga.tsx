import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colores, espaciados, tamanios } from '@/constants/tema';

type Props = {
  mensaje?: string;
};

export function EstadoCarga({
  mensaje = 'Cargando…',
}: Props) {
  return (
    <View
      accessible
      accessibilityLabel={mensaje}
      style={estilos.contenedor}
    >
      <ActivityIndicator size="large" color={colores.primario} />
      <Text style={estilos.texto}>{mensaje}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: espaciados.lg,
    gap: espaciados.md,
    backgroundColor: colores.fondo,
  },
  texto: {
    fontSize: tamanios.cuerpo,
    color: colores.textoSuave,
    textAlign: 'center',
  },
});