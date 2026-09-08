"use client";

import { motion } from "motion/react";
import { site } from "@/content/site";
import { evento } from "@/lib/analitica";
import { Reproductor } from "./Reproductor";

export function Disco({
  onGuardar,
  onSuena,
  emerge = false,
}: {
  /** Abre la capa del smart link. Lo dueña `Museo`, no esto: ver el porqué allá. */
  onGuardar?: () => void;
  /** Calla el adelanto de la casa cuando arranca Spotify. También lo dueña `Museo`. */
  onSuena?: () => void;
  /** Lo enciende el río: el reproductor sale del agua en vez de solo subir. */
  emerge?: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <Reproductor emerge={emerge} onSuena={onSuena} />

      {/* El título grande COLAPSAR / SHONNY que iba acá se quitó hace tiempo: el
          reproductor ya dice las dos cosas justo encima.

          La frase y el botón siguen siendo hermanos del reproductor y no hijos
          suyos: el embed es un iframe de Spotify y nada nuestro puede vivir
          dentro. */}
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
          // Borde a 25 y no a 45: dejó de ser la única acción de la pantalla. El
          // play del reproductor es lo que se aprieta ahora, y esto es la puerta
          // a las otras seis plataformas — secundario, y se tiene que ver así.
          className="mt-5 border border-tiza/25 bg-noche/90 px-5 py-2.5 font-mono text-[9.5px] uppercase tracking-[0.24em] text-tiza transition-colors hover:border-tiza/60"
        >
          {site.llamada}
        </a>
      </motion.div>
    </div>
  );
}
