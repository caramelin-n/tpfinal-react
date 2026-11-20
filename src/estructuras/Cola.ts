// Cola (FIFO) sin usar shift(): se guarda un índice de frente.
// aArray() devuelve los elementos del frente al final (orden de atención).
export class Cola<T> {
  #items: T[];
  #frente = 0;

  constructor(iniciales: T[] = []) {
    this.#items = [...iniciales];
  }

  get tamanio(): number {
    return this.#items.length - this.#frente;
  }

  encolar(elemento: T): void {
    this.#items.push(elemento);
  }

  desencolar(): T | undefined {
    if (this.#frente >= this.#items.length) {
      return undefined;
    }
    const elemento = this.#items[this.#frente];
    this.#frente += 1;
    // Compactar si la cola quedó vacía o el frente creció mucho,
    // para no acumular basura en el array interno.
    if (this.#frente === this.#items.length) {
      this.#items = [];
      this.#frente = 0;
    } else if (this.#frente > 32 && this.#frente * 2 > this.#items.length) {
      this.#items = this.#items.slice(this.#frente);
      this.#frente = 0;
    }
    return elemento;
  }

  frente(): T | undefined {
    if (this.#frente >= this.#items.length) {
      return undefined;
    }
    return this.#items[this.#frente];
  }

  aArray(): T[] {
    return this.#items.slice(this.#frente);
  }
}