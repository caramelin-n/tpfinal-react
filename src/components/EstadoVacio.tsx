import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { Boton } from '@/components/Boton';
import { colores, espaciados, tamanios } from '@/constants/tema';

type Props = {
  mensaje: string;
  titulo?: string;
  accion?: {
    titulo: string;
    onPress: () => void;
  };
};

export function EstadoVacio({
  mensaje,
  titulo = 'No hay resultados',
  accion,
}: Props) {
  return (
    <View style={estilos.contenedor}>
      <Ionicons
        name="file-tray-outline"
        size={42}
        color={colores.textoSuave}
      />
      <Text style={estilos.titulo}>{titulo}</Text>
      <Text style={estilos.mensaje}>{mensaje}</Text>
      {accion ? (
        <Boton titulo={accion.titulo} onPress={accion.onPress} />
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: espaciados.xl,
    paddingHorizontal: espaciados.lg,
    gap: espaciados.sm,
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