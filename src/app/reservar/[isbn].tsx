import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Boton } from '@/components/Boton';
import { EstadoVacio } from '@/components/EstadoVacio';
import { DIAS_PRESTAMO } from '@/constants/biblioteca';
import {
  colores,
  espaciados,
  radios,
  tamanios,
} from '@/constants/tema';
import { useBiblioteca } from '@/hooks/useBiblioteca';
import { buscarLibro, esIsbnValido } from '@/lib/catalogo';
import { calcularVencimiento, formatearFecha } from '@/lib/fechas';
import { normalizarParametro } from '@/lib/parametros';

export default function Reservar() {
  const { isbn: isbnParametro } = useLocalSearchParams<{
    isbn?: string | string[];
  }>();
  const router = useRouter();
  const {
    reservar,
    estadoLibro,
    ejemplaresDisponibles,
    posicionEnEspera,
    esperas,
  } = useBiblioteca();
  const [error, setError] = useState<string | null>(null);
  const bloqueadoRef = useRef(false);

  const isbn = normalizarParametro(isbnParametro);
  const libro = isbn && esIsbnValido(isbn) ? buscarLibro(isbn) : undefined;

  if (!libro) {
    const mensaje = !isbn
      ? 'No recibimos ningún ISBN para reservar.'
      : !esIsbnValido(isbn)
        ? `El ISBN «${isbn}» no es válido: tiene que tener 13 dígitos.`
        : `No encontramos ningún libro con el ISBN «${isbn}».`;

    return (
      <>
        <Stack.Screen options={{ title: 'Reservar' }} />
        <View style={estilos.centrado}>
          <EstadoVacio
            titulo="No pudimos preparar la reserva"
            mensaje={mensaje}
            accion={{
              titulo: 'Volver al catálogo',
              onPress: () => router.dismissTo('/'),
            }}
          />
        </View>
      </>
    );
  }

  const estado = estadoLibro(libro.isbn);
  const disponibles = ejemplaresDisponibles(libro.isbn);
  const enEspera = esperas[libro.isbn]?.tamanio ?? 0;
  const posicion = posicionEnEspera(libro.isbn);

  if (estado === 'prestado' || estado === 'en-espera') {
    return (
      <>
        <Stack.Screen options={{ title: 'Reservar' }} />
        <View style={estilos.centrado}>
          <EstadoVacio
            titulo={
              estado === 'prestado'
                ? 'Ya tenés este libro'
                : 'Ya estás en la lista'
            }
            mensaje={
              estado === 'prestado'
                ? `«${libro.titulo}» está en tus préstamos.`
                : `«${libro.titulo}» está en tu lista de espera (posición ${posicion}).`
            }
            accion={{
              titulo: 'Ir a Mis reservas',
              onPress: () => router.dismissTo('/reservas'),
            }}
          />
        </View>
      </>
    );
  }

  const hayEjemplares = disponibles > 0;
  const posicionNueva = enEspera + 1;
  const fecha = formatearFecha(calcularVencimiento());

  const confirmar = () => {
    if (bloqueadoRef.current) return;
    bloqueadoRef.current = true;

    const resultado = reservar(libro.isbn);

    if (resultado.tipo === 'prestamo' || resultado.tipo === 'espera') {
      router.dismissTo('/reservas');
      return;
    }

    bloqueadoRef.current = false;
    if (resultado.tipo === 'ya') {
      setError(
        'Ya tenés este libro reservado. Podés verlo en Mis reservas.',
      );
    } else if (resultado.tipo === 'no-existe') {
      setError('Ese libro ya no está en el catálogo.');
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Confirmar reserva' }} />
      <ScrollView contentContainerStyle={estilos.contenedor}>
        <Text style={estilos.titulo}>{libro.titulo}</Text>
        <Text style={estilos.autor}>{libro.autor}</Text>

        <View style={estilos.tarjeta}>
          {hayEjemplares ? (
            <>
              <Text style={estilos.mensaje}>
                {disponibles === 1
                  ? 'Hay 1 ejemplar disponible.'
                  : `Hay ${disponibles} ejemplares disponibles.`}
              </Text>
              <Text style={estilos.detalle}>
                El préstamo vence el {fecha} ({DIAS_PRESTAMO} días).
              </Text>
            </>
          ) : (
            <>
              <Text style={estilos.mensaje}>
                No hay ejemplares disponibles.
              </Text>
              <Text style={estilos.detalle}>
                Si confirmás, entrás en la lista de espera en la posición{' '}
                {posicionNueva}.
              </Text>
            </>
          )}
        </View>

        {error ? <Text style={estilos.error}>{error}</Text> : null}

        <Boton
          titulo={
            hayEjemplares ? 'Confirmar préstamo' : 'Confirmar reserva'
          }
          onPress={confirmar}
        />
        <Boton
          titulo="Cancelar"
          onPress={() => router.back()}
          variante="secundario"
        />
      </ScrollView>
    </>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flexGrow: 1,
    padding: espaciados.lg,
    gap: espaciados.md,
    backgroundColor: colores.fondo,
  },
  centrado: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: colores.fondo,
  },
  titulo: {
    fontSize: tamanios.tituloDetalle,
    fontWeight: '700',
    color: colores.texto,
  },
  autor: {
    fontSize: tamanios.subtitulo,
    color: colores.textoSuave,
  },
  tarjeta: {
    backgroundColor: colores.superficie,
    borderRadius: radios.md,
    borderWidth: 1,
    borderColor: colores.borde,
    padding: espaciados.md,
    gap: espaciados.sm,
  },
  mensaje: {
    fontSize: tamanios.cuerpo,
    fontWeight: '600',
    color: colores.texto,
  },
  detalle: {
    fontSize: tamanios.cuerpo,
    color: colores.textoSuave,
  },
  error: {
    fontSize: tamanios.cuerpo,
    color: colores.error,
    textAlign: 'center',
  },
});