"use client";

import { motion } from "motion/react";

/**
 * La bombilla de seguridad.
 *
 * Todo el mosaico va en `grayscale(1)`: el rojo lo pone esta capa sola, y el
 * titileo también. Treinta piezas modulando su propio color serían treinta
 * repintados por frame; así son dos compuestos y nada más.
 *
 * ⚠️ Las capas son hermanas sueltas, no hijas de un contenedor.
 * `mix-blend-mode` mezcla contra el fondo de su contexto de apilamiento: si se
 * envuelven en un div posicionado con z-index, el contexto se cierra ahí y las
 * capas se mezclarían solo entre ellas — la pared quedaría gris.
 */
export function Safelight({
  quieto,
  atenuado = false,
}: {
  quieto: boolean;
  /** Acto final: la pared se apaga para que la card sea lo único a color. */
  atenuado?: boolean;
}) {
  return (
    <>
      {/* El tinte. `overlay` empuja los grises medios hacia el rojo y deja los
          negros negros — que es justo lo que hace una luz de seguridad. */}
      {/* `soft-light` y no `overlay`. Overlay aclara lo que ya es claro: los
          papeles se iban a rosa pastel y la pared quedaba partida en dos, rosa
          arriba y gris abajo. Soft-light respeta la luminancia y solo sesga el
          tono — gris con un rojo leve, que es el encargo. Además deja los
          negros calientes, que es donde una roja de verdad se nota.
          Nunca llega a transparente: una luz de seguridad tiñe el cuarto
          entero, no la mitad de arriba. */}
      <div
        aria-hidden
        className={`pointer-events-none fixed inset-0 z-[11] ${quieto ? "" : "respirar-luz"}`}
        style={{
          background:
            "radial-gradient(150% 118% at 50% -8%, rgba(216,86,56,0.96) 0%, rgba(196,74,48,0.86) 38%, rgba(164,62,42,0.72) 70%, rgba(132,52,36,0.58) 100%)",
          mixBlendMode: "soft-light",
        }}
      />

      {/* La bombilla misma, arriba, fuera de cuadro. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[12]"
        style={{
          background:
            "radial-gradient(34% 22% at 50% -3%, rgba(206,88,56,0.34) 0%, rgba(206,88,56,0) 74%)",
          mixBlendMode: "screen",
        }}
      />

      {/* Viñeta. Va después del tinte para que hunda los bordes ya rojos. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[13]"
        style={{
          background:
            "radial-gradient(122% 94% at 50% 40%, rgba(6,4,3,0) 46%, rgba(6,4,3,0.34) 78%, rgba(6,4,3,0.72) 100%)",
        }}
      />

      {/* El titileo. Ver el aviso de fotosensibilidad en globals.css. */}
      <div
        aria-hidden
        className={`pointer-events-none fixed inset-0 z-[14] ${quieto ? "opacity-[0.12]" : "titilar"}`}
        style={{ background: "var(--color-cuarto)" }}
      />

      {/* El atenuador del acto final: la pared se hunde para que la card sea lo
          único a color de la página.
          Va DEBAJO del tinte, no encima: puesto arriba se llevaba también el
          rojo y el cuarto se volvía gris de golpe, como si fuera otra página.
          Debajo, la roja sigue prendida sobre una pared más oscura. */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[10]"
        style={{ background: "#050302" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: atenuado ? 0.68 : 0 }}
        transition={{ duration: 1.6, ease: "easeOut" }}
      />

      {/* El apagón de arranque. Cubre todo y se va cuando la roja prende.
          Corre una sola vez: va aparte del atenuador justo para eso — si
          compartieran capa, volver a la pregunta desde el disco encendería la
          bombilla otra vez. */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[16]"
        style={{ background: "#050302" }}
        initial={{ opacity: 1 }}
        animate={{ opacity: quieto ? 0 : [1, 1, 0.6, 0.84, 0.2, 0] }}
        transition={
          quieto
            ? { duration: 0.8, ease: "easeOut" }
            : // Cinco pasos en 2.4s: 2.5 cambios por segundo como mucho. La
              // norma corta en tres por segundo, y este arranque es lo único de
              // toda la página con amplitud grande. Se queda debajo a propósito.
              { duration: 2.4, times: [0, 0.25, 0.42, 0.58, 0.75, 1], ease: "easeOut" }
        }
      />
    </>
  );
}
