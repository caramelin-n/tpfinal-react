import { usePathname, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Boton } from '@/components/Boton';
import { colores, espaciados, tamanios } from '@/constants/tema';

export default function NoEncontrada() {
  const ruta = usePathname();
  const router = useRouter();

  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.codigo}>404</Text>
      <Text style={estilos.titulo}>No encontramos esta pantalla</Text>
      <Text style={estilos.detalle}>
        La dirección «{ruta}» no existe en la app.
      </Text>
      <Boton
        titulo="Volver al catálogo"
        onPress={() => router.replace('/')}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: espaciados.lg,
    gap: espaciados.md,
    backgroundColor: colores.fondo,
  },
  codigo: {
    fontSize: 48,
    fontWeight: '700',
    color: colores.primario,
  },
  titulo: {
    fontSize: tamanios.subtitulo,
    fontWeight: '600',
    color: colores.texto,
    textAlign: 'center',
  },
  detalle: {
    fontSize: tamanios.cuerpo,
    color: colores.textoSuave,
    textAlign: 'center',
  },
});