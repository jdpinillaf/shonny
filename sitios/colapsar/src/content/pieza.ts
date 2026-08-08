/**
 * Una pieza del museo.
 *
 * Antes había dos cosas sueltas —frases en `notas.ts` y fotos en `site.fotos`—
 * que no se conocían entre sí. Ahora son lo mismo: una nota es una pieza sin
 * foto, una foto de la colección es una pieza sin texto, y lo que sube alguien
 * puede tener las dos. Eso es lo que deja que un solo modal las abra todas,
 * vengan de la pared, del mural o de un televisor.
 *
 * **El `id` es la identidad, nunca el texto.** El texto lo era hasta que la
 * pared se abrió a la gente: dos personas escriben lo mismo y una pieza de solo
 * foto no tiene texto ninguno. Con el texto de clave, abrir una nota apagaba a
 * su gemela y las piezas sin texto entraban con la clave en `undefined`.
 */
export type Pieza = {
  id: string;
  texto?: string;
  /**
   * `w`/`h` no son adorno: dan el aspect-ratio con el que la foto se pinta antes
   * de cargar. Sin ellos el vuelo mide mal el destino y la foto llega deformada.
   */
  foto?: { url: string; w: number; h: number };
  creado: number;
};

export const conTexto = (piezas: readonly Pieza[]) => piezas.filter((p) => p.texto);
export const conFoto = (piezas: readonly Pieza[]) => piezas.filter((p) => p.foto);

/**
 * Une sin repetir, quedándose con la primera aparición de cada `id`.
 *
 * Hace falta porque lo que escribe la persona vive en dos sitios a la vez: en su
 * `localStorage` desde el segundo cero, y en la lista del servidor si la
 * moderación la deja pasar. Como el `id` lo genera el cliente antes de enviar,
 * las dos copias son la misma pieza y se colapsan acá.
 */
export function unir(...listas: readonly (readonly Pieza[])[]): Pieza[] {
  const vistas = new Set<string>();
  const salida: Pieza[] = [];
  for (const lista of listas) {
    for (const pieza of lista) {
      if (vistas.has(pieza.id)) continue;
      vistas.add(pieza.id);
      salida.push(pieza);
    }
  }
  return salida;
}

/** El uuid que genera el cliente. Se valida antes de que toque un pathname de Blob. */
export const ES_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Lo que llega de Redis sobrevive a los cambios de forma del tipo. Se comprueba. */
export function esPieza(x: unknown): x is Pieza {
  if (typeof x !== "object" || x === null) return false;
  const p = x as Partial<Pieza>;
  if (typeof p.id !== "string" || !p.id) return false;
  if (typeof p.creado !== "number") return false;
  if (p.texto !== undefined && typeof p.texto !== "string") return false;
  if (p.foto !== undefined) {
    const f = p.foto as Partial<NonNullable<Pieza["foto"]>>;
    if (typeof f?.url !== "string" || typeof f.w !== "number" || typeof f.h !== "number") {
      return false;
    }
  }
  return Boolean(p.texto || p.foto);
}
