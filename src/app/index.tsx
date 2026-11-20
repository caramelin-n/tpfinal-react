import { StyleSheet, Text, View } from 'react-native';

export default function Inicio() {
  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.titulo}>Biblioteca IPF</Text>
      <Text style={estilos.subtitulo}>
        Etapa 0: proyecto creado con Expo SDK 58.
      </Text>
      <Text style={estilos.detalle}>
        Las pantallas reales se agregan en las etapas siguientes.
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 8,
  },
  titulo: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitulo: {
    fontSize: 16,
    color: '#5B6770',
  },
  detalle: {
    fontSize: 13,
    color: '#888888',
    textAlign: 'center',
  },
});