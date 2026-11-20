import type { PermissionResponse } from 'expo';
import {
  getPermissionsAsync,
  IosAuthorizationStatus,
  requestPermissionsAsync,
  type NotificationPermissionsStatus,
} from 'expo-notifications';
import { useCameraPermissions } from 'expo-camera';
import { useCallback, useEffect, useState } from 'react';
import { Linking, Platform } from 'react-native';

import { prepararCanal } from '@/lib/notificaciones';
import type { Recurso } from '@/types/biblioteca';
import { useRevisarAlVolver } from './useRevisarAlVolver';

export type EstadoPermiso =
  | 'cargando'
  | 'concedido'
  | 'preguntable'
  | 'bloqueado';

type Permiso = PermissionResponse | NotificationPermissionsStatus | null;

function estaConcedido(permiso: Permiso): boolean {
  if (!permiso) return false;
  if (permiso.granted) return true;
  if (
    'ios' in permiso &&
    permiso.ios?.status === IosAuthorizationStatus.PROVISIONAL
  ) {
    return true;
  }
  return false;
}

function calcularEstado(permiso: Permiso): EstadoPermiso {
  if (!permiso) return 'cargando';
  if (estaConcedido(permiso)) return 'concedido';
  return permiso.canAskAgain ? 'preguntable' : 'bloqueado';
}

export function usePermiso(recurso: Recurso) {
  const [camara, pedirCamara, consultarCamara] = useCameraPermissions();
  const [notificaciones, setNotificaciones] =
    useState<NotificationPermissionsStatus | null>(null);

  const consultar = useCallback(async () => {
    if (recurso === 'camara') {
      await consultarCamara();
      return;
    }
    const estado = await getPermissionsAsync();
    setNotificaciones(estado);
  }, [recurso, consultarCamara]);

  useEffect(() => {
    if (recurso !== 'notificaciones') return;

    let cancelado = false;
    void (async () => {
      const estado = await getPermissionsAsync();
      if (!cancelado) {
        setNotificaciones(estado);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [recurso]);

  const revisarAlVolver = useCallback(() => {
    void consultar();
  }, [consultar]);

  useRevisarAlVolver(revisarAlVolver);

  const pedir = useCallback(async () => {
    if (recurso === 'camara') {
      const respuesta = await pedirCamara();
      await consultarCamara();
      return respuesta;
    }

    if (Platform.OS === 'android') {
      await prepararCanal();
    }

    const respuesta = await requestPermissionsAsync();
    setNotificaciones(respuesta);
    return respuesta;
  }, [recurso, pedirCamara, consultarCamara]);

  const abrirAjustes = useCallback(() => {
    void Linking.openSettings();
  }, []);

  const permiso = recurso === 'camara' ? camara : notificaciones;

  return {
    estado: calcularEstado(permiso),
    pedir,
    refrescar: consultar,
    abrirAjustes,
  };
}