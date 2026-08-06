"use client";

import { motion, useTransform } from "motion/react";
import { notas } from "@/content/notas";
import { azar, entre } from "@/lib/semilla";
import type { Puntero } from "@/lib/usePuntero";

/**
 * Las notas sumergidas. `hondura` va de 0 (casi en la superficie) a 1 (al
 * fondo) y manda sobre todo: cuánto se corren con el mouse, cuánto se ven y
 * cuánto se desenfocan. Las de arriba se mueven más, como en el agua.
 *
 * Las coordenadas van en fracción de viewport, no en string de porcentaje,
 * porque hace falta medir la distancia de cada nota al punto donde cayó la
 * gota: de ahí sale su retardo de entrada.
 *
 * El centro queda libre: ahí van la pregunta, el input y después la card.
 */
type Ranura = { x: number; y: number; hondura: number; movil: boolean };

const RANURAS: Ranura[] = [
  { x: 0.07, y: 0.78, hondura: 0.15, movil: true },
  { x: 0.54, y: 0.87, hondura: 0.55, movil: true },
  { x: 0.03, y: 0.12, hondura: 0.35, movil: false },
  { x: 0.2, y: 0.34, hondura: 0.85, movil: false },
  { x: 0.06, y: 0.52, hondura: 0.05, movil: false },
  { x: 0.25, y: 0.66, hondura: 0.7, movil: false },
  // Lejos del centro: a 0.31 el borde derecho rozaba la nota nueva.
  { x: 0.26, y: 0.06, hondura: 0.6, movil: false },
  { x: 0.58, y: 0.09, hondura: 0.9, movil: false },
  { x: 0.77, y: 0.24, hondura: 0.25, movil: false },
  { x: 0.86, y: 0.52, hondura: 0.75, movil: false },
  { x: 0.72, y: 0.72, hondura: 0.4, movil: false },
];

/** Donde emerge lo que acaba de escribir la persona. */
const RANURA_NUEVA: Ranura = { x: 0.5, y: 0.07, hondura: 0, movil: true };

/** Cuánto tarda la onda en cruzar la pantalla y destapar la nota más lejana. */
const CRUCE = 1.5;

const REPARTO = [...notas]
  .map((texto, i) => ({ texto, orden: azar(`rio-${i}`) }))
  .sort((a, b) => a.orden - b.orden)
  .slice(0, RANURAS.length)
  .map((n) => n.texto);

function Nota({
  texto,
  ranura,
  puntero,
  origen,
  activo,
  nueva = false,
  quieto,
}: {
  texto: string;
  ranura: Ranura;
  puntero: Puntero;
  origen: { x: number; y: number };
  activo: boolean;
  nueva?: boolean;
  quieto: boolean;
}) {
  const cerca = 1 - ranura.hondura; // 1 = superficie
  const alcance = 14 + cerca * 46;

  const x = useTransform(puntero.x, (v) => -v * alcance);
  const y = useTransform(puntero.y, (v) => -v * alcance * 0.6);

  const semilla = texto;
  const reposo = entre(semilla, -4, 4, 1);

  // La onda las va destapando a su paso: el retardo es la distancia al punto
  // donde cayó la gota, no un azar. Con azar entran desordenadas y se pierde la
  // relación entre lo que se ve expandirse y lo que aparece.
  const dist = Math.hypot(ranura.x - origen.x, ranura.y - origen.y);
  const retardo = nueva ? 0 : (dist / 0.85) * CRUCE + entre(semilla, 0, 0.25, 7);

  return (
    <motion.div
      className="absolute w-[44vw] max-w-[200px] md:w-[190px]"
      style={{
        left: `${ranura.x * 100}%`,
        top: `${ranura.y * 100}%`,
        x: quieto ? 0 : x,
        y: quieto ? 0 : y,
        marginLeft: nueva ? "-95px" : 0,
      }}
      initial={{ opacity: 0, scale: nueva ? 0.86 : 1, filter: "blur(20px)" }}
      animate={
        activo
          ? {
              opacity: nueva ? 0.95 : 0.34 + cerca * 0.4,
              scale: 1,
              filter: `blur(${nueva ? 0 : ranura.hondura * 1.9}px)`,
            }
          : { opacity: 0, filter: "blur(20px)" }
      }
      exit={{ opacity: 0, filter: "blur(20px)", transition: { duration: 0.5 } }}
      transition={{ duration: nueva ? 1.3 : 1.9, delay: retardo, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        className="ondear relative px-3.5 pb-2.5 pt-3.5"
        style={
          {
            "--reposo": `${reposo.toFixed(2)}deg`,
            "--vaiven": quieto ? "0deg" : `${entre(semilla, 1.1, 2.6, 2).toFixed(2)}deg`,
            "--flote": quieto ? "0px" : `${entre(semilla, 5, 13, 8).toFixed(1)}px`,
            "--dur": `${entre(semilla, 9, 16, 3).toFixed(1)}s`,
            "--retardo": `-${entre(semilla, 0, 12, 4).toFixed(1)}s`,
            background: "var(--color-papel)",
            color: "#1b2630",
            boxShadow: "0 10px 34px rgba(3,8,14,0.6)",
          } as React.CSSProperties
        }
      >
        <p className="text-[11.5px] leading-[1.5] md:text-[12px]">{texto}</p>
        <p
          className="mt-2.5 border-t pt-1.5 text-[7px] uppercase tracking-[0.28em]"
          style={{ borderColor: "rgba(27,38,48,0.22)", color: "rgba(27,38,48,0.5)" }}
        >
          s/f · anónimo · nunca ocurrió
        </p>

        {/* Vidrio de agua encima del papel: sin esto la nota se ve pegada sobre
            el río en vez de hundida en él. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(160deg, rgba(143,182,201,${(0.1 + ranura.hondura * 0.3).toFixed(2)}), rgba(5,20,32,${(0.12 + ranura.hondura * 0.4).toFixed(2)}))`,
            mixBlendMode: "hard-light",
          }}
        />
      </div>
    </motion.div>
  );
}

export function NotasFlotando({
  respuestas,
  puntero,
  quieto,
  activo,
  origen,
}: {
  respuestas: string[];
  puntero: Puntero;
  quieto: boolean;
  /** Falso hasta que la gota toca el agua. */
  activo: boolean;
  origen: { x: number; y: number };
}) {
  const ultima = respuestas.at(-1);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-10">
      {RANURAS.map((ranura, i) => (
        <div key={i} className={ranura.movil ? "" : "hidden md:block"}>
          <Nota
            texto={REPARTO[i]}
            ranura={ranura}
            puntero={puntero}
            origen={origen}
            activo={activo}
            quieto={quieto}
          />
        </div>
      ))}

      {ultima && (
        <Nota
          key={ultima}
          texto={ultima}
          ranura={RANURA_NUEVA}
          puntero={puntero}
          origen={origen}
          activo={activo}
          nueva
          quieto={quieto}
        />
      )}
    </div>
  );
}
