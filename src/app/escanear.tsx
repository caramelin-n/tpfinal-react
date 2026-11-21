import Ionicons from '@expo/vector-icons/Ionicons';
import {
  CameraView,
  type BarcodeScanningResult,
  type BarcodeType,
} from 'expo-camera';
import {
  useFocusEffect,
  useIsFocused,
  useRouter,
} from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Boton } from '@/components/Boton';
import { EstadoCarga } from '@/components/EstadoCarga';
import {
  colores,
  espaciados,
  radios,
  tamanios,
  toqueMinimo,
} from '@/constants/tema';
import { usePermiso } from '@/hooks/usePermiso';
import { buscarLibro, esIsbnValido } from '@/lib/catalogo';

const AJUSTES_CODIGO: { barcodeTypes: BarcodeType[] } = {
  barcodeTypes: ['ean13'],
};

export default function Escanear() {
  const router = useRouter();
  const enfocado = useIsFocused();
  const permiso = usePermiso('camara');

  const [isbnManual, setIsbnManual] = useState('');
  const [aviso, setAviso] = useState<string | null>(null);
  const [errorCamara, setErrorCamara] = useState<string | null>(null);

  const navegandoRef = useRef(false);
  const ultimoDesconocidoRef = useRef<string | null>(null);

  const refrescar = permiso.refrescar;

  useFocusEffect(
    useCallback(() => {
      void refrescar();
    }, [refrescar]),
  );

  const abrirLibro = (isbn: string) => {
    navegandoRef.current = true;
    router.replace({
      pathname: '/libro/[isbn]',
      params: { isbn },
    });
  };

  const alEscanear = (resultado: BarcodeScanningResult) => {
    if (navegandoRef.current) return;

    const codigo = resultado.data;
    if (!esIsbnValido(codigo)) return;

    if (buscarLibro(codigo)) {
      abrirLibro(codigo);
      return;
    }

    if (ultimoDesconocidoRef.current === codigo) return;
    ultimoDesconocidoRef.current = codigo;
    setAviso(
      `No encontramos el ISBN ${codigo} en el catálogo. Seguí escaneando o escribilo a mano.`,
    );
  };

  const alCambiarManual = (valor: string) => {
    setIsbnManual(valor.replace(/\D/g, '').slice(0, 13));
    setAviso(null);
  };

  const abrirManual = () => {
    if (navegandoRef.current) return;

    if (!esIsbnValido(isbnManual)) {
      setAviso('El ISBN tiene que tener 13 dígitos.');
      return;
    }

    if (!buscarLibro(isbnManual)) {
      setAviso(`No encontramos el ISBN ${isbnManual} en el catálogo.`);
      return;
    }

    abrirLibro(isbnManual);
  };

  const abrirPreviaPermiso = () => {
    router.push('/permisos/camara');
  };

  return (
    <KeyboardAvoidingView
      style={estilos.pantalla}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {aviso ? (
        <View style={estilos.aviso}>
          <Ionicons
            name="alert-circle"
            size={tamanios.icono}
            color={colores.advertencia}
          />
          <Text style={estilos.avisoTexto}>{aviso}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar aviso"
            onPress={() => setAviso(null)}
            style={estilos.cerrarAviso}
          >
            <Ionicons
              name="close"
              size={tamanios.icono}
              color={colores.advertencia}
            />
          </Pressable>
        </View>
      ) : null}

      <View style={estilos.contenido}>
        {permiso.estado === 'cargando' ? (
          <EstadoCarga mensaje="Preparando la cámara…" />
        ) : null}

        {permiso.estado === 'preguntable' ? (
          <View style={estilos.bloque}>
            <Ionicons
              name="camera-outline"
              size={tamanios.iconoGrande}
              color={colores.primario}
            />
            <Text style={estilos.tituloBloque}>
              La cámara no está habilitada
            </Text>
            <Text style={estilos.textoBloque}>
              Usamos tu cámara para leer el código de barras de la
              contratapa. También podés escribir el ISBN a mano.
            </Text>
            <Boton
              titulo="Habilitar cámara"
              onPress={abrirPreviaPermiso}
            />
          </View>
        ) : null}

        {permiso.estado === 'bloqueado' ? (
          <View style={estilos.bloque}>
            <Ionicons
              name="lock-closed-outline"
              size={tamanios.iconoGrande}
              color={colores.advertencia}
            />
            <Text style={estilos.tituloBloque}>
              La cámara está bloqueada
            </Text>
            <Text style={estilos.textoBloque}>
              Podés habilitarla desde Ajustes del sistema o escribir el
              ISBN a mano.
            </Text>
            <Boton
              titulo="Abrir Ajustes"
              onPress={permiso.abrirAjustes}
            />
          </View>
        ) : null}

        {permiso.estado === 'concedido' && errorCamara ? (
          <View style={estilos.bloque}>
            <Ionicons
              name="warning-outline"
              size={tamanios.iconoGrande}
              color={colores.error}
            />
            <Text style={estilos.tituloBloque}>
              No pudimos iniciar la cámara
            </Text>
            <Text style={estilos.textoBloque}>{errorCamara}</Text>
            <Boton
              titulo="Reintentar"
              onPress={() => setErrorCamara(null)}
            />
          </View>
        ) : null}

        {permiso.estado === 'concedido' &&
        !errorCamara &&
        enfocado ? (
          <View style={estilos.zonaCamara}>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={AJUSTES_CODIGO}
              onBarcodeScanned={alEscanear}
              onMountError={() =>
                setErrorCamara(
                  'Probá de nuevo o escribí el ISBN a mano.',
                )
              }
            />
            <View style={estilos.guia}>
              <Text style={estilos.guiaTexto}>
                Apuntá al código de barras de la contratapa
              </Text>
            </View>
          </View>
        ) : null}

        {permiso.estado === 'concedido' && !enfocado ? (
          <View style={estilos.bloque}>
            <Text style={estilos.textoBloque}>
              La cámara está en pausa.
            </Text>
          </View>
        ) : null}
      </View>

      <View style={estilos.panelManual}>
        <Text style={estilos.tituloManual}>¿No podés escanear?</Text>
        <Text style={estilos.textoManual}>
          Escribí el ISBN de 13 dígitos de la contratapa.
        </Text>
        <View style={estilos.filaManual}>
          <TextInput
            accessibilityLabel="ISBN del libro"
            value={isbnManual}
            onChangeText={alCambiarManual}
            placeholder="978..."
            placeholderTextColor={colores.textoSuave}
            keyboardType="number-pad"
            maxLength={13}
            style={estilos.inputManual}
          />
          <Boton
            titulo="Abrir"
            onPress={abrirManual}
            estilo={estilos.botonManual}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colores.fondo,
  },
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciados.sm,
    backgroundColor: colores.advertenciaSuave,
    borderBottomWidth: 1,
    borderBottomColor: colores.advertencia,
    paddingHorizontal: espaciados.md,
    paddingVertical: espaciados.sm,
  },
  avisoTexto: {
    flex: 1,
    fontSize: tamanios.pie,
    color: colores.advertencia,
  },
  cerrarAviso: {
    minHeight: toqueMinimo,
    minWidth: toqueMinimo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contenido: {
    flex: 1,
  },
  zonaCamara: {
    flex: 1,
    backgroundColor: colores.sombra,
  },
  guia: {
    position: 'absolute',
    left: espaciados.md,
    right: espaciados.md,
    bottom: espaciados.md,
    backgroundColor: colores.overlay,
    borderRadius: radios.md,
    padding: espaciados.md,
  },
  guiaTexto: {
    fontSize: tamanios.cuerpo,
    color: colores.blanco,
    textAlign: 'center',
  },
  bloque: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: espaciados.lg,
    gap: espaciados.md,
  },
  tituloBloque: {
    fontSize: tamanios.subtitulo,
    fontWeight: '600',
    color: colores.texto,
    textAlign: 'center',
  },
  textoBloque: {
    fontSize: tamanios.cuerpo,
    color: colores.textoSuave,
    textAlign: 'center',
  },
  panelManual: {
    backgroundColor: colores.superficie,
    borderTopWidth: 1,
    borderTopColor: colores.borde,
    padding: espaciados.md,
    gap: espaciados.sm,
  },
  tituloManual: {
    fontSize: tamanios.cuerpo,
    fontWeight: '600',
    color: colores.texto,
  },
  textoManual: {
    fontSize: tamanios.pie,
    color: colores.textoSuave,
  },
  filaManual: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciados.sm,
  },
  inputManual: {
    flex: 1,
    minHeight: toqueMinimo,
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: radios.md,
    paddingHorizontal: espaciados.md,
    fontSize: tamanios.cuerpo,
    color: colores.texto,
    backgroundColor: colores.fondo,
  },
  botonManual: {
    minWidth: 96,
  },
});