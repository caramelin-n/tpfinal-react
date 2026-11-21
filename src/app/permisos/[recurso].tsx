import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Boton } from '@/components/Boton';
import { EstadoVacio } from '@/components/EstadoVacio';
import {
  BENEFICIOS,
  NOMBRES_RECURSO,
  esRecurso,
} from '@/constants/permisos';
import {
  colores,
  espaciados,
  radios,
  tamanios,
} from '@/constants/tema';
import { usePermiso } from '@/hooks/usePermiso';
import { normalizarParametro } from '@/lib/parametros';
import type { Recurso } from '@/types/biblioteca';

export default function Permiso() {
  const { recurso } = useLocalSearchParams<{
    recurso?: string | string[];
  }>();
  const router = useRouter();
  const valor = normalizarParametro(recurso);
  const esValido = valor !== undefined && esRecurso(valor);
  const recursoSeguro: Recurso =
    valor !== undefined && esRecurso(valor) ? valor : 'camara';
  const permiso = usePermiso(recursoSeguro);

  const [pidiendo, setPidiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!esValido) {
    return (
      <>
        <Stack.Screen options={{ title: 'Permiso desconocido' }} />
        <View style={estilos.centrado}>
          <EstadoVacio
            titulo="Ese permiso no existe"
            mensaje={
              valor
                ? `«${valor}» no es un permiso de la app.`
                : 'No recibimos un permiso válido.'
            }
            accion={{
              titulo: 'Volver al catálogo',
              onPress: () => router.dismissAll(),
            }}
          />
        </View>
      </>
    );
  }

  const continuar = async () => {
    if (pidiendo) return;
    setPidiendo(true);
    setError(null);

    try {
      if (permiso.estado === 'bloqueado') {
        permiso.abrirAjustes();
        return;
      }

      if (permiso.estado === 'preguntable') {
        await permiso.pedir();
      }

      if (recursoSeguro === 'camara') {
        router.dismissAll();
        router.push('/escanear');
      } else {
        router.dismissAll();
        router.navigate('/reservas');
      }
    } catch {
      setError(
        'No pudimos abrir el permiso. Probá de nuevo o revisá Ajustes.',
      );
    } finally {
      setPidiendo(false);
    }
  };

  const bloqueado = permiso.estado === 'bloqueado';
  const cargando = permiso.estado === 'cargando';
  const tituloBoton = cargando
    ? 'Preparando…'
    : bloqueado
      ? 'Abrir Ajustes'
      : 'Continuar';

  return (
    <>
      <Stack.Screen
        options={{
          title: `Permiso de ${NOMBRES_RECURSO[recursoSeguro].toLowerCase()}`,
        }}
      />
      <ScrollView contentContainerStyle={estilos.contenedor}>
        <View style={estilos.tarjeta}>
          <Text style={estilos.titulo}>
            {NOMBRES_RECURSO[recursoSeguro]}
          </Text>
          <Text style={estilos.beneficio}>
            {BENEFICIOS[recursoSeguro]}
          </Text>
          <Text style={estilos.aclaracion}>
            Podés cambiar esta decisión cuando quieras desde Ajustes
            del sistema.
          </Text>
        </View>

        {cargando ? (
          <ActivityIndicator size="large" color={colores.primario} />
        ) : null}

        {bloqueado ? (
          <Text style={estilos.aviso}>
            El permiso está bloqueado. Habilitalo desde Ajustes y volvé
            a esta pantalla.
          </Text>
        ) : null}

        {error ? <Text style={estilos.error}>{error}</Text> : null}

        <Boton
          titulo={tituloBoton}
          onPress={() => void continuar()}
          deshabilitado={cargando || pidiendo}
        />
      </ScrollView>
    </>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: espaciados.lg,
    gap: espaciados.md,
    backgroundColor: colores.fondo,
  },
  centrado: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: colores.fondo,
  },
  tarjeta: {
    backgroundColor: colores.superficie,
    borderRadius: radios.md,
    borderWidth: 1,
    borderColor: colores.borde,
    padding: espaciados.lg,
    gap: espaciados.sm,
  },
  titulo: {
    fontSize: tamanios.titulo,
    fontWeight: '700',
    color: colores.texto,
  },
  beneficio: {
    fontSize: tamanios.cuerpo,
    color: colores.texto,
  },
  aclaracion: {
    fontSize: tamanios.pie,
    color: colores.textoSuave,
  },
  aviso: {
    fontSize: tamanios.cuerpo,
    color: colores.advertencia,
    backgroundColor: colores.advertenciaSuave,
    borderRadius: radios.sm,
    padding: espaciados.md,
  },
  error: {
    fontSize: tamanios.cuerpo,
    color: colores.error,
    textAlign: 'center',
  },
});