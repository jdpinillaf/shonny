"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { site } from "@/content/site";
import { evento } from "@/lib/analitica";

const SUAVE = [0.16, 1, 0.3, 1] as const;

/**
 * El único objeto a color de toda la página.
 *
 * El museo está en gris porque son cosas que no pasaron. El disco llega en
 * color porque es lo único que sí existe: la portada entra en blanco y negro y
 * se satura, y el halo detrás es una copia desenfocada de ella misma — el color
 * literalmente se sale del disco.
 */
/**
 * `emerge` la hace salir del agua: desde más abajo, más chica y desenfocada.
 * Apagado por default a propósito — la landing #1 usa esta misma card y su
 * entrada ya está aprobada.
 */
export function CardSpotify({ emerge = false }: { emerge?: boolean }) {
  return (
    <motion.a
      href={site.presave.spotify}
      target="_blank"
      rel="noreferrer"
      className="relative block w-full max-w-[352px] focus:outline-none"
      // El único click que la página pide de verdad. Autocapture también lo ve,
      // pero con nombre propio entra en un embudo sin tener que filtrar por
      // href entre todos los clicks del museo.
      onClick={() => evento("spotify abierto")}
      initial={
        emerge
          ? { opacity: 0, y: 78, scale: 0.9, filter: "blur(22px)" }
          : { opacity: 0, y: 54, scale: 0.94 }
      }
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      transition={{ duration: emerge ? 1.8 : 1.05, ease: SUAVE }}
      whileHover={{ y: -5 }}
      whileFocus={{ y: -5 }}
    >
      {/* Halo: la portada otra vez, desenfocada y por detrás.
          La máscara radial es obligatoria — sin ella el desenfoque termina en
          un borde recto y el halo se lee como un panel gris, no como luz. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-24 -z-10"
        style={{
          maskImage:
            "radial-gradient(closest-side, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%)",
          WebkitMaskImage:
            "radial-gradient(closest-side, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%)",
        }}
        initial={{ opacity: 0, scale: 0.84 }}
        animate={{ opacity: 0.85, scale: 1 }}
        transition={{ duration: 2, delay: 0.5, ease: "easeOut" }}
      >
        <Image
          src={site.portada}
          alt=""
          fill
          sizes="560px"
          className="object-cover"
          style={{ filter: "blur(62px) saturate(2.4) brightness(1.2)" }}
        />
      </motion.div>

      <div
        className="relative overflow-hidden p-3"
        style={{
          background: "#181818",
          boxShadow: "0 26px 70px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.06)",
        }}
      >
        <div className="relative aspect-square w-full overflow-hidden">
          <motion.div
            className="absolute inset-0"
            initial={{ filter: "grayscale(1) brightness(0.7) saturate(1)" }}
            animate={{ filter: "grayscale(0) brightness(1.04) saturate(1.18)" }}
            transition={{ duration: 1.6, delay: 0.5, ease: "easeOut" }}
          >
            <Image
              src={site.portada}
              alt={`Portada de ${site.cancion}, de ${site.artista}`}
              fill
              sizes="330px"
              className="object-cover"
              // Sin `priority`: la card vive en el acto 3, no en la primera
              // pintada. Lo único que hacía era colarse en la cola de descargas
              // por delante de las fotos que sí se están viendo.
            />
          </motion.div>
        </div>

        <div className="mt-3.5 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-mono text-[15px] font-bold tracking-tight text-white">
              {site.cancion}
            </p>
            <p className="mt-0.5 truncate font-mono text-[12px] text-[#a7a7a7]">
              {site.artista}
            </p>
          </div>

          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            style={{ background: "#1db954" }}
          >
            <svg width="12" height="14" viewBox="0 0 12 14" aria-hidden>
              <path d="M0 0.5 L12 7 L0 13.5 Z" fill="#000" />
            </svg>
          </span>
        </div>

        {/* La barra recorre el adelanto entero y vuelve a empezar. No va atada
            al audio de verdad: la canción arranca con el primer gesto de la
            visita, mucho antes de que esta card se monte, así que sincronizarlas
            pediría cablear `useSonido` hasta acá. Es decoración y se asume. */}
        <div className="mt-3.5 h-[3px] w-full overflow-hidden bg-white/15">
          <motion.div
            className="h-full bg-white/85"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{
              duration: site.adelanto.segundos,
              ease: "linear",
              repeat: Infinity,
              delay: 1,
            }}
          />
        </div>
        <div className="mt-1.5 flex justify-between font-mono text-[9px] text-[#a7a7a7]">
          <span>0:00</span>
          <span>adelanto · {site.adelanto.reloj}</span>
        </div>
      </div>
    </motion.a>
  );
}
