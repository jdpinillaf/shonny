"use client";

import Image from "next/image";
import { site } from "@/content/site";
import { entre } from "@/lib/semilla";

const PIEZAS = [0, 2, 4, 6, 7];

/**
 * Plan B cuando el navegador no da WebGL2 con render a float.
 *
 * No intenta imitar el agua: es el mismo lecho de fotos, en azul y desenfocado,
 * con un par de anillos de onda. El guion de la página no cambia en nada.
 */
export function RioSinAgua({ quieto }: { quieto: boolean }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{ background: "var(--color-hondo)" }}
    >
      {PIEZAS.map((n, i) => {
        const semilla = `sinagua-${i}`;
        return (
          <div
            key={n}
            className="absolute"
            style={{
              left: `${entre(semilla, -8, 78, 1).toFixed(1)}%`,
              top: `${entre(semilla, -10, 72, 2).toFixed(1)}%`,
              width: `${entre(semilla, 26, 44, 3).toFixed(1)}vw`,
              height: `${entre(semilla, 40, 66, 4).toFixed(1)}vh`,
              transform: `rotate(${entre(semilla, -18, 18, 5).toFixed(1)}deg)`,
              opacity: entre(semilla, 0.3, 0.6, 6),
              filter: "grayscale(1) brightness(0.55) blur(2px)",
            }}
          >
            <Image src={site.fotos[n]} alt="" fill sizes="40vw" className="object-cover" />
          </div>
        );
      })}

      {/* Tinte azul sobre todo: es lo que iguala esta versión con la del shader. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 42%, rgba(22,60,92,0.5), rgba(5,9,14,0.94) 70%)",
          mixBlendMode: "hard-light",
        }}
      />
      <div
        className="absolute inset-0"
        style={{ background: "rgba(6,14,22,0.55)" }}
      />

      {!quieto &&
        [0, 1].map((i) => (
          <span
            key={i}
            className="anillo absolute rounded-full border"
            style={{
              left: "50%",
              top: "42%",
              borderColor: "rgba(143,182,201,0.28)",
              animationDelay: `${1.6 + i * 2.4}s`,
            }}
          />
        ))}
    </div>
  );
}
