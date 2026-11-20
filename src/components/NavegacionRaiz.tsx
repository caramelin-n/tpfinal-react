import { Stack } from 'expo-router';

import { colores } from '@/constants/tema';
import { useBiblioteca } from '@/hooks/useBiblioteca';

export function NavegacionRaiz() {
  const { sesion } = useBiblioteca();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colores.superficie },
        headerTintColor: colores.texto,
        contentStyle: { backgroundColor: colores.fondo },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="buscar" options={{ title: 'Buscar' }} />
      <Stack.Screen name="escanear" options={{ title: 'Escanear' }} />
      <Stack.Screen
        name="reservar/[isbn]"
        options={{ presentation: 'modal', title: 'Reservar' }}
      />
      <Stack.Screen
        name="permisos/[recurso]"
        options={{ presentation: 'modal', title: 'Permisos' }}
      />

      <Stack.Protected guard={sesion === null} redirectTo="/mostrador">
        <Stack.Screen
          name="login"
          options={{ presentation: 'modal', title: 'Ingreso del personal' }}
        />
      </Stack.Protected>

      <Stack.Protected guard={sesion !== null} redirectTo="/login">
        <Stack.Screen name="mostrador" options={{ title: 'Mostrador' }} />
      </Stack.Protected>

      <Stack.Screen
        name="+not-found"
        options={{ title: 'Pantalla no encontrada' }}
      />
    </Stack>
  );
}