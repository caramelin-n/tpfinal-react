import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Boton } from '@/components/Boton';
import {
  colores,
  espaciados,
  radios,
  tamanios,
  toqueMinimo,
} from '@/constants/tema';
import type { Libro } from '@/types';

type Props = {
  recientes: Libro[];
  onAbrirLibro: (isbn: string) => void;
  onBuscar: () => void;
  onEscanear: () => void;
};

export function EncabezadoCatalogo({
  recientes,
  onAbrirLibro,
  onBuscar,
  onEscanear,
}: Props) {
  return (
    <View style={estilos.contenedor}>
      {recientes.length > 0 ? (
        <View style={estilos.seccion}>
          <Text style={estilos.subtitulo}>Vistos recientemente</Text>
          <View style={estilos.chips}>
            {recientes.map((libro) => (
              <Pressable
                key={libro.isbn}
                accessibilityRole="button"
                accessibilityLabel={`Abrir ${libro.titulo}`}
                onPress={() => onAbrirLibro(libro.isbn)}
                style={({ pressed }) => [
                  estilos.chip,
                  pressed && estilos.chipPresionado,
                ]}
              >
                <Text numberOfLines={1} style={estilos.chipTexto}>
                  {libro.titulo}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      <View style={estilos.acciones}>
        <Boton
          titulo="Buscar"
          onPress={onBuscar}
          variante="secundario"
          estilo={estilos.botonAccion}
        />
        <Boton
          titulo="Escanear"
          onPress={onEscanear}
          estilo={estilos.botonAccion}
        />
      </View>

      <Text style={estilos.tituloSeccion}>Todos los libros</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    paddingTop: espaciados.md,
    paddingBottom: espaciados.md,
    gap: espaciados.lg,
  },
  seccion: {
    gap: espaciados.sm,
  },
  subtitulo: {
    fontSize: tamanios.subtitulo,
    fontWeight: '600',
    color: colores.texto,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espaciados.sm,
  },
  chip: {
    minHeight: toqueMinimo,
    justifyContent: 'center',
    maxWidth: '100%',
    backgroundColor: colores.primarioSuave,
    borderRadius: radios.redondo,
    borderWidth: 1,
    borderColor: colores.primario,
    paddingHorizontal: espaciados.md,
  },
  chipPresionado: {
    opacity: 0.75,
  },
  chipTexto: {
    fontSize: tamanios.pie,
    fontWeight: '600',
    color: colores.primario,
  },
  acciones: {
    flexDirection: 'row',
    gap: espaciados.sm,
  },
  botonAccion: {
    flex: 1,
  },
  tituloSeccion: {
    fontSize: tamanios.subtitulo,
    fontWeight: '600',
    color: colores.texto,
  },
});