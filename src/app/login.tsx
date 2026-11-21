import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Boton } from '@/components/Boton';
import { CREDENCIALES_PERSONAL } from '@/constants/auth';
import {
  colores,
  espaciados,
  radios,
  tamanios,
  toqueMinimo,
} from '@/constants/tema';
import { useBiblioteca } from '@/hooks/useBiblioteca';

export default function Login() {
  const { iniciarSesion } = useBiblioteca();
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState<string | null>(null);

  const ingresar = () => {
    setError(null);

    if (!usuario.trim() || !clave) {
      setError('Completá el usuario y la clave.');
      return;
    }

    if (!iniciarSesion(usuario, clave)) {
      setError(
        'El usuario o la clave no son correctos. Revisá los datos e intentá de nuevo.',
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={estilos.pantalla}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={estilos.contenedor}
        keyboardShouldPersistTaps="handled"
      >
        <View style={estilos.tarjeta}>
          <Text style={estilos.titulo}>Ingreso del personal</Text>
          <Text style={estilos.ayuda}>
            Acceso para registrar las entregas de la biblioteca.
          </Text>

          <Text style={estilos.etiqueta}>Usuario</Text>
          <TextInput
            accessibilityLabel="Usuario del personal"
            value={usuario}
            onChangeText={setUsuario}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="personal"
            placeholderTextColor={colores.textoSuave}
            style={estilos.input}
          />

          <Text style={estilos.etiqueta}>Clave</Text>
          <TextInput
            accessibilityLabel="Clave del personal"
            value={clave}
            onChangeText={setClave}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="••••••"
            placeholderTextColor={colores.textoSuave}
            style={estilos.input}
          />

          {error ? <Text style={estilos.error}>{error}</Text> : null}

          <Boton titulo="Ingresar" onPress={ingresar} />

          <Text style={estilos.demo}>
            Demo: usuario {CREDENCIALES_PERSONAL.usuario} · clave{' '}
            {CREDENCIALES_PERSONAL.clave}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colores.fondo,
  },
  contenedor: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: espaciados.lg,
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
  ayuda: {
    fontSize: tamanios.pie,
    color: colores.textoSuave,
    marginBottom: espaciados.sm,
  },
  etiqueta: {
    fontSize: tamanios.pie,
    fontWeight: '600',
    color: colores.texto,
    marginTop: espaciados.sm,
  },
  input: {
    minHeight: toqueMinimo,
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: radios.md,
    paddingHorizontal: espaciados.md,
    fontSize: tamanios.cuerpo,
    color: colores.texto,
    backgroundColor: colores.fondo,
  },
  error: {
    fontSize: tamanios.pie,
    color: colores.error,
    backgroundColor: colores.errorSuave,
    borderRadius: radios.sm,
    padding: espaciados.sm,
  },
  demo: {
    fontSize: tamanios.pie,
    color: colores.textoSuave,
    textAlign: 'center',
    marginTop: espaciados.sm,
  },
});