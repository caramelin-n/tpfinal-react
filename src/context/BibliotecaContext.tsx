import {
  createContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { CREDENCIALES_PERSONAL } from '@/constants/auth';
import { YO } from '@/constants/biblioteca';
import { ESPERAS_INICIALES } from '@/data/libros';
import { Cola } from '@/estructuras/Cola';
import { Pila } from '@/estructuras/Pila';
import { buscarLibro } from '@/lib/catalogo';
import { calcularVencimiento } from '@/lib/fechas';
import type { Libro } from '@/types';
import type {
  Aviso,
  EstadoLibro,
  Prestamo,
  ResultadoReserva,
} from '@/types/biblioteca';

export type ValorBiblioteca = {
  prestamos: Prestamo[];
  esperas: Record<string, Cola<string>>;
  recientes: Pila<Libro>;
  sesion: string | null;
  avisos: Aviso[];
  ejemplaresDisponibles: (isbn: string) => number;
  posicionEnEspera: (isbn: string) => number;
  estadoLibro: (isbn: string) => EstadoLibro;
  reservar: (isbn: string) => ResultadoReserva;
  devolver: (isbn: string) => void;
  entregarSiguiente: (isbn: string) => { nombre: string; esYo: boolean } | null;
  registrarReciente: (libro: Libro) => void;
  iniciarSesion: (usuario: string, clave: string) => boolean;
  cerrarSesion: () => void;
  actualizarRecordatorio: (
    isbn: string,
    recordarme: boolean,
    notificacionId: string | null,
  ) => void;
  agregarAviso: (datos: Omit<Aviso, 'id'>) => void;
  quitarAviso: (id: string) => void;
};

export const ContextoBiblioteca = createContext<ValorBiblioteca | null>(null);

function crearEsperasIniciales(): Record<string, Cola<string>> {
  const esperas: Record<string, Cola<string>> = {};
  for (const [isbn, nombres] of Object.entries(ESPERAS_INICIALES)) {
    esperas[isbn] = new Cola(nombres);
  }
  return esperas;
}

let proximoAviso = 0;

function crearIdAviso(): string {
  proximoAviso += 1;
  return `aviso-${proximoAviso}`;
}

export function BibliotecaProvider({ children }: { children: ReactNode }) {
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [esperas, setEsperas] = useState<Record<string, Cola<string>>>(
    crearEsperasIniciales,
  );
  const [recientes, setRecientes] = useState<Pila<Libro>>(
    () => new Pila<Libro>(),
  );
  const [sesion, setSesion] = useState<string | null>(null);
  const [avisos, setAvisos] = useState<Aviso[]>([]);

  const ejemplaresDisponibles = useCallback(
    (isbn: string): number => {
      const libro = buscarLibro(isbn);
      if (!libro) return 0;
      const prestados = prestamos.filter(
        (prestamo) => prestamo.isbn === isbn,
      ).length;
      return Math.max(0, libro.ejemplares - prestados);
    },
    [prestamos],
  );

  const posicionEnEspera = useCallback(
    (isbn: string): number => {
      const cola = esperas[isbn];
      if (!cola) return 0;
      const posicion = cola.aArray().indexOf(YO);
      return posicion === -1 ? 0 : posicion + 1;
    },
    [esperas],
  );

  const estadoLibro = useCallback(
    (isbn: string): EstadoLibro => {
      if (prestamos.some((prestamo) => prestamo.isbn === isbn)) {
        return 'prestado';
      }
      if (posicionEnEspera(isbn) > 0) {
        return 'en-espera';
      }
      return ejemplaresDisponibles(isbn) > 0
        ? 'disponible'
        : 'sin-ejemplares';
    },
    [prestamos, posicionEnEspera, ejemplaresDisponibles],
  );

  const reservar = useCallback(
    (isbn: string): ResultadoReserva => {
      if (!buscarLibro(isbn)) {
        return { tipo: 'no-existe' };
      }

      const estado = estadoLibro(isbn);
      if (estado === 'prestado' || estado === 'en-espera') {
        return { tipo: 'ya' };
      }

      if (ejemplaresDisponibles(isbn) > 0) {
        const nuevo: Prestamo = {
          isbn,
          vence: calcularVencimiento(),
          recordarme: false,
          notificacionId: null,
        };
        setPrestamos((anteriores) => [...anteriores, nuevo]);
        return { tipo: 'prestamo' };
      }

      // Si no hay ejemplares, se copia la cola y se encola a la persona
      // actual. Nunca se muta la Cola que está guardada en el estado.
      const colaActual = esperas[isbn] ?? new Cola<string>();
      const nuevaCola = new Cola<string>(colaActual.aArray());
      nuevaCola.encolar(YO);
      setEsperas((anteriores) => ({ ...anteriores, [isbn]: nuevaCola }));
      return { tipo: 'espera', posicion: nuevaCola.tamanio };
    },
    [estadoLibro, ejemplaresDisponibles, esperas],
  );

  const devolver = useCallback((isbn: string): void => {
    setPrestamos((anteriores) =>
      anteriores.filter((prestamo) => prestamo.isbn !== isbn),
    );
  }, []);

  const entregarSiguiente = useCallback(
    (isbn: string): { nombre: string; esYo: boolean } | null => {
      const colaActual = esperas[isbn];
      if (!colaActual || colaActual.tamanio === 0) {
        return null;
      }

      const nuevaCola = new Cola<string>(colaActual.aArray());
      const nombre = nuevaCola.desencolar();
      if (nombre === undefined) {
        return null;
      }

      setEsperas((anteriores) => {
        const siguientes = { ...anteriores };
        if (nuevaCola.tamanio === 0) {
          delete siguientes[isbn];
        } else {
          siguientes[isbn] = nuevaCola;
        }
        return siguientes;
      });

      return { nombre, esYo: nombre === YO };
    },
    [esperas],
  );

  const registrarReciente = useCallback((libro: Libro): void => {
    setRecientes((anterior) => {
      if (anterior.tope()?.isbn === libro.isbn) {
        return anterior;
      }
      const nueva = new Pila<Libro>(anterior.aArray());
      nueva.apilar(libro);
      return nueva;
    });
  }, []);

  const iniciarSesion = useCallback(
    (usuario: string, clave: string): boolean => {
      const ok =
        usuario.trim() === CREDENCIALES_PERSONAL.usuario &&
        clave === CREDENCIALES_PERSONAL.clave;
      if (ok) {
        setSesion(usuario.trim());
      }
      return ok;
    },
    [],
  );

  const cerrarSesion = useCallback((): void => {
    setSesion(null);
  }, []);

  const actualizarRecordatorio = useCallback(
    (
      isbn: string,
      recordarme: boolean,
      notificacionId: string | null,
    ): void => {
      setPrestamos((anteriores) =>
        anteriores.map((prestamo) =>
          prestamo.isbn === isbn
            ? { ...prestamo, recordarme, notificacionId }
            : prestamo,
        ),
      );
    },
    [],
  );

  const agregarAviso = useCallback((datos: Omit<Aviso, 'id'>): void => {
    setAvisos((anteriores) => [
      ...anteriores,
      { ...datos, id: crearIdAviso() },
    ]);
  }, []);

  const quitarAviso = useCallback((id: string): void => {
    setAvisos((anteriores) =>
      anteriores.filter((aviso) => aviso.id !== id),
    );
  }, []);

  const valor = useMemo<ValorBiblioteca>(
    () => ({
      prestamos,
      esperas,
      recientes,
      sesion,
      avisos,
      ejemplaresDisponibles,
      posicionEnEspera,
      estadoLibro,
      reservar,
      devolver,
      entregarSiguiente,
      registrarReciente,
      iniciarSesion,
      cerrarSesion,
      actualizarRecordatorio,
      agregarAviso,
      quitarAviso,
    }),
    [
      prestamos,
      esperas,
      recientes,
      sesion,
      avisos,
      ejemplaresDisponibles,
      posicionEnEspera,
      estadoLibro,
      reservar,
      devolver,
      entregarSiguiente,
      registrarReciente,
      iniciarSesion,
      cerrarSesion,
      actualizarRecordatorio,
      agregarAviso,
      quitarAviso,
    ],
  );

  return (
    <ContextoBiblioteca.Provider value={valor}>
      {children}
    </ContextoBiblioteca.Provider>
  );
}