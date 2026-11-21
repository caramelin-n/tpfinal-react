import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SeparadorLista } from '@/components/SeparadorLista';
import { TarjetaAviso } from '@/components/TarjetaAviso';
import { TarjetaEspera } from '@/components/TarjetaEspera';
import { TarjetaPrestamo } from '@/components/TarjetaPrestamo';
import {
  colores,
  espaciados,
  radios,
  tamanios,
  toqueMinimo,
} from '@/constants/tema';
import { useBiblioteca } from '@/hooks/useBiblioteca';
import { usePermiso, type EstadoPermiso } from '@/hooks/usePermiso';
import { buscarLibro } from '@/lib/catalogo';
import {
  cancelarRecordatorio,
  pedirPermisoNotificaciones,
  programarRecordatorio,
} from '@/lib/notificaciones';
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

const MENSAJES_NOTIFICACIONES: Record<EstadoPermiso, string> = {
  cargando: 'Consultando el permiso de notificaciones…',
  concedido: 'Notificaciones activadas.',
  preguntable:
    'Notificaciones desactivadas. Se piden al activar “Recordarme”.',
  bloqueado:
    'Notificaciones bloqueadas. Habilitalas desde Ajustes.',
};

const ICONOS_NOTIFICACIONES: Record<
  EstadoPermiso,
  'notifications' | 'notifications-off' | 'notifications-outline'
> = {
  cargando: 'notifications-outline',
  concedido: 'notifications',
  preguntable: 'notifications-outline',
  bloqueado: 'notifications-off',
};

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

  const permisoNotificaciones = usePermiso('notificaciones');
  const refrescarNotificaciones = permisoNotificaciones.refrescar;

  useFocusEffect(
    useCallback(() => {
      void refrescarNotificaciones();
    }, [refrescarNotificaciones]),
  );

  const [mensajeRecordatorio, setMensajeRecordatorio] = useState<
    string | null
  >(null);
  const cambiandoRecordatorioRef = useRef(false);

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

  const cambiarRecordatorio = async (isbn: string, valor: boolean) => {
    if (cambiandoRecordatorioRef.current) return;
    cambiandoRecordatorioRef.current = true;
    setMensajeRecordatorio(null);

    try {
      if (valor) {
        const concedido = await pedirPermisoNotificaciones();
        if (!concedido) {
          setMensajeRecordatorio(
            'Para activar el recordatorio necesitás permitir las notificaciones. Podés habilitarlas desde Ajustes.',
          );
          return;
        }

        const libro = buscarLibro(isbn);
        const prestamo = prestamos.find(
          (candidato) => candidato.isbn === isbn,
        );
        if (!libro || !prestamo) {
          setMensajeRecordatorio('Ese préstamo ya no está activo.');
          return;
        }

        const id = await programarRecordatorio(libro.titulo, isbn);
        actualizarRecordatorio(isbn, true, id);
      } else {
        const prestamo = prestamos.find(
          (candidato) => candidato.isbn === isbn,
        );
        if (prestamo?.notificacionId) {
          await cancelarRecordatorio(prestamo.notificacionId);
        }
        actualizarRecordatorio(isbn, false, null);
      }
    } catch {
      setMensajeRecordatorio(
        'No pudimos programar el recordatorio. Probá de nuevo en unos segundos.',
      );
    } finally {
      cambiandoRecordatorioRef.current = false;
      void permisoNotificaciones.refrescar();
    }
  };

  const devolverPrestamo = async (isbn: string) => {
    const prestamo = prestamos.find(
      (candidato) => candidato.isbn === isbn,
    );
    try {
      if (prestamo?.notificacionId) {
        await cancelarRecordatorio(prestamo.notificacionId);
      }
    } finally {
      devolver(isbn);
    }
  };

  const estadoNotificaciones = permisoNotificaciones.estado;
  const filaNotificaciones = (
    <View style={estilos.estadoNotificaciones}>
      <Ionicons
        name={ICONOS_NOTIFICACIONES[estadoNotificaciones]}
        size={tamanios.icono}
        color={
          estadoNotificaciones === 'bloqueado'
            ? colores.advertencia
            : colores.primario
        }
      />
      <Text style={estilos.textoEstado}>
        {MENSAJES_NOTIFICACIONES[estadoNotificaciones]}
      </Text>
      {estadoNotificaciones === 'bloqueado' ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir Ajustes para habilitar notificaciones"
          onPress={permisoNotificaciones.abrirAjustes}
          style={estilos.botonAjustes}
        >
          <Text style={estilos.textoAjustes}>Abrir Ajustes</Text>
        </Pressable>
      ) : null}
    </View>
  );

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
              onDevolver={() => {
                void devolverPrestamo(item.libro.isbn);
              }}
              onCambiarRecordatorio={(valor) => {
                void cambiarRecordatorio(item.libro.isbn, valor);
              }}
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
        <View style={estilos.encabezado}>
          {filaNotificaciones}
          {mensajeRecordatorio ? (
            <View style={estilos.mensajeRecordatorio}>
              <Text style={estilos.textoMensajeRecordatorio}>
                {mensajeRecordatorio}
              </Text>
            </View>
          ) : null}
          {avisos.length > 0 ? (
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
          ) : null}
        </View>
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
  encabezado: {
    gap: espaciados.md,
    marginBottom: espaciados.md,
  },
  estadoNotificaciones: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciados.sm,
    backgroundColor: colores.superficie,
    borderRadius: radios.md,
    borderWidth: 1,
    borderColor: colores.borde,
    padding: espaciados.md,
  },
  textoEstado: {
    flex: 1,
    fontSize: tamanios.pie,
    color: colores.textoSuave,
  },
  botonAjustes: {
    minHeight: toqueMinimo,
    minWidth: toqueMinimo,
    justifyContent: 'center',
  },
  textoAjustes: {
    fontSize: tamanios.pie,
    fontWeight: '600',
    color: colores.primario,
  },
  mensajeRecordatorio: {
    backgroundColor: colores.advertenciaSuave,
    borderRadius: radios.md,
    borderWidth: 1,
    borderColor: colores.advertencia,
    padding: espaciados.md,
  },
  textoMensajeRecordatorio: {
    fontSize: tamanios.pie,
    color: colores.advertencia,
  },
  avisos: {
    gap: espaciados.sm,
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