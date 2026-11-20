import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colores, espaciados, tamanios, toqueMinimo } from '@/constants/tema';
import { useBiblioteca } from '@/hooks/useBiblioteca';

export function BotonPersonal() {
  const { sesion } = useBiblioteca();
  const destino = sesion ? '/mostrador' : '/login';

  return (
    <Link href={destino} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          sesion ? 'Ir al mostrador' : 'Ingresar como personal'
        }
        style={({ pressed }) => [
          estilos.boton,
          pressed && estilos.presionado,
        ]}
      >
        <Text style={estilos.texto}>Personal</Text>
      </Pressable>
    </Link>
  );
}

const estilos = StyleSheet.create({
  boton: {
    minHeight: toqueMinimo,
    minWidth: toqueMinimo,
    justifyContent: 'center',
    paddingHorizontal: espaciados.md,
  },
  presionado: {
    opacity: 0.6,
  },
  texto: {
    fontSize: tamanios.cuerpo,
    fontWeight: '600',
    color: colores.primario,
  },
});