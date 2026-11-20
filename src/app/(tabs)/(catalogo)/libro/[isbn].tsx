import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Boton } from '@/components/Boton';
import { EstadoVacio } from '@/components/EstadoVacio';
import {
  colores,
  espaciados,
  radios,
  tamanios,
} from '@/constants/tema';
import { useBiblioteca } from '@/hooks/useBiblioteca';
import { buscarLibro, esIsbnValido } from '@/lib/catalogo';
import { normalizarParametro } from '@/lib/parametros';

export default function DetalleLibro() {
  const { isbn: isbnParametro } = useLocalSearchParams<{
    isbn?: string | string[];
  }>();
  const router = useRouter();
  const {
    registrarReciente,
    ejemplaresDisponibles,
    estadoLibro,
    posicionEnEspera,
    esperas,
  } = useBiblioteca();

  const isbn = normalizarParametro(isbnParametro);
  const libro = isbn && esIsbnValido(isbn) ? buscarLibro(isbn) : undefined;

  useEffect(() => {
    if (libro) {
      registrarReciente(libro);
    }
  }, [libro, registrarReciente]);

  if (!libro) {
    const mensaje = !isbn
      ? 'No recibimos ningún ISBN para buscar.'
      : !esIsbnValido(isbn)
        ? `El ISBN «${isbn}» no es válido: tiene que tener 13 dígitos.`
        : `No encontramos ningún libro con el ISBN «${isbn}».`;

    return (
      <>
        <Stack.Screen options={{ title: 'Libro no encontrado' }} />
        <View style={estilos.centrado}>
          <EstadoVacio
            titulo="No pudimos abrir el libro"
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

  const disponibles = ejemplaresDisponibles(libro.isbn);
  const enEspera = esperas[libro.isbn]?.tamanio ?? 0;
  const estado = estadoLibro(libro.isbn);
  const posicion = posicionEnEspera(libro.isbn);
  const yaReservado = estado === 'prestado' || estado === 'en-espera';

  const tituloBoton =
    estado === 'prestado'
      ? 'Ya tenés este libro'
      : estado === 'en-espera'
        ? `Ya estás en la lista (posición ${posicion})`
        : 'Reservar';

  return (
    <>
      <Stack.Screen options={{ title: libro.titulo }} />
      <ScrollView contentContainerStyle={estilos.contenedor}>
        <Text style={estilos.titulo}>{libro.titulo}</Text>
        <Text style={estilos.autor}>{libro.autor}</Text>
        <Text style={estilos.anio}>Año de publicación: {libro.anio}</Text>

        <View style={estilos.tarjeta}>
          <View style={estilos.fila}>
            <Text style={estilos.etiqueta}>Ejemplares disponibles</Text>
            <Text
              style={[
                estilos.valor,
                disponibles === 0
                  ? estilos.valorAgotado
                  : estilos.valorDisponible,
              ]}
            >
              {disponibles}
            </Text>
          </View>
          <View style={estilos.separador} />
          <View style={estilos.fila}>
            <Text style={estilos.etiqueta}>
              Personas en lista de espera
            </Text>
            <Text style={estilos.valor}>{enEspera}</Text>
          </View>
        </View>

        <Boton
          titulo={tituloBoton}
          deshabilitado={yaReservado}
          onPress={() =>
            router.push({
              pathname: '/reservar/[isbn]',
              params: { isbn: libro.isbn },
            })
          }
        />

        {yaReservado ? (
          <Text style={estilos.nota}>
            {estado === 'prestado'
              ? 'Podés ver la fecha de devolución en Mis reservas.'
              : 'Te avisamos cuando llegue tu turno.'}
          </Text>
        ) : null}
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
  anio: {
    fontSize: tamanios.pie,
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
  fila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: espaciados.md,
  },
  etiqueta: {
    flex: 1,
    fontSize: tamanios.cuerpo,
    color: colores.texto,
  },
  valor: {
    fontSize: tamanios.subtitulo,
    fontWeight: '700',
    color: colores.texto,
  },
  valorDisponible: {
    color: colores.exito,
  },
  valorAgotado: {
    color: colores.advertencia,
  },
  separador: {
    height: 1,
    backgroundColor: colores.borde,
  },
  nota: {
    fontSize: tamanios.pie,
    color: colores.textoSuave,
    textAlign: 'center',
  },
});