// Los parámetros de ruta pueden llegar como string, string[] o undefined.
// Esta función deja siempre un único string (o undefined).
export function normalizarParametro(
  valor: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(valor)) {
    return valor[0];
  }
  return valor;
}