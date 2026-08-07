import { notas } from "@/content/notas";
import { azar } from "@/lib/semilla";

/**
 * El orden en que se reparte la colección.
 *
 * Barajada, pero siempre igual: con `Math.random` el orden cambiaría entre el
 * render del servidor y el del cliente y las notas saltarían solas al hidratar.
 *
 * Vive acá y no en `MuroNotas` porque también la usa el mural, y un componente
 * que importa datos de otro componente es un enredo que se paga después.
 */
export const BARAJA: readonly string[] = [...notas]
  .map((texto, i) => ({ texto, orden: azar(`baraja-${i}`) }))
  .sort((a, b) => a.orden - b.orden)
  .map((n) => n.texto);

/**
 * Las tajadas de la pared. **No se pueden solapar**: las dos listas se montan en
 * el DOM (una la esconde el CSS), y si un texto saliera en las dos, el `oculta`
 * de la nota abierta casaría con ambas y abrir una apagaría la otra.
 */
export function tajadas(escritorio: number, movil: number) {
  return {
    escritorio: BARAJA.slice(0, escritorio),
    movil: BARAJA.slice(escritorio, escritorio + movil),
  };
}
