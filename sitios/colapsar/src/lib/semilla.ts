/**
 * Pseudo-aleatorio determinista a partir de un string.
 *
 * Todo lo que "parece azar" en la página (inclinación de una nota, retardo de
 * un canal, duración de un péndulo) sale de acá. Con Math.random los valores
 * cambiarían en cada render y en la hidratación: las notas saltarían solas.
 */

function hash(txt: string): number {
  let h = 2166136261;
  for (let i = 0; i < txt.length; i++) {
    h ^= txt.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Número estable en [0,1) para una semilla dada. `via` da variantes independientes. */
export function azar(semilla: string, via = 0): number {
  const h = hash(`${semilla}#${via}`);
  // xorshift para descorrelacionar variantes contiguas
  let x = h || 1;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return ((x >>> 0) % 100000) / 100000;
}

/** Número estable en [min,max]. */
export function entre(semilla: string, min: number, max: number, via = 0): number {
  return min + azar(semilla, via) * (max - min);
}

/** Entero estable en [0,n). */
export function indice(semilla: string, n: number, via = 0): number {
  return Math.floor(azar(semilla, via) * n) % n;
}
