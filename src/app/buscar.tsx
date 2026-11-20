import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { EstadoCarga } from '@/components/EstadoCarga';
import { EstadoError } from '@/components/EstadoError';
import { EstadoVacio } from '@/components/EstadoVacio';
import { SeparadorLista } from '@/components/SeparadorLista';
import { TarjetaLibro } from '@/components/TarjetaLibro';
import {
  colores,
  espaciados,
  radios,
  tamanios,
  toqueMinimo,
} from '@/constants/tema';
import { useBiblioteca } from '@/hooks/useBiblioteca';
import { buscarLibros } from '@/lib/api';
import { normalizarParametro } from '@/lib/parametros';
import type { Libro } from '@/types';

const MENSAJE_ERROR =
  'No pudimos completar la búsqueda. Revisá tu conexión e intentá de nuevo.';

export default function Buscar() {
  const { q } = useLocalSearchParams<{ q?: string | string[] }>();
  const router = useRouter();
  const { ejemplaresDisponibles } = useBiblioteca();

  const qUrl = normalizarParametro(q) ?? '';
  const consulta = qUrl.trim();

  const [texto, setTexto] = useState(qUrl);
  const [resultados, setResultados] = useState<Libro[]>([]);
  const [cargando, setCargando] = useState(consulta.length > 0);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let cancelado = false;
    const textoBusqueda = qUrl.trim();

    if (!textoBusqueda) {
      return () => {
        cancelado = true;
      };
    }

    const buscar = async () => {
      try {
        const datos = await buscarLibros(textoBusqueda);
        if (!cancelado) {
          setResultados(datos);
        }
      } catch {
        if (!cancelado) {
          setResultados([]);
          setError(MENSAJE_ERROR);
        }
      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    };

    void buscar();

    return () => {
      cancelado = true;
    };
  }, [qUrl, intento]);

  const alCambiarTexto = (nuevo: string) => {
    setTexto(nuevo);
    router.setParams({ q: nuevo });
    setError(null);
    setResultados([]);
    setCargando(nuevo.trim().length > 0);
  };

  const limpiar = () => {
    alCambiarTexto('');
  };

  const reintentar = useCallback(() => {
    if (!consulta) return;
    setError(null);
    setCargando(true);
    setIntento((anterior) => anterior + 1);
  }, [consulta]);

  const abrirLibro = (isbn: string) => {
    router.push({ pathname: '/libro/[isbn]', params: { isbn } });
  };

  return (
    <View style={estilos.pantalla}>
      <View style={estilos.barra}>
        <Ionicons
          name="search"
          size={tamanios.icono}
          color={colores.textoSuave}
        />
        <TextInput
          accessibilityLabel="Buscar por título o autor"
          value={texto}
          onChangeText={alCambiarTexto}
          placeholder="Título o autor"
          placeholderTextColor={colores.textoSuave}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          selectionColor={colores.primario}
          style={estilos.input}
        />
        {texto.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Limpiar búsqueda"
            onPress={limpiar}
            style={estilos.limpiar}
          >
            <Ionicons
              name="close-circle"
              size={tamanios.icono}
              color={colores.textoSuave}
            />
          </Pressable>
        ) : null}
      </View>

      {!consulta ? (
        <EstadoVacio
          titulo="Buscá un libro"
          mensaje="Escribí el título o el autor y los resultados aparecen acá."
        />
      ) : cargando ? (
        <EstadoCarga mensaje="Buscando…" />
      ) : error ? (
        <EstadoError
          titulo="No pudimos buscar"
          mensaje={error}
          onReintentar={reintentar}
        />
      ) : (
        <FlatList
          data={resultados}
          keyExtractor={(libro) => libro.isbn}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          renderItem={({ item }) => (
            <TarjetaLibro
              libro={item}
              disponibles={ejemplaresDisponibles(item.isbn)}
              onPress={() => abrirLibro(item.isbn)}
            />
          )}
          ListEmptyComponent={
            <EstadoVacio
              titulo="Sin resultados"
              mensaje={`No encontramos libros para «${consulta}».`}
            />
          }
          ItemSeparatorComponent={SeparadorLista}
          contentContainerStyle={estilos.contenido}
          style={estilos.lista}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colores.fondo,
  },
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciados.sm,
    minHeight: toqueMinimo,
    margin: espaciados.md,
    paddingHorizontal: espaciados.md,
    backgroundColor: colores.superficie,
    borderRadius: radios.md,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  input: {
    flex: 1,
    minHeight: toqueMinimo,
    fontSize: tamanios.cuerpo,
    color: colores.texto,
  },
  limpiar: {
    minHeight: toqueMinimo,
    minWidth: toqueMinimo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lista: {
    flex: 1,
  },
  contenido: {
    paddingHorizontal: espaciados.md,
    paddingBottom: espaciados.xl,
  },
});