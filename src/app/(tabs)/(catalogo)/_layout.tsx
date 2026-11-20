import { Stack } from 'expo-router';

import { BotonPersonal } from '@/components/BotonPersonal';
import { colores } from '@/constants/tema';

export default function LayoutCatalogo() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colores.superficie },
        headerTintColor: colores.texto,
        contentStyle: { backgroundColor: colores.fondo },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Catálogo',
          headerRight: () => <BotonPersonal />,
        }}
      />
      <Stack.Screen name="libro/[isbn]" options={{ title: 'Libro' }} />
    </Stack>
  );
}