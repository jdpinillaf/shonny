"use client";

import { motion } from "motion/react";
import { site } from "@/content/site";
import { CardSpotify } from "./CardSpotify";

const SUAVE = [0.16, 1, 0.3, 1] as const;

export function Disco({
  onOtraVez,
  onGuardar,
  emerge = false,
}: {
  onOtraVez: () => void;
  /** Abre la capa del smart link. Lo dueña `Museo`, no esto: ver el porqué allá. */
  onGuardar?: () => void;
  /** Lo enciende el río: la card sale del agua en vez de solo subir. */
  emerge?: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <CardSpotify emerge={emerge} onGuardar={onGuardar} />

      <motion.div
        className="mt-8 text-center"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.75, ease: SUAVE }}
      >
        <p className="glow font-serif text-[clamp(2.2rem,7vw,3.6rem)] uppercase leading-none tracking-[0.02em]">
          {site.cancion}
        </p>
        {/* El nombre va grande, no como pie de foto: el glow más suave y el
            tracking abierto lo sostienen debajo del título sin competirle. */}
        <p className="glow-suave mt-4 font-serif text-[clamp(1.05rem,3.2vw,1.65rem)] uppercase leading-none tracking-[0.34em] text-tiza/90">
          {site.artista}
        </p>
      </motion.div>

      <motion.div
        className="mt-6 flex flex-col items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.9, delay: 1.25 }}
      >
        {/* Acá colgaba un "también en Apple Music" que nunca llevó a ningún
            lado. Ya no hace falta: la card abre el smart link y ahí están las
            siete plataformas, Apple incluida. */}

        {/* Es la invitación a seguir dejando cosas, no una nota al pie: si va en
            gris de 8px sobre una pared llena de papeles, no la ve nadie. */}
        <button
          type="button"
          onClick={onOtraVez}
          className="border border-tiza/25 bg-noche/70 px-5 py-2.5 font-mono text-[9.5px] uppercase tracking-[0.24em] text-tiza/85 transition-colors hover:border-tiza/60 hover:text-tiza"
        >
          deja otra cosa que nunca pasó
        </button>
      </motion.div>
    </div>
  );
}
