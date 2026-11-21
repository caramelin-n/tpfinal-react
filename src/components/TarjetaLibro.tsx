import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  colores,
  espaciados,
  radios,
  tamanios,
  toqueMinimo,
} from '@/constants/tema';
import type { Libro } from '@/types';

type Props = {
  libro: Libro;
  disponibles: number;
  onPress: () => void;
};

export function TarjetaLibro({ libro, disponibles, onPress }: Props) {
  const agotado = disponibles === 0;
  const textoDisponibilidad = agotado
    ? 'Sin ejemplares'
    : disponibles === 1
      ? '1 disponible'
      : `${disponibles} disponibles`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${libro.titulo}, de ${libro.autor}. ${textoDisponibilidad}`}
      accessibilityHint="Abre el detalle del libro"
      onPress={onPress}
      style={({ pressed }) => [
        estilos.tarjeta,
        pressed && estilos.presionada,
      ]}
    >
      <View style={estilos.contenido}>
        <Text style={estilos.titulo}>{libro.titulo}</Text>
        <Text style={estilos.autor}>
          {libro.autor} · {libro.anio}
        </Text>
        <Text
          style={[
            estilos.disponibilidad,
            agotado ? estilos.agotado : estilos.disponible,
          ]}
        >
          {textoDisponibilidad}
        </Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={tamanios.icono}
        color={colores.textoSuave}
      />
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    minHeight: toqueMinimo,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciados.md,
    backgroundColor: colores.superficie,
    borderRadius: radios.md,
    borderWidth: 1,
    borderColor: colores.borde,
    padding: espaciados.md,
  },
  presionada: {
    opacity: 0.8,
  },
  contenido: {
    flex: 1,
    gap: espaciados.xs,
  },
  titulo: {
    fontSize: tamanios.cuerpo,
    fontWeight: '600',
    color: colores.texto,
  },
  autor: {
    fontSize: tamanios.pie,
    color: colores.textoSuave,
  },
  disponibilidad: {
    alignSelf: 'flex-start',
    fontSize: tamanios.pie,
    fontWeight: '600',
    paddingHorizontal: espaciados.sm,
    paddingVertical: 2,
    borderRadius: radios.redondo,
  },
  disponible: {
    color: colores.exito,
    backgroundColor: colores.exitoSuave,
  },
  agotado: {
    color: colores.advertencia,
    backgroundColor: colores.advertenciaSuave,
  },
});