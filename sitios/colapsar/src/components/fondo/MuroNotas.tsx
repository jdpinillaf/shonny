"use client";

import { AnimatePresence } from "motion/react";
import { useMemo } from "react";
import { tajadas } from "@/content/coleccion";
import { conTexto, type Pieza } from "@/content/pieza";
import { dentro } from "@/lib/semilla";
import { ATENUAR } from "./Canales";
import { Nota, type Ranura } from "./Nota";
import { type Origen } from "./origen";

/**
 * Ranuras de la pared en escritorio, en % del viewport.
 *
 * Van en los huecos que dejan los televisores de `Canales.tsx`: si las dos
 * listas se diseñan por separado, las notas terminan encima de las caras y la
 * pared se lee como desorden en vez de colección. Al mover un marco allá, hay
 * que mover una ranura acá.
 *
 * El centro queda libre para la pregunta, el input y después la card. La franja
 * de arriba al centro también: ahí aterriza `RANURA_NUEVA`.
 *
 * Tres cosas que no son evidentes leyendo los números:
 *
 * - `y` se mide desde arriba salvo con `abajo`, que la mide desde el borde de
 *   abajo. La fila de abajo va así porque el alto del papel sale del texto que
 *   traiga: colocada por arriba, una nota larga se sale por la parte de abajo.
 * - `desde` es a partir de qué pantalla aparece la nota. La pared se puebla sola
 *   cuando hay sitio en vez de apiñar doce en un portátil. Las clases van
 *   literales porque Tailwind lee este archivo, no lo ejecuta.
 * - Las siete primeras son las de siempre y están en huecos limpios. Las cinco
 *   que se suman rozan el borde de un televisor: a partir de la octava ya no
 *   quedan huecos entre cinco marcos y la columna del centro, y una nota pinchada
 *   sobre la esquina del marco se lee mejor que doce apretadas en el medio.
 *
 * Y el tope que no se ve en la pantalla: **ninguna ranura puede caer dentro del
 * bloque del centro**, que mide 860px y sí recibe clicks. Una nota ahí se ve
 * pero no se abre — se la come el `pointer-events-auto` de `Museo.tsx`, que va
 * en z-30 contra el z-10 de la pared. El bloque es más ancho cuanto más chica es
 * la pantalla: en un 1280 son x16-84%, y en vertical va de y28% a y70%. O sea
 * que de y28 a y70 solo hay sitio pegado a los bordes, y todo lo demás tiene que
 * ir por arriba de y28 o por debajo de y70.
 */
type Hueco = { x: number; y: number; abajo?: boolean; desde?: string };

const HUECOS_ESCRITORIO: Hueco[] = [
  { x: 23, y: 8 },
  { x: 60, y: 3 },
  { x: 63, y: 22 },
  { x: 2, y: 42 },
  { x: 85, y: 45 },
  { x: 33, y: 4, abajo: true },
  { x: 70, y: 5, abajo: true },
  { x: 1, y: 60, desde: "hidden lg:block" },
  { x: 1, y: 2, abajo: true, desde: "hidden lg:block" },
  { x: 88, y: 1, desde: "hidden xl:block" },
  { x: 88, y: 14, abajo: true, desde: "hidden xl:block" },
  { x: 45, y: 6, abajo: true, desde: "hidden xl:block" },
];

/**
 * En escritorio el papel mide 184px fijos, así que **cuánto ocupa depende del
 * ancho de la pantalla**: un 13% en un 1440, un 10% en un 1920 y un 21% en un
 * 900. Por eso un 85% que sobra en el monitor se sale por la derecha en el
 * portátil, y por eso el tope va acá y no en la tabla: en CSS sí se pueden
 * mezclar % y px.
 */
const ANCHO_NOTA = 200; // 184 de papel y el resto, aire para la inclinación

const RANURAS_ESCRITORIO: Ranura[] = HUECOS_ESCRITORIO.map((h) => ({
  x: `min(${h.x}%, 100% - ${ANCHO_NOTA}px)`,
  y: `${h.y}%`,
  desdeAbajo: h.abajo,
}));

/**
 * En móvil es al revés que en escritorio: acá las notas van *encima* de las
 * fotos, no en los huecos. Cada ranura tapa una esquina del marco del mismo
 * índice en `PIEZAS_MOVIL` de `Canales.tsx` — al mover una, mover la otra.
 *
 * No hace falta z-index: la pared vive en z-10 y los canales en z-0, así que
 * el papel ya queda delante de la foto. El collage es cuestión de coordenadas.
 */
const PAPELES_MOVIL = [
  // Tres arriba y cuatro abajo con las 7 por defecto, y en ese orden: cinco
  // abajo se apiñan.
  //
  // Las tres de arriba van escalonadas en x y en y porque a 320px el papel mide
  // 134px y tres no caben en fila: así se leen como una pila y no como una
  // tabla. Y van altas a propósito, tapando el medio de su foto y no la
  // esquina — en un 320x700 el papel crece (el texto se envuelve más) y el
  // centro de la página sube, así que del 16% para abajo ya se come la placa.
  //
  // **Ninguna nota se sale de la pantalla.** Un televisor recortado por el borde
  // pasa por encuadre; media frase recortada pasa por bug. Dos cosas lo
  // sostienen, y las dos hay que respetarlas al mover un número:
  //
  // - A lo ancho, `dentro` recorta la x al hueco que deja el papel (42vw) con su
  //   margen. Poner 60 acá no lleva la nota al 60: la deja pegada al tope.
  // - A lo alto, las de abajo llevan `abajo: true` y su `y` se mide **desde el
  //   borde de abajo**, no desde arriba. Es la única forma de que quepan sin
  //   saber cuánto miden, y no se sabe: el alto sale del texto que traigan.
  //   Número más grande = más arriba. Del 20% para arriba ya empujan la card.
  { id: "p1", x: 22, y: 13 },
  { id: "p2", x: 30, y: 6, abajo: true },
  { id: "p3", x: 3, y: 2, abajo: true },
  { id: "p4", x: 52, y: 2 },
  { id: "p5", x: 3, y: 3 },
  { id: "p6", x: 46, y: 15, abajo: true },
  { id: "p7", x: 18, y: 14, abajo: true },
  { id: "p8", x: 44, y: 4, abajo: true },
];

/** Lo que ocupa el papel a lo ancho en móvil, y el aire que le toca al borde. */
const ANCHO_PAPEL = 42;
// El papel cuelga inclinado y el chinche le sobresale por arriba: pegado al 0 se
// recorta igual. A 320px esto son 9.6px, que cubren de sobra las dos cosas.
const MARGEN = 3;

const RANURAS_MOVIL: Ranura[] = PAPELES_MOVIL.map((p) => ({
  ...dentro(p.id, p.x, p.y, ANCHO_PAPEL, MARGEN),
  desdeAbajo: p.abajo,
}));

/** Cuántas notas entran en móvil. Se tantea con `?notas=`. */
export const NOTAS_MOVIL = 7;
export const TOPE_NOTAS = RANURAS_MOVIL.length;

/**
 * Donde aterriza lo que acaba de escribir la persona: arriba y al centro.
 *
 * En escritorio cae sobre fondo limpio, que es como estaba pensado. En móvil ya
 * no hay fondo limpio que valga —el collage ocupa toda la franja de arriba—, así
 * que se apoya en que se pinta la última: dentro de z-10 manda el orden del DOM,
 * y el papel es opaco. Se lee igual, encima del collage en vez de sobre negro.
 */
const RANURA_NUEVA: Ranura = { x: "50%", y: "5%" };

export function MuroNotas({
  piezas,
  ultima,
  quieto,
  puntero,
  notas: cuantas,
  apagado,
  onAbrir,
  huecoId,
}: {
  /** La colección entera. Acá solo cuelgan las que traen texto. */
  piezas: readonly Pieza[];
  /** Lo que acaba de escribir la persona, si escribió algo en esta visita. */
  ultima: Pieza | undefined;
  quieto: boolean;
  puntero: boolean;
  notas: number;
  apagado: boolean;
  onAbrir: (origen: Origen) => void;
  huecoId: string | null;
}) {
  // La baraja se calculaba al importar el módulo, cuando la colección era una
  // constante del repo. Ahora llega por props y cambia sola cuando se aprueba
  // algo, así que se rehace acá — y solo cuando la lista cambia de verdad.
  //
  // La recién escrita se saca de la baraja: tiene su propia ranura en el centro
  // y, si además le tocara una de la pared, se vería dos veces. Pasa de verdad
  // en cuanto la moderación la aprueba y vuelve dentro de `piezas`.
  const { escritorio, movil } = useMemo(
    () =>
      tajadas(
        conTexto(piezas).filter((p) => p.id !== ultima?.id),
        RANURAS_ESCRITORIO.length,
        RANURAS_MOVIL.length,
      ),
    [piezas, ultima?.id],
  );

  return (
    // La pared no recibe clicks: se los devuelve cada papel por su cuenta.
    // Si no, este `fixed inset-0` se comería los del centro.
    <div className="pointer-events-none fixed inset-0 z-10">
      <div className="hidden md:block">
        {escritorio.map((pieza, i) => (
          // El envoltorio es lo que apaga la media query cuando la pantalla no
          // da para tantas. Va por fuera y no en la nota porque `display:none`
          // sobre el papel le mataría también la animación de entrada.
          <div key={pieza.id} className={HUECOS_ESCRITORIO[i].desde}>
            <Nota
              pieza={pieza}
              ranura={RANURAS_ESCRITORIO[i]}
              quieto={quieto}
              puntero={puntero}
              onAbrir={onAbrir}
              oculta={huecoId === pieza.id}
            />
          </div>
        ))}
      </div>

      <div className="md:hidden" style={ATENUAR(apagado)}>
        {movil.slice(0, cuantas).map((pieza, i) => (
          <Nota
            key={pieza.id}
            pieza={pieza}
            ranura={RANURAS_MOVIL[i]}
            quieto={quieto}
            puntero={puntero}
            onAbrir={onAbrir}
            oculta={huecoId === pieza.id}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {ultima && (
          <Nota
            key={ultima.id}
            pieza={ultima}
            ranura={RANURA_NUEVA}
            nueva
            quieto={quieto}
            puntero={puntero}
            onAbrir={onAbrir}
            oculta={huecoId === ultima.id}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
