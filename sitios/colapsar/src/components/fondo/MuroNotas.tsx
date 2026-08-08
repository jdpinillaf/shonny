"use client";

import { AnimatePresence } from "motion/react";
import { useMemo } from "react";
import { tajadas } from "@/content/coleccion";
import { conTexto, type Pieza } from "@/content/pieza";
import { corrido } from "@/lib/semilla";
import { ATENUAR } from "./Canales";
import { Nota, type Ranura } from "./Nota";
import { type Origen } from "./origen";

/**
 * Ranuras de la pared, en % del viewport.
 *
 * Van en los huecos que dejan los televisores de `Canales.tsx`: si las dos
 * listas se diseñan por separado, las notas terminan encima de las caras y la
 * pared se lee como desorden en vez de colección. Al mover un marco allá, hay
 * que mover una ranura acá.
 *
 * El centro queda libre para la pregunta, el input y después la card.
 */
const RANURAS_ESCRITORIO: Ranura[] = [
  { x: "23%", y: "8%" },
  { x: "60%", y: "3%" },
  { x: "63%", y: "22%" },
  { x: "2%", y: "42%" },
  { x: "85%", y: "45%" },
  { x: "33%", y: "82%" },
  { x: "70%", y: "83%" },
];

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
  { id: "p1", x: 22, y: 13 },
  { id: "p2", x: 30, y: 78 },
  { id: "p3", x: 4, y: 88 },
  { id: "p4", x: 56, y: 1 },
  { id: "p5", x: -8, y: 3 },
  { id: "p6", x: 46, y: 68 },
  { id: "p7", x: 20, y: 66 },
  { id: "p8", x: 60, y: 88 },
];

const RANURAS_MOVIL: Ranura[] = PAPELES_MOVIL.map((p) => corrido(p.id, p.x, p.y));

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
          <Nota
            key={pieza.id}
            pieza={pieza}
            ranura={RANURAS_ESCRITORIO[i]}
            quieto={quieto}
            puntero={puntero}
            onAbrir={onAbrir}
            oculta={huecoId === pieza.id}
          />
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
