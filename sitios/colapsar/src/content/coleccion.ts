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

export const PIEZAS_TEXTO: readonly Pieza[] = notas.map(({ id, texto }) => ({
  id,
  texto,
  creado: CREADO_SEMILLA,
}));

/** Las que salen siempre. Marcadas con `fija` en `notas.ts`. */
const FIJAS: ReadonlySet<string> = new Set(
  notas.filter((n) => n.fija).map((n) => n.id),
);

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
 * Las tajadas de la pared, con las fijas por delante.
 *
 * Sin esto, qué notas salen lo decide entero la baraja, y una nota buena se cae
 * de la pared en cuanto la gente deja suficientes cosas como para empujarla
 * fuera de la rodaja. Las `fija` van primeras y por eso caen siempre en las
 * ranuras que no llevan media query —las siete de base—, o sea que se ven hasta
 * en la pantalla más chica.
 *
 * **Las dos tajadas se solapan solo en las fijas, y eso es deliberado.** Antes
 * eran disjuntas del todo, porque las dos maquetas se montan en el DOM a la vez
 * y una pieza repetida haría que el `oculta` de la pieza abierta casara con las
 * dos. Sigue casando — pero la copia de la otra maqueta está dentro de un
 * `display:none` (`hidden md:block` contra `md:hidden` en `MuroNotas`), así que
 * apagar algo que ya nadie ve no se nota. El resto de la colección sigue sin
 * repetirse entre las dos.
 *
 * Es la única forma de que una fija salga en escritorio **y** en móvil: siendo
 * disjuntas, meterla en una era garantizar que no aparece en la otra.
 */
export function tajadas(piezas: readonly Pieza[], escritorio: number, movil: number) {
  const baraja = barajar(piezas);
  const fijas = baraja.filter((p) => FIJAS.has(p.id));
  const resto = baraja.filter((p) => !FIJAS.has(p.id));

  // El corte del resto se mide descontando las fijas, que ya ocupan sitio en las
  // dos. Con el tope a cero por si algún día hay más fijas que ranuras.
  const corte = Math.max(0, escritorio - fijas.length);

  return {
    escritorio: [...fijas, ...resto].slice(0, escritorio),
    movil: [...fijas, ...resto.slice(corte)].slice(0, movil),
  };
}
