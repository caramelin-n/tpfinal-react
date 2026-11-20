import { StyleSheet, Switch, Text, View } from 'react-native';

import { Boton } from '@/components/Boton';
import {
  colores,
  espaciados,
  radios,
  tamanios,
  toqueMinimo,
} from '@/constants/tema';
import { formatearFecha } from '@/lib/fechas';
import type { Libro } from '@/types';
import type { Prestamo } from '@/types/biblioteca';

const COLORES_SWITCH = {
  false: colores.borde,
  true: colores.primarioSuave,
};

type Props = {
  libro: Libro;
  prestamo: Prestamo;
  onDevolver: () => void;
  onCambiarRecordatorio: (valor: boolean) => void;
};

export function TarjetaPrestamo({
  libro,
  prestamo,
  onDevolver,
  onCambiarRecordatorio,
}: Props) {
  return (
    <View style={estilos.tarjeta}>
      <Text style={estilos.titulo}>{libro.titulo}</Text>
      <Text style={estilos.autor}>{libro.autor}</Text>
      <Text style={estilos.vence}>
        Devolver antes del {formatearFecha(prestamo.vence)}
      </Text>

      <View style={estilos.filaRecordatorio}>
        <Text style={estilos.etiquetaRecordatorio}>Recordarme</Text>
        <Switch
          value={prestamo.recordarme}
          onValueChange={onCambiarRecordatorio}
          trackColor={COLORES_SWITCH}
          thumbColor={
            prestamo.recordarme ? colores.primario : colores.superficie
          }
          accessibilityLabel={`Recordarme para ${libro.titulo}`}
        />
      </View>

      <Boton titulo="Devolver" onPress={onDevolver} variante="peligro" />
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
  vence: {
    fontSize: tamanios.pie,
    fontWeight: '600',
    color: colores.primario,
  },
  filaRecordatorio: {
    minHeight: toqueMinimo,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espaciados.md,
  },
  etiquetaRecordatorio: {
    fontSize: tamanios.cuerpo,
    color: colores.texto,
  },
});