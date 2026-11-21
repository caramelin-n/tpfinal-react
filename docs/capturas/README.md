# Capturas para la entrega

## Estado

Estas capturas se generaron desde la **versión web** de la app (`npx expo start --web`) para dejar una vista previa en el repositorio. La versión web no reproduce el hardware ni los diálogos del sistema operativo, así que las tomas de cámara nativa y de notificación deben completarse en **Expo Go en un teléfono real**.

### Capturas web ya incluidas

- [x] `01-catalogo-cargando.png`
- [x] `02-catalogo-error.png`
- [x] `03-catalogo-datos.png` (con “Vistos recientemente”)
- [x] `04-buscador-resultados.png`
- [x] `05-buscador-vacio.png`
- [x] `06-detalle.png`
- [x] `07-detalle-inexistente.png`
- [x] `08-reserva-con-ejemplares.png`
- [x] `09-reserva-sin-ejemplares.png`
- [x] `10-permisos-camara.png`
- [x] `11-escaner-preguntable.png`
- [x] `15-mostrador-antes.png`
- [x] `16-mostrador-despues.png`
- [x] `17-aviso-interno.png` (alternativa a la notificación cuando el permiso está denegado)
- [x] `19-login.png`
- [x] `20-404.png`
- [x] `21-mis-reservas-prestamo.png`

### Capturas que faltan en un teléfono real

- [ ] `12-escaner-bloqueado.png` — después de denegar la cámara dos veces (Android) o una vez (iOS), con el botón **Abrir Ajustes**.
- [ ] `13-escaner-concedido.png` — cámara real apuntando al código de barras de un libro.
- [ ] `14-notificacion-recibida.png` — notificación local a los 15 segundos después de activar **Recordarme**.
- [ ] `22-escaner-cargando.png` — el estado “Preparando la cámara…”.

### Verificación

- [ ] `23-lint.png` — captura o texto de `npx expo lint`.
- [ ] `24-tsc.png` — captura o texto de `npx tsc --noEmit`.

La salida de `lint` y `tsc` ya está pegada en el `README.md`; las capturas son opcionales si el texto está en el README.

## Cómo tomar las que faltan

1. Abrí la app en Expo Go en un teléfono real.
2. Para el escáner:
   - Denegá la cámara y capturá el estado bloqueado.
   - Habilitá la cámara y apuntá al código de barras de *Rayuela* (`9788420414706`) o *El túnel* (`9788432248368`); capturá la vista de la cámara antes de que navegue.
3. Para la notificación:
   - Reservá un libro, activá **Recordarme**, esperá 15 segundos y capturá la notificación en la pantalla o en la bandeja del teléfono.
4. Guardá las imágenes con los nombres de la lista de arriba.

En Expo Go los permisos son de Expo Go. Si querés ver el recorrido desde cero, revocá el permiso de cámara de Expo Go en los ajustes del teléfono.
