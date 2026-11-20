import { StyleSheet, View } from 'react-native';

import { espaciados } from '@/constants/tema';

export function SeparadorLista() {
  return <View style={estilos.separador} />;
}

const estilos = StyleSheet.create({
  separador: {
    height: espaciados.sm,
  },
});