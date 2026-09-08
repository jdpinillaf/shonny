/**
 * Las dos fuentes de Shonny, declaradas una sola vez.
 *
 * Courier Prime es la voz por defecto —placas, botones, pies, el papel de las
 * notas— e Instrument Serif es la emocional: los titulares que se teclean y las
 * cifras. La regla, corta: si emociona, serif; si informa, mono.
 *
 * Los nombres de las variables CSS (`--font-instrument`, `--font-courier`) están
 * acoplados a `estilos/tema.css`, que los referencia. Por eso viven en el mismo
 * paquete: separarlos obliga a acordarse de tocar dos sitios para cambiar una
 * fuente, y nadie se acuerda.
 *
 * `next/font` se resuelve en el build del sitio que importa esto, no en el del
 * paquete, así que cada sitio necesita `transpilePackages` en su next.config.
 * Consecuencia que conviene saber: cada dominio se auto-hospeda su copia de los
 * WOFF2. No hay caché compartida entre colapsar.shonny.co y shonny.co.
 */

import { Courier_Prime, Instrument_Serif } from "next/font/google";

export const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const courier = Courier_Prime({
  variable: "--font-courier",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

/** Lo que va en el `className` del `<html>`. */
export const variables = `${instrument.variable} ${courier.variable}`;
