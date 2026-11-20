import { FlatList, StyleSheet, Text, View } from 'react-native';

import { SeparadorLista } from '@/components/SeparadorLista';
import { TarjetaAviso } from '@/components/TarjetaAviso';
import { TarjetaEspera } from '@/components/TarjetaEspera';
import { TarjetaPrestamo } from '@/components/TarjetaPrestamo';
import { colores, espaciados, tamanios } from '@/constants/tema';
import { useBiblioteca } from '@/hooks/useBiblioteca';
import { buscarLibro } from '@/lib/catalogo';
import type { Libro } from '@/types';
import type { Prestamo } from '@/types/biblioteca';

type ItemReserva =
  | { tipo: 'seccion'; clave: string; titulo: string }
  | {
      tipo: 'prestamo';
      clave: string;
      libro: Libro;
      prestamo: Prestamo;
    }
  | {
      tipo: 'espera';
      clave: string;
      libro: Libro;
      posicion: number;
      total: number;
    }
  | { tipo: 'vacio'; clave: string; mensaje: string };

export default function Reservas() {
  const {
    prestamos,
    esperas,
    avisos,
    devolver,
    actualizarRecordatorio,
    posicionEnEspera,
    quitarAviso,
  } = useBiblioteca();

  const items: ItemReserva[] = [];
  items.push({
    tipo: 'seccion',
    clave: 'seccion-prestamos',
    titulo: 'Mis préstamos',
  });

  let hayPrestamos = false;
  for (const prestamo of prestamos) {
    const libro = buscarLibro(prestamo.isbn);
    if (libro) {
      hayPrestamos = true;
      items.push({
        tipo: 'prestamo',
        clave: `prestamo-${libro.isbn}`,
        libro,
        prestamo,
      });
    }
  }
  if (!hayPrestamos) {
    items.push({
      tipo: 'vacio',
      clave: 'vacio-prestamos',
      mensaje: 'No tenés préstamos activos.',
    });
  }

  items.push({
    tipo: 'seccion',
    clave: 'seccion-esperas',
    titulo: 'Mis reservas en espera',
  });

  let hayEsperas = false;
  for (const isbn of Object.keys(esperas)) {
    const libro = buscarLibro(isbn);
    const cola = esperas[isbn];
    const posicion = posicionEnEspera(isbn);
    if (libro && cola && posicion > 0) {
      hayEsperas = true;
      items.push({
        tipo: 'espera',
        clave: `espera-${libro.isbn}`,
        libro,
        posicion,
        total: cola.tamanio,
      });
    }
  }
  if (!hayEsperas) {
    items.push({
      tipo: 'vacio',
      clave: 'vacio-esperas',
      mensaje: 'No tenés reservas en espera.',
    });
  }

  const cambiarRecordatorio = (isbn: string, valor: boolean) => {
    actualizarRecordatorio(isbn, valor, null);
  };

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.clave}
      renderItem={({ item }) => {
        if (item.tipo === 'seccion') {
          return <Text style={estilos.tituloSeccion}>{item.titulo}</Text>;
        }
        if (item.tipo === 'vacio') {
          return <Text style={estilos.vacio}>{item.mensaje}</Text>;
        }
        if (item.tipo === 'prestamo') {
          return (
            <TarjetaPrestamo
              libro={item.libro}
              prestamo={item.prestamo}
              onDevolver={() => devolver(item.libro.isbn)}
              onCambiarRecordatorio={(valor) =>
                cambiarRecordatorio(item.libro.isbn, valor)
              }
            />
          );
        }
        return (
          <TarjetaEspera
            libro={item.libro}
            posicion={item.posicion}
            total={item.total}
          />
        );
      }}
      ListHeaderComponent={
        avisos.length > 0 ? (
          <View style={estilos.avisos}>
            <Text style={estilos.tituloSeccion}>Avisos</Text>
            {avisos.map((aviso) => (
              <TarjetaAviso
                key={aviso.id}
                aviso={aviso}
                onDescartar={() => quitarAviso(aviso.id)}
              />
            ))}
          </View>
        ) : undefined
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
  avisos: {
    gap: espaciados.sm,
    marginBottom: espaciados.md,
  },
  tituloSeccion: {
    fontSize: tamanios.subtitulo,
    fontWeight: '600',
    color: colores.texto,
    marginTop: espaciados.sm,
  },
  vacio: {
    fontSize: tamanios.pie,
    color: colores.textoSuave,
    paddingVertical: espaciados.sm,
  },
});