// Pila (LIFO) con campo privado #items.
// aArray() devuelve los elementos del fondo al tope (orden de inserción),
// para que reconstruir una pila con `new Pila(anterior.aArray())` preserve el orden.
export class Pila<T> {
  #items: T[];

  constructor(iniciales: T[] = []) {
    this.#items = [...iniciales];
  }

  get tamanio(): number {
    return this.#items.length;
  }

  apilar(elemento: T): void {
    this.#items.push(elemento);
  }

  desapilar(): T | undefined {
    return this.#items.pop();
  }

  tope(): T | undefined {
    return this.#items[this.#items.length - 1];
  }

  aArray(): T[] {
    return [...this.#items];
  }
}