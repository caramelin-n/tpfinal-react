import { useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { Boton } from '@/components/Boton';
import { EstadoVacio } from '@/components/EstadoVacio';
import { SeparadorLista } from '@/components/SeparadorLista';
import { TarjetaMostrador } from '@/components/TarjetaMostrador';
import {
  colores,
  espaciados,
  radios,
  tamanios,
} from '@/constants/tema';
import { useBiblioteca } from '@/hooks/useBiblioteca';
import { buscarLibro } from '@/lib/catalogo';
import {
  notificarTurno,
  permisoNotificacionesConcedido,
} from '@/lib/notificaciones';
import type { Libro } from '@/types';

type ItemMostrador = {
  libro: Libro;
  frente: string;
  total: number;
};

export default function Mostrador() {
  const {
    sesion,
    esperas,
    entregarSiguiente,
    cerrarSesion,
    agregarAviso,
  } = useBiblioteca();

  const [mensaje, setMensaje] = useState<string | null>(null);
  const entregandoRef = useRef(false);

  const items: ItemMostrador[] = [];
  for (const isbn of Object.keys(esperas)) {
    const libro = buscarLibro(isbn);
    const cola = esperas[isbn];
    if (libro && cola && cola.tamanio > 0) {
      items.push({
        libro,
        frente: cola.frente() ?? '',
        total: cola.tamanio,
      });
    }
  }

  const entregar = async (isbn: string, titulo: string) => {
    if (entregandoRef.current) return;
    entregandoRef.current = true;

    try {
      const resultado = entregarSiguiente(isbn);
      if (!resultado) {
        setMensaje('No hay nadie en la lista de espera.');
        return;
      }

      setMensaje(
        `Entregamos «${titulo}» a ${resultado.nombre}.`,
      );

      if (!resultado.esYo) return;

      let avisado = false;
      try {
        if (await permisoNotificacionesConcedido()) {
          await notificarTurno(titulo, isbn);
          avisado = true;
        }
      } catch {
        avisado = false;
      }

      if (!avisado) {
        agregarAviso({
          isbn,
          titulo: 'Tu reserva está lista',
          mensaje: `«${titulo}» te espera en el mostrador. Pasá a retirarlo.`,
        });
      }
    } finally {
      entregandoRef.current = false;
    }
  };

  return (
    <View style={estilos.pantalla}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.libro.isbn}
        renderItem={({ item }) => (
          <TarjetaMostrador
            libro={item.libro}
            frente={item.frente}
            total={item.total}
            onEntregar={() => {
              void entregar(item.libro.isbn, item.libro.titulo);
            }}
          />
        )}
        ListHeaderComponent={
          <View style={estilos.encabezado}>
            <Text style={estilos.sesion}>
              Sesión: {sesion ?? 'personal'}
            </Text>
            {mensaje ? (
              <Text style={estilos.mensaje}>{mensaje}</Text>
            ) : null}
            <Text style={estilos.titulo}>Listas de espera</Text>
          </View>
        }
        ListEmptyComponent={
          <EstadoVacio
            titulo="Sin listas de espera"
            mensaje="No hay personas esperando por un libro."
          />
        }
        ListFooterComponent={
          <View style={estilos.pie}>
            <Boton
              titulo="Cerrar sesión"
              onPress={cerrarSesion}
              variante="secundario"
            />
          </View>
        }
        ItemSeparatorComponent={SeparadorLista}
        contentContainerStyle={estilos.contenido}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colores.fondo,
  },
  contenido: {
    padding: espaciados.md,
    paddingBottom: espaciados.xl,
  },
  encabezado: {
    gap: espaciados.sm,
    marginBottom: espaciados.md,
  },
  sesion: {
    fontSize: tamanios.pie,
    color: colores.textoSuave,
  },
  mensaje: {
    fontSize: tamanios.pie,
    color: colores.primario,
    backgroundColor: colores.primarioSuave,
    borderRadius: radios.md,
    padding: espaciados.md,
  },
  titulo: {
    fontSize: tamanios.titulo,
    fontWeight: '700',
    color: colores.texto,
  },
  pie: {
    marginTop: espaciados.lg,
  },
});