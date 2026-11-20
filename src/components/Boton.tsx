import { Pressable, StyleSheet, Text } from 'react-native';

import {
  colores,
  espaciados,
  radios,
  tamanios,
  toqueMinimo,
} from '@/constants/tema';

type Variante = 'primario' | 'secundario' | 'peligro';

type Props = {
  titulo: string;
  onPress: () => void;
  variante?: Variante;
  deshabilitado?: boolean;
  etiquetaAccesible?: string;
};

export function Boton({
  titulo,
  onPress,
  variante = 'primario',
  deshabilitado = false,
  etiquetaAccesible,
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiquetaAccesible ?? titulo}
      accessibilityState={{ disabled: deshabilitado }}
      disabled={deshabilitado}
      onPress={onPress}
      style={({ pressed }) => [
        estilos.base,
        variante === 'primario' && estilos.primario,
        variante === 'secundario' && estilos.secundario,
        variante === 'peligro' && estilos.peligro,
        deshabilitado && estilos.deshabilitado,
        pressed && !deshabilitado && estilos.presionado,
      ]}
    >
      <Text
        style={[
          estilos.texto,
          variante === 'secundario' && estilos.textoSecundario,
          variante === 'peligro' && estilos.textoPeligro,
          deshabilitado && estilos.textoDeshabilitado,
        ]}
      >
        {titulo}
      </Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  base: {
    minHeight: toqueMinimo,
    minWidth: toqueMinimo,
    borderRadius: radios.md,
    paddingHorizontal: espaciados.md,
    paddingVertical: espaciados.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primario: {
    backgroundColor: colores.primario,
  },
  secundario: {
    backgroundColor: colores.superficie,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  peligro: {
    backgroundColor: colores.errorSuave,
    borderWidth: 1,
    borderColor: colores.error,
  },
  deshabilitado: {
    opacity: 0.5,
  },
  presionado: {
    opacity: 0.8,
  },
  texto: {
    fontSize: tamanios.cuerpo,
    fontWeight: '600',
    color: colores.blanco,
    textAlign: 'center',
  },
  textoSecundario: {
    color: colores.texto,
  },
  textoPeligro: {
    color: colores.error,
  },
  textoDeshabilitado: {
    color: colores.textoSuave,
  },
});