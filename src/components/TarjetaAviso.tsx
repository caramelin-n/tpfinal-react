import { StyleSheet, Text, View } from 'react-native';

import { Boton } from '@/components/Boton';
import { colores, espaciados, radios, tamanios } from '@/constants/tema';
import type { Aviso } from '@/types/biblioteca';

type Props = {
  aviso: Aviso;
  onDescartar: () => void;
};

export function TarjetaAviso({ aviso, onDescartar }: Props) {
  return (
    <View style={estilos.tarjeta}>
      <Text style={estilos.titulo}>{aviso.titulo}</Text>
      <Text style={estilos.mensaje}>{aviso.mensaje}</Text>
      <Boton
        titulo="Entendido"
        onPress={onDescartar}
        variante="secundario"
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    backgroundColor: colores.advertenciaSuave,
    borderRadius: radios.md,
    borderWidth: 1,
    borderColor: colores.advertencia,
    padding: espaciados.md,
    gap: espaciados.sm,
  },
  titulo: {
    fontSize: tamanios.cuerpo,
    fontWeight: '600',
    color: colores.advertencia,
  },
  mensaje: {
    fontSize: tamanios.pie,
    color: colores.texto,
  },
});