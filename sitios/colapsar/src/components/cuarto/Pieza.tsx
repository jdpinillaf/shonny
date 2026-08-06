"use client";

import Image from "next/image";
import { azar, entre, indice } from "@/lib/semilla";
import { site } from "@/content/site";
import type { Pieza as Dato } from "./piezas";

/**
 * Una pieza pegada en la pared.
 *
 * El revelado no lo maneja motion sino un `@keyframes` con `--retardo`: son
 * casi treinta elementos animando `filter` a la vez y con JS eso es caro sin
 * necesidad. Es el mismo patrón de `.nota`, `.canal-img` y `.ondear`.
 *
 * El giro y el `scale(1.035)` son los que hacen que se lea como pegado a mano:
 * cada pieza se sale un pelo de su celda y se monta sobre las vecinas, así no
 * queda una cuadrícula perfecta.
 */
export function Pieza({
  pieza,
  quieto,
  propia = false,
}: {
  pieza: Dato;
  quieto: boolean;
  /** La respuesta recién escrita: se revela sola, ya, y queda encendida. */
  propia?: boolean;
}) {
  const tope = pieza.borde ? 3.4 : 1.9;
  const giro = entre(pieza.id, -tope, tope, 1);

  return (
    <div
      data-pieza={pieza.id}
      className={`relative overflow-hidden ${quieto ? "revelado" : "revelar revelado"}`}
      style={
        {
          gridColumn: `${pieza.col} / span ${pieza.cw}`,
          gridRow: `${pieza.fila} / span ${pieza.ch}`,
          "--retardo": `${(propia ? 0 : pieza.retardo).toFixed(2)}s`,
          transform: `rotate(${giro.toFixed(2)}deg) scale(${pieza.borde ? 1.13 : 1.035})`,
        } as React.CSSProperties
      }
    >
      {pieza.tipo === "foto" && <Foto pieza={pieza} />}
      {pieza.tipo === "nota" && <Papel pieza={pieza} propia={propia} />}
      {pieza.tipo === "tira" && <Tira pieza={pieza} />}
    </div>
  );
}

function Foto({ pieza }: { pieza: Dato }) {
  const imagen = (
    <Image
      src={site.fotos[pieza.foto]}
      alt=""
      fill
      sizes="(max-width: 768px) 55vw, 26vw"
      className="object-cover"
      style={{ objectPosition: pieza.encuadre }}
    />
  );

  if (!pieza.instantanea) {
    return <div className="absolute inset-0">{imagen}</div>;
  }

  // Instantánea: marco parejo arriba y a los lados, ancho abajo. La proporción
  // del borde es lo único que hace que se lea como una Polaroid.
  return (
    <div
      className="absolute inset-0 flex flex-col p-[6%] pb-[17%]"
      style={{
        background: "var(--color-papel)",
        boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.14)",
      }}
    >
      <div className="relative flex-1 overflow-hidden bg-black">{imagen}</div>
    </div>
  );
}

function Papel({ pieza, propia }: { pieza: Dato; propia: boolean }) {
  return (
    <div
      className="absolute inset-0 flex flex-col justify-center px-[7%] py-[6%]"
      style={{
        background: propia ? "#e8e2d4" : "var(--color-papel)",
        color: "#211f1b",
        boxShadow: propia
          ? "inset 0 0 0 1px rgba(0,0,0,0.2), 0 0 34px rgba(232,226,212,0.28)"
          : "inset 0 0 0 1px rgba(0,0,0,0.14)",
      }}
    >
      {/* La cinta. En un mosaico todo va pegado, no colgado: un chinche pediría
          un clavo y una sombra que acá no existen. */}
      <div
        aria-hidden
        className="absolute -left-[6%] -top-[7%] h-[16%] w-[38%] rotate-[-24deg]"
        style={{ background: "rgba(238,232,216,0.42)" }}
      />

      <p className="text-[clamp(8px,1.05vw,12px)] leading-[1.45]">{pieza.texto}</p>
      <p
        className="mt-[5%] text-[clamp(5.5px,0.62vw,7px)] uppercase tracking-[0.22em]"
        style={{ color: "rgba(33,31,27,0.48)" }}
      >
        {propia ? "hoy · anónimo · nunca ocurrió" : "s/f · anónimo · nunca ocurrió"}
      </p>
    </div>
  );
}

/**
 * Tira de negativos.
 *
 * Es el mejor guiño que tiene la pared: un negativo es literalmente una imagen
 * que todavía no pasó. Los fotogramas van invertidos, y las perforaciones son
 * dos franjas de rayas, arriba y abajo.
 */
function Tira({ pieza }: { pieza: Dato }) {
  const cuadros = Math.max(2, pieza.cw);
  const perforado = {
    backgroundImage:
      "repeating-linear-gradient(to right, rgba(226,220,208,0.5) 0 5px, rgba(0,0,0,0) 5px 13px)",
  };

  return (
    <div className="absolute inset-0 flex flex-col justify-center" style={{ background: "#17130f" }}>
      <div aria-hidden className="h-[13%] w-full shrink-0" style={perforado} />

      <div className="flex flex-1 gap-[3px] px-[3px]">
        {Array.from({ length: cuadros }, (_, i) => (
          <div key={i} className="relative flex-1 overflow-hidden">
            <Image
              src={site.fotos[indice(`${pieza.id}-${i}`, site.fotos.length)]}
              alt=""
              fill
              sizes="12vw"
              className="object-cover"
              style={{
                filter: "invert(1) grayscale(1) contrast(0.9)",
                objectPosition: `${azar(`${pieza.id}-${i}`, 3) * 70 + 15}% 50%`,
              }}
            />
          </div>
        ))}
      </div>

      <div aria-hidden className="h-[13%] w-full shrink-0" style={perforado} />
    </div>
  );
}
