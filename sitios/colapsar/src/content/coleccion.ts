import { notas } from "@/content/notas";
import { type Pieza } from "@/content/pieza";
import { site } from "@/content/site";
import { azar } from "@/lib/semilla";

/**
 * Con qué arranca el museo el día que nadie ha dejado nada todavía.
 *
 * Los ids son fijos y no salen del contenido: son la semilla de todo lo que
 * "parece azar" en la pared —la inclinación, el vaivén, el sitio en la baraja—,
 * y si dependieran del texto, corregirle una tilde a una frase le cambiaría el
 * sitio en la pared.
 */
const CREADO_SEMILLA = 0;

export const PIEZAS_TEXTO: readonly Pieza[] = notas.map((texto, i) => ({
  id: `s${String(i + 1).padStart(2, "0")}`,
  texto,
  creado: CREADO_SEMILLA,
}));

export const PIEZAS_FOTO: readonly Pieza[] = site.fotos.map((url, i) => ({
  id: `f${String(i + 1).padStart(2, "0")}`,
  foto: { url, ...site.fotosTamano },
  creado: CREADO_SEMILLA,
}));

export const PIEZAS_SEMILLA: readonly Pieza[] = [...PIEZAS_TEXTO, ...PIEZAS_FOTO];

/**
 * El orden en que se reparte la colección.
 *
 * Barajada, pero siempre igual: con `Math.random` el orden cambiaría entre el
 * render del servidor y el del cliente y las notas saltarían solas al hidratar.
 *
 * **La semilla es el `id` de cada pieza, no su posición en la lista.** Con el
 * índice, aprobar una pieza nueva recalculaba la clave de todas las que venían
 * detrás y la pared entera se rebarajaba sola cada vez que alguien escribía
 * algo. Con el id, cada pieza tiene su sitio de siempre y la nueva se mete en su
 * hueco sin mover a nadie.
 */
export function barajar(piezas: readonly Pieza[]): Pieza[] {
  return [...piezas]
    .map((pieza) => ({ pieza, orden: azar(`baraja-${pieza.id}`) }))
    .sort((a, b) => a.orden - b.orden)
    .map((n) => n.pieza);
}

/**
 * Las tajadas de la pared. **No se pueden solapar**: las dos maquetas se montan
 * en el DOM (una la esconde el CSS), y si una pieza saliera en las dos, el
 * `oculta` de la pieza abierta casaría con ambas y abrir una apagaría la otra.
 */
export function tajadas(piezas: readonly Pieza[], escritorio: number, movil: number) {
  const baraja = barajar(piezas);
  return {
    escritorio: baraja.slice(0, escritorio),
    movil: baraja.slice(escritorio, escritorio + movil),
  };
}
