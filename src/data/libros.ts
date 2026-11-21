import type { Libro } from '../types';

// Catálogo de la biblioteca (al menos 15 libros).
// Varios tienen su ISBN real de una edición en español para probar el escáner.
export const LIBROS: Libro[] = [
  {
    isbn: '9788420414706',
    titulo: 'Rayuela',
    autor: 'Julio Cortázar',
    anio: 1963,
    ejemplares: 2,
  },
  {
    isbn: '9788432248368',
    titulo: 'El túnel',
    autor: 'Ernesto Sabato',
    anio: 1948,
    ejemplares: 0,
  },
  {
    isbn: '9789500701260',
    titulo: 'Cien años de soledad',
    autor: 'Gabriel García Márquez',
    anio: 1967,
    ejemplares: 3,
  },
  {
    isbn: '9788420633131',
    titulo: 'Ficciones',
    autor: 'Jorge Luis Borges',
    anio: 1944,
    ejemplares: 1,
  },
  {
    isbn: '9788437604947',
    titulo: 'Pedro Páramo',
    autor: 'Juan Rulfo',
    anio: 1955,
    ejemplares: 0,
  },
  {
    isbn: '9788401337208',
    titulo: 'La casa de los espíritus',
    autor: 'Isabel Allende',
    anio: 1982,
    ejemplares: 2,
  },
  {
    isbn: '9788439720737',
    titulo: 'El amor en los tiempos del cólera',
    autor: 'Gabriel García Márquez',
    anio: 1985,
    ejemplares: 1,
  },
  {
    isbn: '9788432248375',
    titulo: 'Sobre héroes y tumbas',
    autor: 'Ernesto Sabato',
    anio: 1961,
    ejemplares: 0,
  },
  {
    isbn: '9788420633148',
    titulo: 'El Aleph',
    autor: 'Jorge Luis Borges',
    anio: 1949,
    ejemplares: 2,
  },
  {
    isbn: '9788420471830',
    titulo: 'La ciudad y los perros',
    autor: 'Mario Vargas Llosa',
    anio: 1963,
    ejemplares: 1,
  },
  {
    isbn: '9788432248382',
    titulo: 'El obsceno pájaro de la noche',
    autor: 'José Donoso',
    anio: 1970,
    ejemplares: 3,
  },
  {
    isbn: '9788433928279',
    titulo: 'Los detectives salvajes',
    autor: 'Roberto Bolaño',
    anio: 1998,
    ejemplares: 0,
  },
  {
    isbn: '9788410388390',
    titulo: 'Choujin X, tomo 4',
    autor: 'Sui Ishida',
    anio: 2024,
    ejemplares: 2,
  },
  {
    isbn: '9788432248399',
    titulo: 'La tregua',
    autor: 'Mario Benedetti',
    anio: 1960,
    ejemplares: 1,
  },
  {
    isbn: '9788467909998',
    titulo: 'El eternauta',
    autor: 'Héctor Germán Oesterheld',
    anio: 1957,
    ejemplares: 0,
  },
  {
    isbn: '9788498675399',
    titulo: 'Los juegos del hambre',
    autor: 'Suzanne Collins',
    anio: 2009,
    ejemplares: 2,
  },
  {
    isbn: '9788498381498',
    titulo: 'El principito',
    autor: 'Antoine de Saint-Exupéry',
    anio: 1943,
    ejemplares: 4,
  },
  {
    isbn: '9788417305413',
    titulo: 'Los otros animatrónicos (The Twisted Ones)',
    autor: 'Scott Cawthon y Kira Breed-Wrisley',
    anio: 2017,
    ejemplares: 1,
  },
];

// Listas de espera iniciales para algunos libros sin ejemplares.
// Viven separadas del tipo `Libro` (que no tiene campo de espera).
export const ESPERAS_INICIALES: Record<string, string[]> = {
  '9788432248368': ['Ana', 'Bruno'],
  '9788437604947': ['Carla'],
};