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
 * El centro queda libre: ahí van la pregunta, el input y después la card.
 */
type Ranura = { x: string; y: string; hondura: number; movil: boolean };

const RANURAS: Ranura[] = [
  { x: "7%", y: "78%", hondura: 0.15, movil: true },
  { x: "54%", y: "87%", hondura: 0.55, movil: true },
  { x: "3%", y: "12%", hondura: 0.35, movil: false },
  { x: "20%", y: "34%", hondura: 0.85, movil: false },
  { x: "6%", y: "52%", hondura: 0.05, movil: false },
  { x: "25%", y: "66%", hondura: 0.7, movil: false },
  // Lejos del centro: a 31% el borde derecho llegaba a rozar la nota nueva.
  { x: "26%", y: "6%", hondura: 0.6, movil: false },
  { x: "58%", y: "9%", hondura: 0.9, movil: false },
  { x: "77%", y: "24%", hondura: 0.25, movil: false },
  { x: "86%", y: "52%", hondura: 0.75, movil: false },
  { x: "72%", y: "72%", hondura: 0.4, movil: false },
];

/** Donde emerge lo que acaba de escribir la persona. */
const RANURA_NUEVA: Ranura = { x: "50%", y: "7%", hondura: 0, movil: true };

const REPARTO = [...notas]
  .map((texto, i) => ({ texto, orden: azar(`rio-${i}`) }))
  .sort((a, b) => a.orden - b.orden)
  .slice(0, RANURAS.length)
  .map((n) => n.texto);

function Nota({
  texto,
  ranura,
  puntero,
  nueva = false,
  quieto,
}: {
  texto: string;
  ranura: Ranura;
  puntero: Puntero;
  nueva?: boolean;
  quieto: boolean;
}) {
  const cerca = 1 - ranura.hondura; // 1 = superficie
  const alcance = 14 + cerca * 46;

  const x = useTransform(puntero.x, (v) => -v * alcance);
  const y = useTransform(puntero.y, (v) => -v * alcance * 0.6);

  const semilla = texto;
  const reposo = entre(semilla, -4, 4, 1);

  return (
    <motion.div
      className="absolute w-[44vw] max-w-[200px] md:w-[190px]"
      style={{
        left: ranura.x,
        top: ranura.y,
        x: quieto ? 0 : x,
        y: quieto ? 0 : y,
        marginLeft: nueva ? "-95px" : 0,
      }}
      initial={
        nueva
          ? { opacity: 0, scale: 0.86, filter: "blur(16px)" }
          : { opacity: 0, filter: "blur(20px)" }
      }
      animate={{
        opacity: nueva ? 0.95 : 0.34 + cerca * 0.4,
        scale: 1,
        filter: `blur(${nueva ? 0 : ranura.hondura * 1.9}px)`,
      }}
      exit={{ opacity: 0, filter: "blur(20px)", transition: { duration: 0.5 } }}
      transition={{
        duration: nueva ? 1.3 : 2.2,
        delay: nueva ? 0 : entre(semilla, 0, 1.6, 7),
        ease: [0.16, 1, 0.3, 1],
      }}
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
}: {
  respuestas: string[];
  puntero: Puntero;
  quieto: boolean;
}) {
  const ultima = respuestas.at(-1);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-10">
      {RANURAS.map((ranura, i) => (
        <div key={i} className={ranura.movil ? "" : "hidden md:block"}>
          <Nota texto={REPARTO[i]} ranura={ranura} puntero={puntero} quieto={quieto} />
        </div>
      ))}

      {ultima && (
        <Nota
          key={ultima}
          texto={ultima}
          ranura={RANURA_NUEVA}
          puntero={puntero}
          nueva
          quieto={quieto}
        />
      )}
    </div>
  );
}
