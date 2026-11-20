import { Redirect } from 'expo-router';

// URL vieja de la versión anterior de la app: redirige a la pestaña actual.
export default function ReservaVieja() {
  return <Redirect href="/reservas" />;
}