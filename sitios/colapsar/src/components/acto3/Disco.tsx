"use client";

import { motion } from "motion/react";
import { site } from "@/content/site";
import { evento } from "@/lib/analitica";
import { CardSpotify } from "./CardSpotify";

export function Disco({
  onGuardar,
  emerge = false,
}: {
  /** Abre la capa del smart link. Lo dueña `Museo`, no esto: ver el porqué allá. */
  onGuardar?: () => void;
  /** Lo enciende el río: la card sale del agua en vez de solo subir. */
  emerge?: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <CardSpotify emerge={emerge} onGuardar={onGuardar} />

      {/* Frase y botón van acá y no dentro del `<a>` de la card: ese enlace lleva
          un `aria-label`, y un `aria-label` tapa todo el texto que haya dentro.
          La frase, que es la que explica de qué va esto, sería invisible para un
          lector de pantalla justo por estar donde parecía que tocaba.

          El título grande COLAPSAR / SHONNY que iba debajo se quitó: la card ya
          dice las dos cosas justo encima. */}
      <motion.div
        className="mt-4 flex w-full max-w-[352px] flex-col items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.9, delay: 0.75 }}
      >
        <p className="glow-suave text-balance text-center font-serif text-[clamp(0.95rem,3.6vw,1.15rem)] leading-snug text-tiza/90">
          {site.anuncio}
        </p>

        {/* Un `<a>` y no un `<button>`: el `href` de verdad es lo que hace que
            esto siga funcionando sin JS, igual que la card. El `preventDefault`
            solo entra si hay capa que abrir. */}
        <a
          href={site.presave}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => {
            evento("presave abierto", { desde: "boton" });
            if (!onGuardar) return;
            e.preventDefault();
            onGuardar();
          }}
          // Borde a 45 y texto en tiza, no el 25 apagado que llevaba "deja otra
          // cosa que nunca pasó": aquello era la acción secundaria y esta es la
          // única que queda en la pantalla.
          className="mt-5 border border-tiza/45 bg-noche/90 px-5 py-2.5 font-mono text-[9.5px] uppercase tracking-[0.24em] text-tiza transition-colors hover:border-tiza/75"
        >
          {site.llamada}
        </a>
      </motion.div>
    </div>
  );
}
