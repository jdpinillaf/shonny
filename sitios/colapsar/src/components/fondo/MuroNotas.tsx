"use client";

import { AnimatePresence } from "motion/react";
import { notas } from "@/content/notas";
import { azar } from "@/lib/semilla";
import { Nota, type Ranura } from "./Nota";

/**
 * Ranuras de la pared, en % del viewport.
 *
 * Van en los huecos que dejan los televisores de `Canales.tsx`: si las dos
 * listas se diseñan por separado, las notas terminan encima de las caras y la
 * pared se lee como desorden en vez de colección. Al mover un marco allá, hay
 * que mover una ranura acá.
 *
 * El centro queda libre para la pregunta, el input y después la card. En móvil
 * solo sobreviven las dos de abajo: arriba ya están los televisores, y una nota
 * de 42vw en el medio taparía lo único que hay que leer.
 */
const RANURAS: Ranura[] = [
  // Las dos de móvil van muy abajo, hasta salirse un poco por el borde: en
  // pantalla chica la card y sus enlaces bajan hasta ~78% y una nota más
  // arriba les cae encima.
  { x: "2%", y: "84%", movil: true },
  { x: "52%", y: "91%", movil: true },
  { x: "23%", y: "8%", movil: false },
  { x: "60%", y: "3%", movil: false },
  { x: "63%", y: "22%", movil: false },
  { x: "2%", y: "42%", movil: false },
  { x: "85%", y: "45%", movil: false },
  { x: "33%", y: "82%", movil: false },
  { x: "70%", y: "83%", movil: false },
];

/** Donde aterriza lo que acaba de escribir la persona: arriba y al centro. */
const RANURA_NUEVA: Ranura = { x: "50%", y: "5%", movil: true };

/** Reparto sin repetir: baraja determinista y toma tantas como ranuras haya. */
const REPARTO = [...notas]
  .map((texto, i) => ({ texto, orden: azar(`baraja-${i}`) }))
  .sort((a, b) => a.orden - b.orden)
  .slice(0, RANURAS.length)
  .map((n) => n.texto);

export function MuroNotas({
  respuestas,
  quieto,
}: {
  respuestas: string[];
  quieto: boolean;
}) {
  const ultima = respuestas.at(-1);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-10">
      {RANURAS.map((ranura, i) => (
        <div key={i} className={ranura.movil ? "" : "hidden md:block"}>
          <Nota texto={REPARTO[i]} ranura={ranura} quieto={quieto} />
        </div>
      ))}

      <AnimatePresence mode="wait">
        {ultima && (
          <Nota key={ultima} texto={ultima} ranura={RANURA_NUEVA} nueva quieto={quieto} />
        )}
      </AnimatePresence>
    </div>
  );
}
