import { type Pieza } from "@/content/pieza";

/**
 * De dónde salió la pieza que se abrió: lo que hace falta para mandarla de vuelta
 * a su sitio cuando se cierre, venga de la pared, de una celda del mural o de un
 * televisor.
 *
 * `cx`/`cy` salen del bounding box, que en un rectángulo rotado sigue estando
 * centrado en el centro del rectángulo. `ancho` no: ese tiene que ser el de
 * layout (`offsetWidth`), porque el del bounding box viene inflado por la
 * inclinación.
 */
export type Origen = {
  pieza: Pieza;
  cx: number;
  cy: number;
  ancho: number;
  /** La inclinación con la que estaba puesta: la necesita el vuelo para salir derecho. */
  reposo: number;
  boton: HTMLElement | null;
};

/**
 * Mide el elemento del que despega la pieza.
 *
 * Vive suelto y no dentro de `Papel` porque ahora despegan tres cosas distintas
 * —el papel de la pared, la celda del mural y el marco del televisor— y esta
 * medida es justo lo que no puede divergir entre ellas.
 *
 * Ojo con qué elemento se le pasa en el televisor: tiene que ser **el marco**,
 * no el div de dentro. Ese está a mitad de la deriva ken-burns, con un `scale`
 * animado encima, y devolvería un rectángulo que no es el que se ve.
 */
export function medir(el: HTMLElement, pieza: Pieza, reposo: number): Origen {
  const caja = el.getBoundingClientRect();
  return {
    pieza,
    cx: caja.left + caja.width / 2,
    cy: caja.top + caja.height / 2,
    ancho: el.offsetWidth,
    reposo,
    boton: el,
  };
}
