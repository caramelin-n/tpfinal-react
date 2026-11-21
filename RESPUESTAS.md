# RESPUESTAS.md — TP4 Biblioteca IPF

Estas respuestas son sobre mi app. Cito los archivos y las líneas de la versión entregada, y pego los fragmentos importantes para que se vea de dónde sale cada conclusión.

---

## Parte B · Estado, efectos y renderizado

### B1. El ciclo de vida de `useLibros`

**a) Render por render desde que se monta el Catálogo**

El hook está en `src/hooks/useLibros.ts`. Arranca con estos estados (líneas 10-13):

```ts
const [libros, setLibros] = useState<Libro[]>([]);
const [cargando, setCargando] = useState(true);
const [error, setError] = useState<string | null>(null);
const [intento, setIntento] = useState(0);
```

1. **Render inicial:** `libros = []`, `cargando = true`, `error = null`. El Catálogo (`src/app/(tabs)/(catalogo)/index.tsx`, líneas 23-25) devuelve `<EstadoCarga mensaje="Cargando el catálogo…" />`.
2. Después del primer render corre el efecto (líneas 15-41). Crea `cancelado = false` y llama a `cargar()`, que espera los 800 ms de `obtenerLibros`.
3. **Si la promesa se resuelve:** `setLibros(datos)` y `setCargando(false)` se ejecutan dentro del mismo tick asíncrono. React 19 agrupa las dos actualizaciones en **un solo render**. Ese segundo render tiene `libros` con los 18 libros, `cargando = false` y `error = null`; la pantalla pasa a la `FlatList`.
4. **Si falla:** el `catch` hace `setLibros([])`, `setError(MENSAJE_ERROR)` y el `finally` hace `setCargando(false)`. También se agrupan en un render. Ese segundo render muestra `<EstadoError>` con el título “No pudimos cargar el catálogo”, el mensaje y el botón **Reintentar**.

Entonces, la primera carga son **2 renders**: el inicial y el de la respuesta (éxito o error). No hay un render extra por `setCargando(true)` porque el estado inicial ya vale `true` y no lo vuelvo a setear al comenzar el efecto.

**Al tocar Reintentar** (`reintentar`, líneas 43-47):

```ts
setError(null);
setCargando(true);
setIntento((anterior) => anterior + 1);
```

React agrupa los tres cambios en **un render** (el tercero), que muestra el spinner otra vez. El cambio de `intento` hace que el efecto se vuelva a ejecutar; a los 800 ms llega la respuesta y hay **un render más** (el cuarto) con los datos o con el error. Cada reintento agrega 2 renders.

> Nota: si en desarrollo React llegara a duplicar el efecto por StrictMode, se vería un pedido extra; el conteo de arriba es el de la app en uso normal. Lo comprobé mirando la pantalla y con un contador temporal de renders, que después saqué.

**b) ¿Se desmonta el Catálogo al cambiar de tab o al abrir un detalle?**

No. El Catálogo está en la tab `(catalogo)` dentro de `(tabs)`. Las tabs de React Navigation mantienen montadas las pantallas al cambiar de pestaña (no uso `unmountOnBlur`). Al tocar un libro hago `router.push` dentro del Stack de la tab Catálogo:

```ts
// src/app/(tabs)/(catalogo)/index.tsx, líneas 19-21
const abrirLibro = (isbn: string) => {
  router.push({ pathname: '/libro/[isbn]', params: { isbn } });
};
```

El detalle se apila encima y el Catálogo sigue montado debajo. Por eso su efecto no se limpia al cambiar de tab ni al abrir un detalle.

La limpieza que escribí es:

```ts
// src/hooks/useLibros.ts, líneas 38-40
return () => {
  cancelado = true;
};
```

Se ejecuta en dos situaciones reales:

1. **Cuando cambia `intento`**, es decir, cuando la persona toca **Reintentar**. React ejecuta la limpieza del efecto anterior antes de correr el nuevo.
2. **Cuando el Catálogo se desmonta de verdad:** al recargar la app, al cerrarla, en un fast refresh, o si la navegación se resetea por un cambio de layout. No pasa al cambiar de tab ni al abrir el detalle.

Lo comprobé con un `console.log` temporal dentro de la limpieza, lo miré en la consola de Expo y después lo borré (la entrega no tiene `console.log`). El log aparecía al tocar Reintentar y al recargar, no al cambiar de tab ni al abrir un libro.

**c) ¿Por qué no se puede pasar una función `async` directamente a `useEffect`?**

Porque `useEffect` espera que la función devuelva `void` o una función de limpieza. Una función `async` siempre devuelve una `Promise`; React guardaría esa promesa como si fuera la limpieza y, al desmontar, intentaría llamarla como función. Además, el `return` de la limpieza quedaría dentro de la promesa, no en el efecto.

Lo resolví con una función `async` interna y llamándola con `void`, y devolviendo la limpieza síncrona:

```ts
// src/hooks/useLibros.ts, líneas 18-40
const cargar = async () => {
  try {
    const datos = await obtenerLibros();
    if (!cancelado) setLibros(datos);
  } catch {
    if (!cancelado) {
      setLibros([]);
      setError(MENSAJE_ERROR);
    }
  } finally {
    if (!cancelado) setCargando(false);
  }
};

void cargar();

return () => {
  cancelado = true;
};
```

El `void` deja claro que la promesa se maneja aparte. La bandera `cancelado` evita que una respuesta vieja actualice el estado después de un desmontaje o de un reintento.

**d) ¿Cómo implementé `reintentar`?**

Con un contador `intento` en el estado (línea 13) y un `useCallback` que lo incrementa (líneas 43-47). El efecto tiene `[intento]` en el array de dependencias (línea 41). Al cambiar el contador, React ejecuta la limpieza del efecto anterior y vuelve a ejecutar el efecto, que llama otra vez a `obtenerLibros()`.

```ts
const reintentar = useCallback(() => {
  setError(null);
  setCargando(true);
  setIntento((anterior) => anterior + 1);
}, []);
```

Elegí `intento` y no `cargando`, `error` o `libros` porque esos estados los escribe el propio efecto. Si estuvieran en el array, el efecto se volvería a ejecutar por su propia actualización y entraría en un bucle. `intento` solo cambia cuando la persona pide reintentar; es como la “versión” del pedido. También seteo `cargando = true` y `error = null` en `reintentar` para que el spinner aparezca en el mismo render del toque, antes de que corra el efecto.

---

### B2. La condición de carrera del buscador

En `src/app/buscar.tsx`, la consulta sale de la URL:

```ts
// líneas 37-38
const qUrl = normalizarParametro(q) ?? '';
const consulta = qUrl.trim();
```

El efecto depende de `[qUrl, intento]` (línea 79). El input usa un estado local `texto` para no parpadear; cada cambio actualiza la URL con `router.setParams`:

```ts
// líneas 81-87
const alCambiarTexto = (nuevo: string) => {
  setTexto(nuevo);
  router.setParams({ q: nuevo });
  setError(null);
  setResultados([]);
  setCargando(nuevo.trim().length > 0);
};
```

El efecto crea una bandera local y la pone en `true` en la limpieza:

```ts
// líneas 46-79 (resumido)
useEffect(() => {
  let cancelado = false;
  const textoBusqueda = qUrl.trim();

  const buscar = async () => {
    const datos = await buscarLibros(textoBusqueda);
    if (!cancelado) setResultados(datos);
    // ...
  };

  void buscar();

  return () => {
    cancelado = true;
  };
}, [qUrl, intento]);
```

**Tabla:**

| Momento | Qué pasa | Sin limpieza: qué se ve | Con mi código: qué se ve |
|---|---|---|---|
| t = 0 ms | Escribe “bor” → se pide `buscarLibros("bor")`, que tarda 1.400 ms. | “Buscando…” (el handler limpió los resultados y puso `cargando`). | “Buscando…” (mismo handler). |
| t = 200 ms | Escribe “borges” → se pide `buscarLibros("borges")`, que tarda 300 ms. | Siguen los dos pedidos en vuelo; se sigue viendo “Buscando…”. | La limpieza del efecto de “bor” pone `cancelado = true`; arranca el pedido de “borges”; se sigue viendo “Buscando…”. |
| t = 500 ms | Llega la respuesta de “borges”. | Se muestran los resultados de “borges”. | Se muestran los resultados de “borges”. El pedido de “bor” sigue en vuelo, pero su bandera ya está en `true`. |
| t = 1.400 ms | Llega la respuesta de “bor”. | Los resultados de “bor” **pisan** a los de “borges”; se ve la búsqueda vieja. | La respuesta de “bor” se ignora; se siguen viendo los resultados de “borges”. |

**a)** La limpieza no cancela la promesa ni la red: marca `cancelado = true` para esa ejecución del efecto. La promesa vieja sigue viajando y resuelve, pero cuando llega, `if (!cancelado)` es falso y no llama a `setResultados`/`setError`/`setCargando`. Se ejecuta cuando cambia `qUrl` (antes de que corra el efecto nuevo) y cuando la pantalla se desmonta. Por eso la respuesta vieja se descarta.

**b)** La propuesta del compañero no funciona como él cree. La función del `.then()` captura la variable `q` del render en el que se creó (clausura de JavaScript). Si el efecto se ejecutó para `q = "bor"`, esa función ve `q = "bor"` y `texto = "bor"`: la comparación da siempre `true`, aunque la persona ya haya escrito “borges”. Las clausuras guardan el valor del momento en que se creó la función; no leen el estado “actual” por arte de magia. Para que funcione habría que comparar contra una referencia mutable (`useRef`) o contra un id de pedido, no contra la variable del closure. La bandera `cancelado` de cada ejecución del efecto es más simple y no depende de valores que cambian.

**c)** Mientras la persona escribe, cada `onChangeText` llama a `router.setParams({ q: nuevo })`. Eso actualiza los parámetros de la misma ruta `/buscar`: la URL cambia, pero no se apila una pantalla nueva ni se agrega una entrada de historial. El botón atrás sale de `/buscar` a la pantalla anterior (el catálogo/tabs), no recorre letra por letra.

Si usara `router.push`, cada tecla apilaría un `/buscar?q=...` nuevo. El atrás tendría que deshacer todas las letras y habría muchas pantallas iguales en la pila. Por eso la consigna pide `setParams` y no `push`.

Un detalle: el efecto depende de `qUrl` (el valor crudo de la URL) y hace el `trim` adentro. Si dependiera de `consulta` (el texto ya recortado), escribir un espacio al final no cambiaría la dependencia: la pantalla podría quedar en “Buscando…” para siempre. Con `qUrl` como dependencia, cualquier cambio real de la URL vuelve a disparar la búsqueda.

---

### B3. Mutar o reemplazar

El fragmento del enunciado:

```tsx
const [espera] = useState(() => new Cola<string>());

function anotarme() {
  espera.encolar('Ana');
}

return (
  <>
    <Text>Personas en espera: {espera.tamanio}</Text>
    <Button title="Anotarme" onPress={anotarme} />
  </>
);
```

**a)** La persona toca “Anotarme” tres veces y el texto sigue mostrando **0**. `espera.encolar('Ana')` muta el mismo objeto `Cola` que está guardado en el estado, pero nunca se llama al setter de `useState` (no hay `setEspera(...)`). React no se entera de la mutación y no vuelve a renderizar; el `Text` sigue mostrando el valor del último render, que era 0.

**b)** Cuando la persona escribe en un `TextInput` controlado de la misma pantalla, ese cambio de estado sí provoca un render. En ese render se vuelve a leer `espera.tamanio`, que ahora vale 3 porque las tres mutaciones ocurrieron; por eso el número “salta” a 3 sin haber tocado el botón. Es peor que un error que aparece siempre porque es intermitente: en una demo o en una prueba puede no aparecer, la pantalla y los datos quedan desincronizados hasta el próximo render, y es difícil de reproducir. Un error consistente se ve y se arregla; uno ocasional puede llegar a la entrega.

**c)** En mi Context (`src/context/BibliotecaContext.tsx`) las esperas son un `Record<string, Cola<string>>` (líneas 67-69). Cuando se reserva un libro sin ejemplares, **no muto la cola del estado**:

```ts
// líneas 135-141
const colaActual = esperas[isbn] ?? new Cola<string>();
const nuevaCola = new Cola<string>(colaActual.aArray());
nuevaCola.encolar(YO);
setEsperas((anteriores) => ({ ...anteriores, [isbn]: nuevaCola }));
return { tipo: 'espera', posicion: nuevaCola.tamanio };
```

`aArray()` devuelve una copia (en `Cola.ts`, líneas 44-46). La nueva `Cola` es otro objeto; `setEsperas` recibe un objeto nuevo y eso dispara el render. En `entregarSiguiente` hago lo mismo (líneas 152-177): copio, desencolo y reemplazo; si la cola queda vacía, borro la clave del registro. Para recientes uso la misma idea con `Pila` en `registrarReciente` (líneas 180-189): `new Pila(anterior.aArray())`, `apilar`, y devuelvo la pila nueva.

**Comparación con otras alternativas:**

- **Crear una cola nueva a partir de la anterior (lo que hice):** ventaja, el estado queda inmutable y React ve el cambio de referencia; conservo la clase, `#items`, `tamanio` y el orden FIFO. Costo, copiar la cola en cada operación (O(n)); como las colas tienen pocas personas, es despreciable.
- **Contador de versión:** mutar la cola y hacer `setVersion(v => v + 1)`. Ventaja, no se copia. Costo, el estado real queda mutado y el render depende de un contador externo; es fácil olvidarse de incrementarlo y, con render concurrente o StrictMode, el estado puede leerse inconsistente. No lo elegí.
- **`useReducer`:** las acciones devuelven un estado nuevo. Ventaja, las transiciones son atómicas y testeables; es una buena opción si la lógica creciera. Costo, más código y más ceremonia para una app de este tamaño. Con los `useState` funcionales que uso ya logro el reemplazo.
- **Array plano en el estado (`[...pila, x]`, `slice`):** ventaja, es lo más idiomático en React y fácil de persistir. Costo, pierdo la clase `Pila`/`Cola`, el campo privado `#items` y la ejercitación del TP2. La consigna pide usar las clases; las uso copiándolas para que el estado sea inmutable.

---

### B4. ¿Dónde vive cada dato?

| Dato | Dónde vive en mi app | Por qué ahí y no en otro lugar |
|---|---|---|
| Texto del buscador | En la URL, parámetro `q` de `/buscar`; el input tiene un espejo local `texto` para no parpadear. | La URL es la fuente de verdad de la búsqueda: se puede compartir, deep-linkear y el efecto depende de `qUrl`. El espejo local es solo para el `TextInput`; cada cambio actualiza la URL con `setParams`. No lo pondría en el Context porque es un dato de esa pantalla. |
| Préstamos y reservas | En el Context (`prestamos`). | Los necesitan el detalle, la pantalla Mis reservas, el mostrador y el catálogo (para la disponibilidad). Si vivieran en una sola pantalla, las demás no los verían. No van en la URL porque son varios objetos y cambian con las acciones. |
| Listas de espera | En el Context, como `Record<ISBN, Cola<string>>`. | El orden de atención lo necesitan el detalle (posición), Mis reservas y el mostrador. La `Cola` mantiene el orden FIFO y el Context lo comparte. No lo guardaría en cada libro porque el tipo `Libro` entregado no tiene ese campo. |
| Vistos recientemente | En el Context, como `Pila<Libro>`. | Lo usan el catálogo (para mostrar los 3) y el detalle (para hacer el push). La `Pila` guarda el orden de visita; el Context lo mantiene entre tabs. No es un dato de URL ni del sistema operativo. |
| Sesión del personal | En el Context (`sesion: string | null`). | La necesita el layout raíz para `Stack.Protected`, y también el header (link Personal), el login y el mostrador. Si fuera un estado local de una pantalla, las rutas protegidas no podrían reaccionar. |
| Ejemplares disponibles de un libro | Se calcula en el Context: `libro.ejemplares - préstamos activos del ISBN`. | No lo guardo duplicado. El total inicial está en `Libro.ejemplares`; los préstamos están en el estado. Guardar un `disponibles` aparte obligaría a actualizar dos lugares en cada préstamo y devolución, y se podría desincronizar. |
| Estado del permiso de cámara | En el sistema operativo y en el hook `usePermiso` / `useCameraPermissions`. | Es un estado del dispositivo, no de la biblioteca. Solo lo necesitan la pantalla previa y el escáner; puede cambiar desde Ajustes sin que la app lo sepa, por eso se consulta y se refresca. No lo pondría en el Context. |
| Identificador de la notificación programada | En el Context, dentro del préstamo (`notificacionId`). | Lo necesito para cancelar la notificación al desactivar “Recordarme” o al devolver el libro. La programación real vive en el sistema operativo; en el estado guardo solo el id que devuelve `scheduleNotificationAsync`. |

**Cuando cambia el `value` del Context**, se vuelven a renderizar todos los componentes que consumen `useBiblioteca`: el Catálogo (`src/app/(tabs)/(catalogo)/index.tsx`), el Detalle, Mis reservas, el Mostrador, `BotonPersonal` y `NavegacionRaiz` (que lee `sesion`). No hace falta que usen todos los campos: React re-renderiza el consumidor completo cuando cambia la identidad del valor. El `useMemo` del provider (líneas 238-277) evita crear un objeto nuevo si no cambió ninguna dependencia, pero cualquier cambio de estado cambia `prestamos`, `esperas`, etc., y por lo tanto el valor.

**¿El Catálogo se re-renderiza al activar un recordatorio en otra pestaña?** Sí. El Catálogo usa `recientes` y `ejemplaresDisponibles`, pero consume el mismo Context. Activar “Recordarme” cambia `prestamos` (el `recordarme` y el `notificacionId` del préstamo), cambia el `value` y el Catálogo se vuelve a renderizar aunque no use esos campos.

**¿Qué podría hacer para evitarlo?** Separar el Context en varios (`RecientesContext`, `PrestamosContext`, `SesionContext`) para que cada pantalla consuma solo lo que necesita; o usar selectores con una librería como `use-context-selector`; o pasar los datos por props desde un contenedor. **¿Vale la pena en esta app?** No. Hay 18 libros y las listas son chicas; el render es barato y separar contextos agrega archivos, providers y complejidad. Lo dejaría como mejora si la app creciera o si el profiler mostrara un problema real.

---

## Parte C · Navegación y rutas

### C1. La pila en mi app

Las pilas de mi app son:

- **Stack raíz** (`src/components/NavegacionRaiz.tsx`): contiene `(tabs)`, `buscar`, `escanear`, los modales, `login`, `mostrador` y `+not-found`.
- **Stack de la tab Catálogo** (`src/app/(tabs)/(catalogo)/_layout.tsx`): contiene `index` y `libro/[isbn]`.
- **Tabs** (`src/app/(tabs)/_layout.tsx`): Catálogo y Mis reservas.

| # | Acción | Pilas resultantes |
|---|---|---|
| 1 | Abre la app. | Raíz: `[(tabs)]`. Tabs: **Catálogo** activa. Stack Catálogo: `[index]`. |
| 2 | Toca un libro del Catálogo. | Raíz: `[(tabs)]`. Stack Catálogo: `[index, libro/[isbn]]`. Tabs: Catálogo. |
| 3 | Toca “Reservar”. | Raíz: `[(tabs), reservar/[isbn] (modal)]`. Debajo, Stack Catálogo: `[index, libro/[isbn]]`. Tabs: Catálogo. |
| 4 | Toca “Confirmar”. | `router.dismissTo('/reservas')` cierra el modal. Raíz: `[(tabs)]`. Tabs: **Mis reservas** activa. Stack Catálogo conserva `[index, libro/[isbn]]`. La confirmación ya no está. |
| 5 | Toca atrás (Android). | La tab vuelve a la primera ruta por el `backBehavior` por defecto (`firstRoute`): Tabs: **Catálogo** activa. Su stack sigue `[index, libro/[isbn]]`, así que se ve el detalle. Raíz: `[(tabs)]`. |
| 6 | Toca la tab Catálogo. | La tab ya está activa; el tab press no resetea el stack (no configuré `popToTopOnBlur`). Se sigue viendo el detalle. Raíz: `[(tabs)]`, Stack Catálogo: `[index, libro/[isbn]]`. |

**a) ¿Qué método usé en el paso 4?**

En `src/app/reservar/[isbn].tsx`, después de `reservar(...)` (líneas 100-104):

```ts
if (resultado.tipo === 'prestamo' || resultado.tipo === 'espera') {
  router.dismissTo('/reservas');
  return;
}
```

Usé **`router.dismissTo('/reservas')`**.

- Con **`push`**, el modal de confirmación seguiría en la pila y `/reservas` se apilaría encima: al tocar atrás volvería a la confirmación. Eso es justo lo que la consigna prohíbe.
- Con **`replace`**, se reemplazaría la pantalla actual (el modal) por `/reservas`, pero no expresa “cerrar el modal y volver a la tab”; además, como `/reservas` vive dentro de `(tabs)`, la navegación anidada queda menos clara y la presentación de modal puede quedar en un estado raro.
- Con **`dismissTo`**, se desapila hasta la ruta indicada: cierra el modal, vuelve a las tabs y activa Mis reservas, dejando el Catálogo (con su detalle) debajo. La confirmación desaparece del historial.

**b) En el paso 6, ¿qué pantalla ve la persona?**

Ve el **detalle**, no el índice del Catálogo. La tab conserva su Stack y el toque sobre una tab que ya está activa no hace pop-to-top por sí solo; no configuré `popToTopOnBlur` en `(tabs)/_layout.tsx`. El detalle sigue mostrando el estado actualizado del libro (“Ya tenés este libro” o “Ya estás en la lista”), así que me parece un comportamiento correcto para esta app: después de reservar, volver al libro que estabas mirando tiene sentido.

Si quisiera que al tocar la tab se viera el índice, tendría dos opciones: poner `popToTopOnBlur: true` en la tab Catálogo (pero perdería el detalle al cambiar de tab) o llamar a `router.popToTop()` al confirmar. No lo hice porque prefiero conservar el detalle. Es una decisión de UX, no un error.

---

### C2. El escáner que dispara de más

**a) ¿Qué pasaría con `router.push` sin protección?**

`onBarcodeScanned` se ejecuta muchas veces por segundo mientras el código sigue frente a la cámara. Sin ninguna protección, cada evento llamaría a `router.push('/libro/[isbn]')` y se apilarían decenas de pantallas de detalle. Relacionado con la cola de acciones del TP2: las acciones de navegación se encolan y se procesan, pero no se descartan; cada `PUSH` agrega una pantalla a la pila. El resultado es una pila enorme, el atrás tendría que sacar decenas de pantallas y la app se pondría lenta. No es que se pierda una acción: se ejecutan todas y el efecto se multiplica.

**b) ¿Usé `useState` o `useRef`?**

Usé **`useRef`** en `src/app/escanear.tsx` (líneas 48-49):

```ts
const navegandoRef = useRef(false);
const ultimoDesconocidoRef = useRef<string | null>(null);
```

Un `useState` puesto en `true` en el primer escaneo no alcanza para frenar los siguientes llamados. El callback de `onBarcodeScanned` es una clausura del render actual; los eventos que llegan antes de que React re-renderice siguen viendo `escaneado === false` y vuelven a ejecutar `router.push`. React agrupa el `setState` y recién después re-renderiza, pero la cámara no espera. `useRef.current` cambia en el acto y todos los callbacks comparten la misma referencia, así que el segundo evento ya ve `true`.

**c) ¿Por qué conviene `replace` para ir del escáner al detalle?**

Porque reemplaza la pantalla del escáner por el detalle: el escáner sale de la pila. Al tocar atrás desde el detalle se vuelve al catálogo/tabs, no a la cámara. Con `push`, el escáner quedaría debajo del detalle; el atrás volvería a la cámara, que podría volver a escanear el mismo código y apilar otro detalle. Además, `replace` evita tener una pantalla de escáner muerta en el historial.

En el código:

```ts
// src/app/escanear.tsx, líneas 59-65
const abrirLibro = (isbn: string) => {
  navegandoRef.current = true;
  router.replace({
    pathname: '/libro/[isbn]',
    params: { isbn },
  });
};
```

**d) Si el ISBN no está en el catálogo, ¿qué hace mi app?**

No navega. Muestra un aviso arriba del contenido y deja la cámara activa para seguir escaneando. Para que el mismo aviso no aparezca diez veces seguidas, guardo el último código desconocido en `ultimoDesconocidoRef`:

```ts
// src/app/escanear.tsx, líneas 67-83
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
  setAviso(`No encontramos el ISBN ${codigo} en el catálogo. Seguí escaneando o escribilo a mano.`);
};
```

Si el código que llega es el mismo, el `return` evita el `setAviso` repetido. Cuando aparece un código distinto, se actualiza la ref y se muestra el aviso nuevo. El ingreso manual sigue disponible siempre y el aviso se puede cerrar con la X.

---

### C3. Deep links y rutas protegidas

En Expo Go se prueba con la URL equivalente `exp://IP:8081/--/...`; el esquema `bibliotecaipf://` funciona en un development build o en una app standalone.

| Link | Qué ve la persona | Qué queda debajo en la pila | Qué parte de mi código lo decide |
|---|---|---|---|
| `bibliotecaipf://libro/9788420414706` | Detalle de *Rayuela*, con el título en el header. | Las tabs con el stack Catálogo en `index` (el detalle se abre como target del deep link). | `src/app/(tabs)/(catalogo)/libro/[isbn].tsx` + `buscarLibro`; el `anchor: '(tabs)'` del layout raíz. |
| `bibliotecaipf://libro/123` | Pantalla de detalle con “No pudimos abrir el libro” y “El ISBN «123» no es válido: tiene que tener 13 dígitos.”, con botón Volver al catálogo. | Las tabs/catálogo. | Validación en `libro/[isbn].tsx`, líneas 30-44. El router matchea la ruta dinámica antes de validar. |
| `bibliotecaipf://buscar?q=borges` | Buscador con la consulta “borges” y sus resultados. | Las tabs (el `anchor` deja las tabs debajo). | `src/app/buscar.tsx` lee `q` y dispara la búsqueda; `src/app/_layout.tsx` define el ancla. |
| `bibliotecaipf://mostrador` (sin sesión) | Redirige al login modal. | Las tabs. | `Stack.Protected` en `NavegacionRaiz.tsx`, líneas 36-38, con `guard={sesion !== null}` y `redirectTo="/login"`. |
| `bibliotecaipf://reserva` | Redirige a la tab **Mis reservas**. | Las tabs. | `src/app/reserva.tsx`: `<Redirect href="/reservas" />`. |
| `bibliotecaipf://escanear` (cámara bloqueada) | Escáner con “La cámara está bloqueada”, botón Abrir Ajustes e ingreso manual. | Las tabs. | `src/app/escanear.tsx` + `usePermiso` (estado `bloqueado`). |

**¿Por qué `/libro/123` llega a mi pantalla de detalle aunque no exista ningún libro con ese ISBN?**

Porque el router solo hace matching de la ruta dinámica `[isbn]`: cualquier segmento entra en `isbn`. El router no sabe qué ISBNs existen ni cuántos dígitos tienen; eso es responsabilidad de la pantalla. En mi app, el detalle normaliza el parámetro (`normalizarParametro`), verifica que tenga 13 dígitos (`esIsbnValido`) y busca en `LIBROS` (`buscarLibro`); si algo falla, muestra el mensaje con salida. La responsabilidad de responder bien en ese caso es de la capa de presentación/datos, no del router.

---

### C4. Foco, montaje y primer plano

**a) ¿Qué evento detecta cada una?**

- **`useEffect` con `[]`:** se ejecuta después del primer montaje y su limpieza corre al desmontar. No sabe si la pantalla tiene foco ni si la app está en primer plano.
- **`useFocusEffect`:** se ejecuta cuando la pantalla gana foco de navegación (por ejemplo, al volver a una tab o al cerrar una pantalla que estaba encima) y su limpieza corre al perderlo. Detecta foco de navegación, no el ciclo de vida de la app.
- **`AppState`:** escucha el estado de la app (`active`, `background`, `inactive`). Detecta cuando la persona sale y vuelve de Ajustes u otra app, pero no los cambios de tab.

**b) La persona sale a Ajustes, habilita las notificaciones y vuelve.**

Se entera **`AppState`**: la app estaba en `background`/`inactive` y vuelve a `active`. `useFocusEffect` no se entera porque la pantalla nunca perdió el foco de navegación; `useEffect([])` tampoco, porque no se desmontó.

Si en cambio va a la tab Catálogo y vuelve a Mis reservas, se entera **`useFocusEffect`**: la pantalla recupera el foco. `AppState` no cambia (la app siguió activa) y `useEffect([])` no se vuelve a ejecutar (la pantalla siguió montada).

**c) ¿Cuál o cuáles usé y por qué?**

- En `usePermiso` uso un `useEffect` para la consulta inicial de notificaciones (líneas 56-70) y `useRevisarAlVolver`, que por dentro usa `AppState` (líneas 72-76 y `src/hooks/useRevisarAlVolver.ts`).
- En `src/app/(tabs)/reservas.tsx` uso además `useFocusEffect` (líneas 84-88) para refrescar el estado del permiso cuando la tab vuelve a tener foco.
- En `src/app/escanear.tsx` uso `useFocusEffect` (líneas 53-57) y el hook también escucha `AppState`.

La combinación cubre los dos casos: volver de Ajustes (AppState) y volver a la tab (foco).

**Si usara solo una:**

- **Solo `useEffect([])`:** al volver de Ajustes o al cambiar de tab, el estado del permiso quedaría viejo hasta que la pantalla se volviera a montar. La persona vería “bloqueado” aunque ya lo habilitó.
- **Solo `useFocusEffect`:** al volver de Ajustes no se enteraría, porque la pantalla no perdió el foco de navegación.
- **Solo `AppState`:** al cambiar de tab y volver no se refrescaría si el permiso cambió por otra pantalla (por ejemplo, el switch o la pantalla previa) mientras la pantalla siguió montada.

Por eso uso AppState + foco. El recuadro de **Mis reservas** muestra el estado (`MENSAJES_NOTIFICACIONES`, líneas 51-58) y se actualiza con esos dos mecanismos.

---

## Parte D · Permisos en mi app

### D1. Recorrido completo de la cámara

> En Expo Go el permiso es de Expo Go, no de la app. Para ver el recorrido desde cero hay que revocar el permiso de cámara de Expo Go en los ajustes del teléfono. La lógica de la app es la misma.

| # | Acción | Qué muestra mi app | `status` | `canAskAgain` |
|---|---|---|---|---|
| 1 | Toca “Escanear” por primera vez. | Pantalla previa `/permisos/camara`: beneficio y botón **Continuar**. El hook está cargando y pasa a `preguntable`. | `undetermined` (o `denied` si Expo Go ya tenía un permiso previo) | `true` |
| 2 | “Continuar” → “No permitir”. | Se cierra la previa y se abre el escáner con “La cámara no está habilitada”, botón **Habilitar cámara** e ingreso manual. | `denied` | `true` (primera denegación en Android 14) |
| 3 | Toca “Escanear” otra vez. | Pantalla previa con **Continuar** (el estado es `preguntable`). | `denied` | `true` |
| 4 | “Continuar” → “No permitir”. | Escáner con “La cámara está bloqueada”, botón **Abrir Ajustes** e ingreso manual. | `denied` | `false` (Android deja de preguntar después de dos denegaciones) |
| 5 | Toca “Escanear” otra vez. | Pantalla previa con **Abrir Ajustes**; no aparece el diálogo del sistema. | `denied` | `false` |
| 6 | “Abrir Ajustes” → habilita la cámara → vuelve a la app. | La pantalla previa se refresca y el botón vuelve a **Continuar**; al tocarlo, el escáner muestra la cámara. | `granted` | `true`/`false` (ya está concedido) |

**a) En iOS**

El primer diálogo aparece una sola vez. Si la persona deniega, iOS devuelve `status = denied` y `canAskAgain = false`; en el paso 3 la app ya muestra **Abrir Ajustes** (bloqueado), no vuelve a preguntar. La diferencia con Android es que Android permite una segunda pregunta (y después bloquea), mientras que iOS no vuelve a mostrar el diálogo. Si concede, el estado es `granted` y la cámara se abre.

**b) La línea que decide entre “Continuar” y “Abrir Ajustes”**

En `src/app/permisos/[recurso].tsx`, líneas 95-101:

```ts
const bloqueado = permiso.estado === 'bloqueado';
const cargando = permiso.estado === 'cargando';
const tituloBoton = cargando
  ? 'Preparando…'
  : bloqueado
    ? 'Abrir Ajustes'
    : 'Continuar';
```

El estado `bloqueado` sale de `calcularEstado` en `src/hooks/usePermiso.ts`, líneas 36-40:

```ts
if (!permiso) return 'cargando';
if (estaConcedido(permiso)) return 'concedido';
return permiso.canAskAgain ? 'preguntable' : 'bloqueado';
```

Uso `canAskAgain`, no solo `status`. `status` puede ser `denied` tanto en el caso “todavía se puede volver a preguntar” como en el caso “bloqueado”. Mirar solo `status` haría que la app ofreciera **Continuar** cuando el sistema ya no va a mostrar el diálogo, y la persona se quedaría sin forma de habilitarlo. `canAskAgain` distingue los dos casos.

**c) En el paso 6, ¿qué parte se entera de que volvió de Ajustes?**

`usePermiso` usa `useRevisarAlVolver` (AppState). Cuando la app pasa de `background`/`inactive` a `active`, llama a `refrescar`, que consulta de nuevo el permiso (`getCameraPermissionsAsync` para cámara, `getPermissionsAsync` para notificaciones). El escáner además tiene `useFocusEffect` para refrescar al recuperar el foco.

Si esa parte no existiera, la pantalla previa y el escáner seguirían mostrando el estado viejo (“La cámara está bloqueada” / “Abrir Ajustes”) aunque la persona ya la hubiera habilitado. Tendría que cerrar y volver a abrir la pantalla (o reiniciar la app) para que se actualice.

---

### D2. Notificaciones y consistencia

**a) Activa “Recordarme” y, antes de los 15 segundos, toca “Devolver”. ¿Qué pasaría si no cancelara la notificación?**

La notificación se dispararía igual a los 15 segundos, aunque el libro ya esté devuelto: la persona recibiría un recordatorio falso. En mi app, `devolverPrestamo` cancela el id antes de quitar el préstamo (`src/app/(tabs)/reservas.tsx`, líneas 198-209):

```ts
const devolverPrestamo = async (isbn: string) => {
  const prestamo = prestamos.find((candidato) => candidato.isbn === isbn);
  try {
    if (prestamo?.notificacionId) {
      await cancelarRecordatorio(prestamo.notificacionId);
    }
  } finally {
    devolver(isbn);
  }
};
```

El `finally` asegura que el libro se devuelva aunque la cancelación falle. También se cancela al apagar el interruptor (líneas 179-186).

**b) ¿Dónde guardo el identificador? Si la app se cierra antes de que llegue, ¿qué pasa?**

Lo guardo en el Context, dentro del préstamo: `Prestamo.notificacionId` (`src/types/biblioteca.ts`). El id se actualiza con `actualizarRecordatorio` (Context, líneas 208-223) cuando el interruptor se activa o desactiva.

Si la app se cierra antes de los 15 segundos, la notificación **igual se entrega**, porque ya quedó programada en el sistema operativo; el sistema no depende de que la app esté abierta. Pero el Context vive en memoria: al volver a abrir la app se pierden el préstamo y el id. La notificación llega sin que la app tenga un préstamo asociado y ya no se puede cancelar desde la app. Ese es el problema de consistencia.

**Cómo lo resolvería:** persistir `prestamos` y `notificacionId` con `@react-native-async-storage/async-storage` (el desafío opcional de persistencia). Al iniciar, se leen los préstamos y los ids; así se puede cancelar una notificación vieja o mostrar el préstamo correcto. Otra opción más simple sería cancelar todas las notificaciones programadas al iniciar, pero se perderían recordatorios válidos. No implementé persistencia en esta entrega; lo dejo documentado como límite conocido.

**c) ¿Por qué en Android 13 o superior el canal se crea antes de pedir el permiso?**

Porque desde Android 13 (API 33) el permiso `POST_NOTIFICATIONS` es un permiso en tiempo de ejecución y el diálogo del sistema no aparece hasta que la app creó al menos un canal de notificaciones. Si se llama a `requestPermissionsAsync()` sin canal, el diálogo no se muestra o el permiso queda denegado. Por eso `pedirPermisoNotificaciones` y `usePermiso` llaman primero a `prepararCanal()`, que hace `setNotificationChannelAsync('prestamos', ...)` (en `src/lib/notificaciones.ts`, líneas 42-53), y recién después piden el permiso.

En **Android 12 o anterior** no existe el permiso `POST_NOTIFICATIONS` en tiempo de ejecución: la notificación se permite al instalar la app. Los canales existen desde Android 8; igual conviene crear el canal antes de programar para que la notificación tenga la importancia y el comportamiento correctos. `prepararCanal` es un no-op en iOS.

**d) Si el permiso está denegado y me entregan un libro desde el mostrador, ¿cómo me entero?**

El mostrador consulta el permiso **en ese momento** y decide:

```ts
// src/app/mostrador.tsx, líneas 70-86
let avisado = false;
try {
  if (await permisoNotificacionesConcedido()) {
    await notificarTurno(titulo, isbn);
    avisado = true;
  }
} catch {
  avisado = false;
}

if (!avisado) {
  agregarAviso({
    isbn,
    titulo: 'Tu reserva está lista',
    mensaje: `«${titulo}» te espera en el mostrador. Pasá a retirarlo.`,
  });
}
```

`permisoNotificacionesConcedido` (`src/lib/notificaciones.ts`, líneas 55-58) hace `getPermissionsAsync()` y devuelve si está concedido. Si no, agrega un aviso al Context, que se muestra en **Mis reservas**. Si la notificación falla aunque el permiso figure concedido, el `catch` también cae al aviso.

**¿Consulta el permiso en ese momento o usa un valor guardado?** Lo consulta en ese momento, a propósito. La persona pudo haber cambiado el permiso en Ajustes mientras la app estaba abierta; un booleano guardado desde el inicio quedaría viejo y la app elegiría el camino equivocado (por ejemplo, intentar notificar cuando ya no se puede, o mostrar un aviso cuando sí se podía notificar). Consultar en el momento evita esa inconsistencia.

---

### D3. Lo que mi app pide y lo que no

| Plataforma | Permiso o clave declarada | Función de la app que lo justifica | ¿Quién lo agrega? |
|---|---|---|---|
| Android | `android.permission.CAMERA` | Leer el código de barras EAN-13 del libro. | `expo-camera` (plugin y manifiesto de la librería). |
| Android | `android.permission.POST_NOTIFICATIONS` | Recordatorio de devolución y aviso de “tu reserva está lista”. | `expo-notifications` (manifiesto de la librería); se pide en tiempo de ejecución en Android 13+. |
| Android | `android.permission.RECEIVE_BOOT_COMPLETED` | Reprogramar/entregar notificaciones después de reiniciar el teléfono. | `expo-notifications` (manifiesto de la librería); permiso normal, no pide diálogo. |
| iOS | `NSCameraUsageDescription` | Leer el código de barras. | Plugin de `expo-camera` (`cameraPermission` en `app.json`). |
| iOS | Permiso de notificaciones del sistema | Recordatorios y aviso de turno. | Lo pide `expo-notifications` con `requestPermissionsAsync`; iOS no usa una clave de propósito en `Info.plist` para notificaciones. El beneficio se explica en la pantalla previa. |

También declaro `blockedPermissions` en Android para quitar permisos que no uso: `RECORD_AUDIO`, `READ_EXTERNAL_STORAGE`, `READ_MEDIA_IMAGES`, `READ_MEDIA_VIDEO`, `READ_MEDIA_AUDIO`, `ACCESS_BACKGROUND_LOCATION`, `ACCESS_FINE_LOCATION` y `ACCESS_COARSE_LOCATION`.

**a) ¿Por qué no declara `RECORD_AUDIO` aunque usa `expo-camera`?**

Porque la app solo lee códigos de barras: no graba audio ni video. El plugin de `expo-camera` agrega `RECORD_AUDIO` por defecto porque sirve para grabar video con sonido, pero yo lo desactivo. El fragmento de `app.json` es:

```json
[
  "expo-camera",
  {
    "cameraPermission": "Usamos tu cámara para leer el código de barras del libro y abrir su ficha.",
    "microphonePermission": false,
    "recordAudioAndroid": false
  }
]
```

`recordAudioAndroid: false` evita `RECORD_AUDIO` en Android; `microphonePermission: false` evita `NSMicrophoneUsageDescription` en iOS. Además, `RECORD_AUDIO` está en `blockedPermissions` como segunda barrera por si alguna dependencia lo agregara.

**b) Mañana me piden “elegir una foto de portada desde la galería”. ¿Qué paquete usaría, qué permiso necesitaría y alcanza con una OTA?**

Usaría `expo-image-picker`. Según la versión de Android/iOS puede necesitar permiso de fotos/galería (`READ_MEDIA_IMAGES` en Android 13+ o el permiso de la fototeca en iOS, con `NSPhotoLibraryUsageDescription`); en los sistemas modernos conviene usar el selector del sistema, que no da acceso amplio a toda la galería. Habría que configurar el plugin con un texto de propósito.

**No alcanza con una actualización OTA.** `expo-image-picker` es un módulo nativo y sus permisos se declaran en el manifiesto/Info.plist al compilar. Una OTA solo puede cambiar JavaScript y assets; para agregar el módulo y los permisos hace falta una **build nueva** (development build o build de producción). En Expo Go el módulo existe, pero el texto de propósito y el manifiesto propios no se pueden personalizar.

**c) ¿Qué partes de mi app no pude verificar del todo en Expo Go? ¿Por qué? ¿Cómo las verificaría?**

- **El texto de propósito de la cámara:** en Expo Go el diálogo lo muestra Expo Go con su propio texto, no con el `cameraPermission` de mi `app.json`. Se verifica en un development build o en un APK/AAB propio.
- **El `blockedPermissions` y el manifiesto final:** Expo Go tiene su propio manifiesto; mis bloqueos se aplican al compilar mi app. Se verifican con un build y con `adb shell dumpsys package` o el *Manifest Merger* de Android Studio.
- **El canal `prestamos` con mi paquete:** en Expo Go el canal queda asociado a Expo Go; en mi build se ve en los ajustes de notificaciones de la app.
- **Las notificaciones push remotas:** no las uso; además, en Expo Go Android no están disponibles desde SDK 53. Uso solo locales.
- **El ícono/color propio de la notificación:** es configuración de build; en Expo Go no se aplica.

Para verificarlo haría un development build (`npx expo run:android` o `eas build --profile development`) y probaría el diálogo, el manifiesto y los ajustes de notificaciones del paquete propio. Las notificaciones locales sí las pude probar en Expo Go.

---

## Parte E · Buenas prácticas y decisiones de diseño

### E1. Revisión de código

El fragmento del compañero tiene varios problemas. Los clasifico como en el TP1:

1. **Línea 10 — `useState<any[]>` (mala práctica / TypeScript).** Pierde el tipo `Libro`; cualquier propiedad puede ser cualquier cosa. Lo cambiaría por `useState<Libro[]>([])`.
2. **Líneas 13-16 — pide cámara y notificaciones al montar (mala práctica / permisos).** No hay acción de la persona, no se muestra la pantalla previa y las notificaciones no tienen relación con “Recordarme”. Además ignora las promesas (`pedirPermiso()` y `requestPermissionsAsync()` pueden rechazar). La app debe pedir la cámara al tocar Escanear, después de la previa, y las notificaciones solo al activar un recordatorio.
3. **Líneas 18-20 — efecto sin array de dependencias (error de ejecución / rendimiento).** Corre después de cada render y llama a `obtenerLibros()`; como la API devuelve un array nuevo, `setLibros` cambia el estado, provoca otro render y vuelve a pedir. Es un bucle de pedidos.
4. **Líneas 18-20 — sin limpieza ni `.catch()` (error de ejecución / estados).** Una respuesta puede llegar después de desmontar y actualizar un componente que ya no existe; si la API falla, la promesa rechazada no se maneja y la pantalla queda vacía sin explicación.
5. **Líneas 22-30 — `Fila` declarada dentro de `Catalogo` (mala práctica / rendimiento).** Cada render crea un tipo de componente nuevo; React desmonta y vuelve a montar las filas, pierde su estado y trabaja de más. Debe estar en el nivel del módulo, en su propio archivo (`TarjetaLibro` en mi app).
6. **Línea 35 — `key={i}` (mala práctica).** El índice no es estable; si la lista cambia, React puede reutilizar la fila equivocada. Debe ser una clave estable, en mi caso `libro.isbn`.
7. **Línea 25 — estilos en línea (mala práctica / estilos).** `{ fontSize: 16, color: '#333', padding: 12 }` ignora el `StyleSheet` y el tema. Debe usar `StyleSheet.create` y las constantes de `src/constants/tema.ts`.
8. **Líneas 33-36 — `ScrollView` con `.map` en vez de `FlatList` (rendimiento / optimización).** Renderiza todos los libros de una vez, no virtualiza y no tiene `ListEmptyComponent`. Debe ser `FlatList` con `keyExtractor` y estados.
9. **No hay estados de carga, error ni vacío (estados / UX).** La pantalla queda en blanco mientras espera y, si falla, no dice nada. Mi catálogo usa `EstadoCarga`, `EstadoError` con **Reintentar** y `EstadoVacio`.
10. **Líneas 37-39 — botón de cámara sin accesibilidad (accesibilidad).** El `Pressable` de solo ícono no tiene `accessibilityRole` ni `accessibilityLabel`, y el ícono mide 28 (menos de 44×44). Debe tener rol, etiqueta y área táctil de 44.
11. **Línea 37 — navega a `/escanear` sin la pantalla previa (permisos).** La cámara se pide en el mount (línea 14), así que el diálogo aparece antes de que la persona entienda el beneficio. En mi app, Escanear abre `/permisos/camara` y solo desde ahí se pide.
12. **Faltan requisitos del catálogo (requisitos).** No están “Vistos recientemente”, el acceso a Buscar, el link “Personal” ni el manejo de la lista vacía. La pantalla “funciona” para mostrar libros, pero no cumple la consigna.

**b) El efecto de las líneas 18-20 sin array de dependencias, paso a paso en el primer minuto**

1. Primer render: la pantalla muestra el `ScrollView` vacío.
2. Después del render corre el efecto y llama a `obtenerLibros()`. La API espera 800 ms.
3. A los 800 ms, `setLibros(datos)` actualiza el estado con un array nuevo y provoca un render.
4. Después de ese render, el efecto vuelve a correr (no tiene dependencias) y llama otra vez a `obtenerLibros()`.
5. A los 800 ms, otra vez `setLibros` con un array nuevo, otro render, otro pedido…

En 60 segundos entran unos 75 pedidos, con sus renders y actualizaciones de lista; la app consume red, CPU y batería, y la lista se vuelve a renderizar constantemente. El primer efecto (13-16) corre una sola vez por el `[]`, pero deja los permisos pedidos sin contexto.

**¿Cambiaría algo si `obtenerLibros()` devolviera siempre el mismo array en lugar de una copia?** Sí, pero no sería una solución correcta. React compara el estado nuevo con el anterior con `Object.is`; si el array es la misma referencia, el `setLibros` de la segunda vuelta no provoca un render y el bucle se detiene después de un pedido extra. Pero el efecto sigue corriendo después de cada render provocado por cualquier otro estado (por ejemplo, al escribir o al pedir permisos) y vuelve a pedir. Además, la API real devuelve objetos nuevos, y la copia es justamente lo que simula una API. La solución correcta es el array de dependencias y la limpieza, no depender de la identidad del array.

**c) Reescritura con mis hooks, componentes y constantes**

La versión real de la pantalla es la de `src/app/(tabs)/(catalogo)/index.tsx`:

```tsx
import { useRouter } from 'expo-router';
import { FlatList, StyleSheet } from 'react-native';

import { EncabezadoCatalogo } from '@/components/EncabezadoCatalogo';
import { EstadoCarga } from '@/components/EstadoCarga';
import { EstadoError } from '@/components/EstadoError';
import { EstadoVacio } from '@/components/EstadoVacio';
import { SeparadorLista } from '@/components/SeparadorLista';
import { TarjetaLibro } from '@/components/TarjetaLibro';
import { espaciados } from '@/constants/tema';
import { useBiblioteca } from '@/hooks/useBiblioteca';
import { useLibros } from '@/hooks/useLibros';

export default function Catalogo() {
  const router = useRouter();
  const { libros, cargando, error, reintentar } = useLibros();
  const { recientes, ejemplaresDisponibles } = useBiblioteca();

  const abrirLibro = (isbn: string) => {
    router.push({ pathname: '/libro/[isbn]', params: { isbn } });
  };

  if (cargando) {
    return <EstadoCarga mensaje="Cargando el catálogo…" />;
  }

  if (error) {
    return (
      <EstadoError
        titulo="No pudimos cargar el catálogo"
        mensaje={error}
        onReintentar={reintentar}
      />
    );
  }

  return (
    <FlatList
      data={libros}
      keyExtractor={(libro) => libro.isbn}
      renderItem={({ item }) => (
        <TarjetaLibro
          libro={item}
          disponibles={ejemplaresDisponibles(item.isbn)}
          onPress={() => abrirLibro(item.isbn)}
        />
      )}
      ListHeaderComponent={
        <EncabezadoCatalogo
          recientes={recientes.aArray().slice(-3).reverse()}
          onAbrirLibro={abrirLibro}
          onBuscar={() => router.push('/buscar')}
          onEscanear={() => router.push('/permisos/camara')}
        />
      }
      ListEmptyComponent={
        <EstadoVacio
          titulo="Catálogo vacío"
          mensaje="No hay libros disponibles en este momento."
        />
      }
      ItemSeparatorComponent={SeparadorLista}
      contentContainerStyle={estilos.contenido}
      showsVerticalScrollIndicator={false}
    />
  );
}

const estilos = StyleSheet.create({
  contenido: {
    padding: espaciados.md,
    paddingBottom: espaciados.xl,
  },
});
```

La diferencia con el compañero: usa el hook `useLibros` (efecto con limpieza y dependencia), `FlatList` con `keyExtractor` por ISBN, componentes de estado, `TarjetaLibro` a nivel de módulo, tema centralizado, accesibilidad y accesos a Buscar/Escanear/Personal.

**d) ¿Cuál problema podría provocar el rechazo en una tienda y cuál haría que una persona la desinstale primero?**

- **Rechazo en la tienda:** pedir permisos en el arranque sin contexto y sin los textos de propósito en el `Info.plist` (cámara/micrófono). Apple revisa el uso de permisos y la justificación (guía 5.1.1); una app que pide cámara/notificaciones sin relación con una acción visible puede ser rechazada. En el fragmento no hay `app.json` ni textos de propósito, y el permiso se pide al montar.
- **Desinstalación:** el bucle de pedidos de las líneas 18-20. La app no deja de pedir datos, calienta el teléfono, consume batería y datos, y la lista se re-renderiza sin parar; la persona la siente rota y la desinstala. El pedido de permisos al abrir también molesta, pero el bucle es el problema funcional más grave.

---

### E2. Organización y acoplamiento

**a) ¿Qué carpetas importan a cuáles?**

```text
src/app ──────────> components, hooks, context, lib, constants, types
src/components ───> constants, types, context
src/hooks ────────> lib, types, context
src/context ──────> data, lib, types, estructuras, constants
src/lib ──────────> data, types, constants
src/data ─────────> types
src/estructuras ──> (nada)
src/constants ────> types
src/types ────────> (nada)
```

No hay importaciones “hacia arriba”: ningún hook, componente, contexto o lib importa algo de `src/app`. `BotonPersonal` importa `Link` de `expo-router`, que es una librería externa, no una pantalla de `src/app`. Si un hook importara de `src/app`, la capa de lógica dependería de las pantallas: se crearían ciclos, sería más difícil reutilizar el hook en otro contexto y los tests tendrían que montar rutas. `src/app` es la raíz de composición; las capas de abajo no deben conocerla.

**b) Si el catálogo pasara a venir de una API real, ¿qué archivos cambiarían?**

- `src/lib/api.ts`: reemplazar la simulación por `fetch`/cliente real; manejar errores HTTP y maybe paginación.
- `src/data/libros.ts`: dejar de ser la fuente del catálogo (o quedar solo como datos de prueba).
- `src/context/BibliotecaContext.tsx`: si las esperas iniciales también vienen del servidor, hoy se inicializan desde `ESPERAS_INICIALES`; habría que cargarlas de forma asíncrona y manejar el estado de carga.
- `src/types/index.ts`: si la API devuelve otro shape (por ejemplo, un `id` numérico o campos extra), habría que ajustar el tipo.

No cambiarían `useLibros` ni las pantallas, porque el hook mantiene el contrato `{ libros, cargando, error, reintentar }` y los componentes siguen recibiendo `Libro`. Que cambien más de dos archivos me dice que el dato inicial (las esperas) está acoplado a la semilla estática y al Context; para una app de este tamaño es aceptable, pero si la API fuera real movería la carga inicial a un servicio/hook y dejaría el Context solo con el estado de la sesión.

**c) ¿Qué ganaría y qué perdería con `<ConPermiso recurso="camara">…</ConPermiso>`?**

Ganaría: un componente declarativo que encapsula los cuatro estados, evita repetir la lógica en cada pantalla y muestra el mismo mensaje/acción en todos lados. Perdería: el control fino del flujo de mi app, que necesita la pantalla previa antes del diálogo, un único botón “Continuar”/“Abrir Ajustes”, el fallback de escribir el ISBN a mano fuera del componente, la navegación después de conceder/denegar y el orden de las pantallas. Un wrapper que envuelve la cámara pediría/observaría el permiso al montarse, y en mi app la cámara se pide recién cuando la persona toca “Escanear” y pasa por la previa.

Para las **notificaciones no me serviría**: el permiso se pide al activar el interruptor “Recordarme”, no al abrir una pantalla. Un componente que envuelve una pantalla pediría el permiso al montarse, que es justo lo que la consigna prohíbe. Para permisos disparados por una acción, el hook `usePermiso` es mejor; el wrapper tiene sentido para una pantalla que necesita la cámara al mostrarse.

---

### E3. Mapa de fallas

| Situación | Qué ve la persona | Dónde se maneja (archivo y línea) |
|---|---|---|
| `obtenerLibros()` falla | “No pudimos cargar el catálogo”, un mensaje amable y el botón **Reintentar**. | `src/hooks/useLibros.ts`, líneas 24-28; `src/app/(tabs)/(catalogo)/index.tsx`, líneas 27-34. |
| Se abre `/libro/abc` | “No pudimos abrir el libro” + “El ISBN «abc» no es válido: tiene que tener 13 dígitos.” + **Volver al catálogo**. | `src/app/(tabs)/(catalogo)/libro/[isbn].tsx`, líneas 30-44. |
| Se escanea un ISBN que no está en el catálogo | Aviso arriba (“No encontramos el ISBN… Seguí escaneando o escribilo a mano”), la cámara sigue activa y el ingreso manual sigue disponible. | `src/app/escanear.tsx`, líneas 67-83. |
| La cámara está bloqueada | “La cámara está bloqueada”, **Abrir Ajustes** e ingreso manual. | `src/app/escanear.tsx`, líneas 164-183; `src/hooks/usePermiso.ts`, líneas 36-40. |
| Las notificaciones están denegadas | En Mis reservas: estado “Notificaciones desactivadas/bloqueadas” + **Abrir Ajustes** si está bloqueado. Al activar Recordarme: mensaje y el interruptor queda apagado. Si el mostrador me entrega: aviso interno. | `src/app/(tabs)/reservas.tsx`, líneas 51-58 y 153-196; `src/app/mostrador.tsx`, líneas 70-86. |
| Se intenta reservar un libro ya reservado | En el detalle, el botón queda deshabilitado con “Ya tenés este libro” o “Ya estás en la lista (posición N)”. Si se entra al modal por deep link, muestra el estado y **Ir a Mis reservas**. El Context, además, devuelve `{ tipo: 'ya' }`. | `libro/[isbn].tsx`, líneas 63-74 y 107-109; `reservar/[isbn].tsx`, líneas 66-90 y 100-114; `BibliotecaContext.tsx`, líneas 119-122. |
| “Entregar al siguiente” con la lista de espera vacía | La tarjeta del libro no se muestra; si se llama igual, no rompe: muestra “No hay nadie en la lista de espera.” | `src/app/mostrador.tsx`, líneas 58-62; `BibliotecaContext.tsx`, `entregarSiguiente`, líneas 152-177. |
| Login con clave incorrecta | “El usuario o la clave no son correctos. Revisá los datos e intentá de nuevo.” y sigue en el login. | `src/app/login.tsx`, líneas 29-41. |

---

### E4. Decisiones con argumentos

**a) Identificador: ¿ISBN como parámetro de ruta y `key`, o un id numérico propio?**

Elegí el **ISBN** como parámetro y como `key`. Es el identificador natural de este catálogo: el escáner devuelve un EAN-13, el tipo `Libro` que entrega la cátedra tiene `isbn` y no tiene `id`, y el detalle se busca directo en `LIBROS` por ese valor. Dos ediciones del mismo título tienen ISBN distintos, y para una biblioteca eso es correcto: son ejemplares/ediciones diferentes. Un libro sin ISBN no existe en este catálogo; si lo hubiera, necesitaría un id sintético y un mapeo.

`useLocalSearchParams` devuelve `string | string[] | undefined` (ejercicio E1 del TP2). Por eso normalizo con `normalizarParametro` y valido con `esIsbnValido` antes de buscar (`libro/[isbn].tsx`, líneas 18-35). Un id numérico tendría el mismo problema de tipado (`string` en la URL) y agregaría una tabla de equivalencias; no aporta nada acá. La `key` de las listas también es el ISBN (`keyExtractor={(libro) => libro.isbn}`), que es estable y único.

**b) Estructuras: ¿clase `Pila` con `#items` o array en el estado?**

Usé la **clase**. Me dio el encapsulamiento (`#items` privado), el getter `tamanio`, `aArray()`, la semántica LIFO/FIFO y la posibilidad de no usar `shift()` en la Cola (guardo un índice de frente). También me sirvió para ejercitar el TP2 y para que el código diga “esto es una cola/pila”, no un array cualquiera.

Lo que me complicó fue combinarla con React: mutar la instancia no dispara un render. Por eso, en el Context nunca muto la instancia que está en el estado: copio con `aArray()`, creo una instancia nueva, opero sobre la nueva y reemplazo el estado (por ejemplo, `reservar` en `BibliotecaContext.tsx`, líneas 135-141; `registrarReciente`, líneas 180-189). El costo es copiar (O(n)), pero las colas son de pocas personas. Un array plano con `[...pila, x]` y `slice` sería más idiomático en React y más fácil de persistir, pero perdería la clase que pide la consigna y el campo privado.

**c) Memorización: ¿usé `useMemo` o `useCallback`?**

Sí, en el Context. Uso `useCallback` para las acciones y funciones derivadas (`reservar`, `devolver`, `entregarSiguiente`, `registrarReciente`, `ejemplaresDisponibles`, etc.) y `useMemo` para el `value` del provider (`BibliotecaContext.tsx`, líneas 238-277). Eso ayuda en un lugar concreto: el `value` no cambia de identidad si el provider se re-renderiza sin que cambien sus dependencias, y los consumidores no se re-renderizan solo porque cambió la función. También las acciones mantienen una identidad estable cuando sus dependencias no cambian.

Dónde sería ruido: envolver en `useMemo` el `slice(-3).reverse()` de recientes o el título de una tarjeta, o en `useCallback` el `onPress` de un botón que se usa una sola vez. Son cálculos baratos y la memoización agrega código. React Compiler puede optimizar algunas de esas cosas automáticamente, pero no quiero depender de eso para la lógica del Context.

Lo comprobaría con el **React DevTools Profiler** o con un contador temporal de renders en un componente, no por intuición. Si el profiler mostrara que el Catálogo se re-renderiza de más por el Context, ahí evaluaría separar contextos o usar selectores (ver B4).

**d) Datos duplicados: ¿guardé los ejemplares disponibles en el estado o los calculo?**

Los **calculo**. `Libro.ejemplares` es el total inicial y los préstamos activos están en `prestamos`; `ejemplaresDisponibles` hace la resta en el Context (líneas 76-86):

```ts
const prestados = prestamos.filter((p) => p.isbn === isbn).length;
return Math.max(0, libro.ejemplares - prestados);
```

La posición en la espera también se calcula desde la `Cola` (`posicionEnEspera`, líneas 88-96), no se guarda.

El error que evito: si guardara un `disponibles` aparte, al reservar tendría que restar en dos lugares (el libro y el estado de disponibles) y al devolver sumar en dos. Si me olvidara de uno, la pantalla diría “hay 1 disponible” pero la lógica de reserva vería 0, o al revés; el dato quedaría desincronizado y el bug aparecería solo después de una secuencia de acciones. Con un único origen (el total inicial + la lista de préstamos) no hay dos fuentes que puedan contradecirse. Lo mismo aplica a la posición: si la guardara en el estado y el mostrador desencolara a otra persona, mi posición guardada quedaría vieja; calculándola desde la cola, se actualiza sola.
