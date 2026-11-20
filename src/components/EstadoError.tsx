import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { Boton } from '@/components/Boton';
import { colores, espaciados, tamanios } from '@/constants/tema';

type Props = {
  mensaje: string;
  onReintentar: () => void;
  titulo?: string;
};

export function EstadoError({
  mensaje,
  onReintentar,
  titulo = 'No pudimos cargar los datos',
}: Props) {
  return (
    <View style={estilos.contenedor}>
      <Ionicons
        name="cloud-offline-outline"
        size={tamanios.iconoGrande}
        color={colores.error}
      />
      <Text style={estilos.titulo}>{titulo}</Text>
      <Text style={estilos.mensaje}>{mensaje}</Text>
      <Boton titulo="Reintentar" onPress={onReintentar} />
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
  titulo: {
    fontSize: tamanios.subtitulo,
    fontWeight: '600',
    color: colores.texto,
    textAlign: 'center',
  },
  mensaje: {
    fontSize: tamanios.cuerpo,
    color: colores.textoSuave,
    textAlign: 'center',
  },
});