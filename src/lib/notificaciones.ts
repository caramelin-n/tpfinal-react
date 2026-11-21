import {
  AndroidImportance,
  cancelScheduledNotificationAsync,
  getPermissionsAsync,
  IosAuthorizationStatus,
  requestPermissionsAsync,
  SchedulableTriggerInputTypes,
  scheduleNotificationAsync,
  setNotificationChannelAsync,
  setNotificationHandler,
  type NotificationPermissionsStatus,
} from 'expo-notifications';
import { Platform } from 'react-native';

import { colores } from '@/constants/tema';

export const CANAL_PRESTAMOS = 'prestamos';
export const NOMBRE_CANAL_PRESTAMOS = 'Recordatorios de préstamos';
export const SEGUNDOS_RECORDATORIO = 15;

function estaConcedido(permiso: NotificationPermissionsStatus): boolean {
  return (
    permiso.granted ||
    permiso.ios?.status === IosAuthorizationStatus.PROVISIONAL
  );
}

// Muestra las notificaciones aunque la app esté en primer plano.
export function configurarManejadorNotificaciones(): void {
  setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

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

export async function permisoNotificacionesConcedido(): Promise<boolean> {
  const permiso = await getPermissionsAsync();
  return estaConcedido(permiso);
}

export async function pedirPermisoNotificaciones(): Promise<boolean> {
  await prepararCanal();

  const actual = await getPermissionsAsync();
  if (estaConcedido(actual)) {
    return true;
  }

  const respuesta = await requestPermissionsAsync();
  return estaConcedido(respuesta);
}

export async function programarRecordatorio(
  titulo: string,
  isbn: string,
): Promise<string> {
  return scheduleNotificationAsync({
    content: {
      title: 'Recordatorio de devolución',
      body: `Tenés que devolver «${titulo}».`,
      data: { isbn, url: '/reservas' },
    },
    trigger: {
      type: SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: SEGUNDOS_RECORDATORIO,
      channelId: CANAL_PRESTAMOS,
    },
  });
}

export async function cancelarRecordatorio(id: string): Promise<void> {
  await cancelScheduledNotificationAsync(id);
}

export async function notificarTurno(
  titulo: string,
  isbn: string,
): Promise<void> {
  await scheduleNotificationAsync({
    content: {
      title: 'Tu reserva está lista',
      body: `«${titulo}» te espera en el mostrador.`,
      data: { isbn, url: '/reservas' },
    },
    trigger: null,
  });
}