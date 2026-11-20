import {
  AndroidImportance,
  setNotificationChannelAsync,
} from 'expo-notifications';
import { Platform } from 'react-native';

import { colores } from '@/constants/tema';

export const CANAL_PRESTAMOS = 'prestamos';
export const NOMBRE_CANAL_PRESTAMOS = 'Recordatorios de préstamos';

// En Android 13+ el diálogo de permisos no aparece hasta que existe al menos
// un canal. Por eso se crea antes de pedir el permiso.
export async function prepararCanal(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  await setNotificationChannelAsync(CANAL_PRESTAMOS, {
    name: NOMBRE_CANAL_PRESTAMOS,
    importance: AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: colores.primario,
  });
}