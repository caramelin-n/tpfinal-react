import { StyleSheet, Text, View } from 'react-native';

import { Boton } from '@/components/Boton';
import { YO } from '@/constants/biblioteca';
import {
  colores,
  espaciados,
  radios,
  tamanios,
} from '@/constants/tema';
import type { Libro } from '@/types';

type Props = {
  libro: Libro;
  frente: string;
  total: number;
  onEntregar: () => void;
};

export function TarjetaMostrador({
  libro,
  frente,
  total,
  onEntregar,
}: Props) {
  const esLaPersonaDeLaApp = frente === YO;

  return (
    <View style={estilos.tarjeta}>
      <Text style={estilos.titulo}>{libro.titulo}</Text>
      <Text style={estilos.autor}>{libro.autor}</Text>

      <View style={estilos.fila}>
        <Text style={estilos.etiqueta}>Al frente</Text>
        <Text style={estilos.valor}>{frente}</Text>
      </View>

      {esLaPersonaDeLaApp ? (
        <Text style={estilos.yo}>
          Es la persona que usa esta app: se le avisa al entregar.
        </Text>
      ) : null}

      <Text style={estilos.espera}>
        {total === 1
          ? '1 persona en la lista'
          : `${total} personas en la lista`}
      </Text>

      <Boton titulo="Entregar al siguiente" onPress={onEntregar} />
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
    gap: espaciados.sm,
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
  fila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: espaciados.md,
    marginTop: espaciados.xs,
  },
  etiqueta: {
    fontSize: tamanios.pie,
    color: colores.textoSuave,
  },
  valor: {
    fontSize: tamanios.cuerpo,
    fontWeight: '700',
    color: colores.primario,
  },
  yo: {
    fontSize: tamanios.pie,
    color: colores.primario,
    backgroundColor: colores.primarioSuave,
    borderRadius: radios.sm,
    padding: espaciados.sm,
  },
  espera: {
    fontSize: tamanios.pie,
    color: colores.textoSuave,
  },
});