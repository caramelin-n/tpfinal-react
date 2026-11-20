import { StyleSheet, Text, View } from 'react-native';

import { colores, espaciados, radios, tamanios } from '@/constants/tema';
import type { Libro } from '@/types';

type Props = {
  libro: Libro;
  posicion: number;
  total: number;
};

export function TarjetaEspera({ libro, posicion, total }: Props) {
  return (
    <View style={estilos.tarjeta}>
      <Text style={estilos.titulo}>{libro.titulo}</Text>
      <Text style={estilos.autor}>{libro.autor}</Text>
      <Text style={estilos.posicion}>
        Posición {posicion} de {total} en la lista de espera
      </Text>
      <Text style={estilos.nota}>Te avisamos cuando llegue tu turno.</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    backgroundColor: colores.superficie,
    borderRadius: radios.md,
    borderWidth: 1,
    borderColor: colores.borde,
    padding: espaciados.md,
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
  posicion: {
    fontSize: tamanios.pie,
    fontWeight: '600',
    color: colores.acento,
    marginTop: espaciados.xs,
  },
  nota: {
    fontSize: tamanios.pie,
    color: colores.textoSuave,
  },
});