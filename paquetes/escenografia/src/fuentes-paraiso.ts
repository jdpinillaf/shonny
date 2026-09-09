/**
 * Las fuentes del sitio de la artista: Fraunces para lo que emociona, Jost para
 * lo que informa.
 *
 * La elección está razonada en `docs/decisiones` y se compara con otras cinco en
 * `maquetas/tipografias/`. En corto: Fraunces es una serif cálida de curvas
 * deliberadamente imperfectas, y es la única candidata que se parece al universo
 * sensorial del ADN —fruta recién cortada, seda, atardecer— en vez de solo verse
 * cara. Jost cubre el papel de Futura LT Light, que es la que Wix le licencia y
 * es de pago.
 *
 * Los nombres de las variables son los roles que espera `estilos/paraiso.css`.
 * Si se cambia una familia, se cambia acá y en ningún otro lado.
 *
 * `axes: ["opsz"]` trae el eje de tamaño óptico de Fraunces, que es lo que hace
 * que `font-optical-sizing: auto` sirva: el navegador afina los remates a medida
 * que crece el titular. Sin el eje, la propiedad no tiene con qué trabajar.
 *
 * Las fuentes de Colapsar viven aparte en `fuentes.ts`: son otro mundo y no se
 * cargan juntas, porque cada familia que entra a un sitio es peso que baja
 * alguien en un teléfono.
 */

import { Fraunces, Jost } from "next/font/google";

export const fraunces = Fraunces({
  variable: "--font-titular",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  display: "swap",
});

export const jost = Jost({
  variable: "--font-cuerpo",
  subsets: ["latin"],
  display: "swap",
});

/** Lo que va en el `className` del `<html>`. */
export const variables = `${fraunces.variable} ${jost.variable}`;
