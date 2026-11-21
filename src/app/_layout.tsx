import { StatusBar } from 'expo-status-bar';

import { NavegacionRaiz } from '@/components/NavegacionRaiz';
import { BibliotecaProvider } from '@/context/BibliotecaContext';
import { configurarManejadorNotificaciones } from '@/lib/notificaciones';

// Ancla del Stack raíz: un deep link (por ejemplo /buscar) deja las tabs
// debajo en la pila, para que "atrás" vuelva a ellas.
export const unstable_settings = {
  anchor: '(tabs)',
};

configurarManejadorNotificaciones();

export default function LayoutRaiz() {
  return (
    <BibliotecaProvider>
      <NavegacionRaiz />
      <StatusBar style="dark" />
    </BibliotecaProvider>
  );
}