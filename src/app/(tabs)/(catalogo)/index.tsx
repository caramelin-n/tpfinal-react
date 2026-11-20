import { useRouter } from 'expo-router';
import { FlatList, StyleSheet } from 'react-native';

import { EncabezadoCatalogo } from '@/components/EncabezadoCatalogo';
import { EstadoCarga } from '@/components/EstadoCarga';
import { EstadoError } from '@/components/EstadoError';
import { EstadoVacio } from '@/components/EstadoVacio';
import { SeparadorLista } from '@/components/SeparadorLista';
import { TarjetaLibro } from '@/components/TarjetaLibro';
import { espaciados } from '@/constants/tema';
import { useBiblioteca } from '@/hooks/useBiblioteca';
import { useLibros } from '@/hooks/useLibros';

export default function Catalogo() {
  const router = useRouter();
  const { libros, cargando, error, reintentar } = useLibros();
  const { recientes, ejemplaresDisponibles } = useBiblioteca();

  const abrirLibro = (isbn: string) => {
    router.push({ pathname: '/libro/[isbn]', params: { isbn } });
  };

  if (cargando) {
    return <EstadoCarga mensaje="Cargando el catálogo…" />;
  }

  if (error) {
    return (
      <EstadoError
        titulo="No pudimos cargar el catálogo"
        mensaje={error}
        onReintentar={reintentar}
      />
    );
  }

  return (
    <FlatList
      data={libros}
      keyExtractor={(libro) => libro.isbn}
      renderItem={({ item }) => (
        <TarjetaLibro
          libro={item}
          disponibles={ejemplaresDisponibles(item.isbn)}
          onPress={() => abrirLibro(item.isbn)}
        />
      )}
      ListHeaderComponent={
        <EncabezadoCatalogo
          recientes={recientes.aArray().slice(-3).reverse()}
          onAbrirLibro={abrirLibro}
          onBuscar={() => router.push('/buscar')}
          onEscanear={() => router.push('/permisos/camara')}
        />
      }
      ListEmptyComponent={
        <EstadoVacio
          titulo="Catálogo vacío"
          mensaje="No hay libros disponibles en este momento."
        />
      }
      ItemSeparatorComponent={SeparadorLista}
      contentContainerStyle={estilos.contenido}
      showsVerticalScrollIndicator={false}
    />
  );
}

const estilos = StyleSheet.create({
  contenido: {
    padding: espaciados.md,
    paddingBottom: espaciados.xl,
  },
});