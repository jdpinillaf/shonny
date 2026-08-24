"use client";

import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import { site } from "@/content/site";

const SUAVE = [0.16, 1, 0.3, 1] as const;

/**
 * El smart link, dentro de la página.
 *
 * La alternativa era mandar a la persona a `sym.ffm.to` en una pestaña nueva y
 * que el museo se quedara atrás. Acá la página de Feature.fm entra en una capa
 * y el sitio sigue debajo.
 *
 * **Esto es un experimento y tiene un techo conocido**: `accounts.spotify.com`
 * manda `x-frame-options: deny`, así que el login de Spotify no puede pintarse
 * aquí dentro. Lo que haga el botón de Pre-Save —irse en `_top` y llevarse la
 * página, o abrir un popup que el navegador puede bloquear— es justo lo que hay
 * que mirar antes de quedarse con esta rama.
 */
export function Guardar({ onCerrar }: { onCerrar: () => void }) {
  const cerrar = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [onCerrar]);

  // El foco entra al botón de cerrar y vuelve a donde estaba al salir. Sin la
  // vuelta, cerrar con Escape deja el foco en el `body` y el siguiente tabulador
  // arranca desde arriba de la página, no desde la card que se acaba de pulsar.
  useEffect(() => {
    const antes = document.activeElement as HTMLElement | null;
    cerrar.current?.focus();
    return () => antes?.focus();
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Guardar ${site.cancion}`}
      // Entre el contenido (z-30) y la película (z-40): el grano y el barrido van
      // sobre absolutamente todo, esta capa incluida.
      className="fixed inset-0 z-[35]"
    >
      {/* Sin `backdrop-filter`, por lo mismo que el mural: filtrar el viewport
          entero es lo más caro que puede hacer esta pantalla. El negro tapa. */}
      <motion.div
        className="absolute inset-0 bg-noche/92"
        onClick={onCerrar}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      />

      <div className="pointer-events-none absolute inset-0 grid place-items-center px-4">
        <motion.div
          // `w-full` y no `min(96vw,...)`: el contenedor de arriba ya pone `px-4`, y
          // un ancho en `vw` no lo descuenta — a 320px la caja se salía 19px por
          // la derecha y cortaba los botones de ffm.
          className="pointer-events-auto w-full max-w-[460px]"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10, transition: { duration: 0.3 } }}
          transition={{ duration: 0.55, ease: SUAVE }}
        >
          <div className="relative mb-3 text-center">
            <p className="placa text-[9px] tracking-[0.24em] md:text-[11px] md:tracking-[0.34em]">
              {site.cancion}
            </p>

            <button
              ref={cerrar}
              type="button"
              onClick={onCerrar}
              aria-label="Cerrar"
              className="absolute -top-1 right-0 h-8 w-8 cursor-pointer font-mono text-[18px] leading-none text-tiza/55 transition-colors hover:text-tiza"
            >
              ×
            </button>
          </div>

          {/* La página de ffm mide 1315px de alto —arranca con la portada a
              tamaño completo y las plataformas van debajo— así que acá dentro
              siempre va a haber scroll. Se le da todo el alto que se pueda sin
              comerse el respiradero de la capa; menos de esto y no se ve ni una
              plataforma sin arrastrar. */}
          <iframe
            src={site.presave}
            title={`Guardar ${site.cancion}, de ${site.artista}`}
            className="block w-full border-0 bg-noche"
            style={{ height: "min(78vh, 620px)" }}
          />

          {/* No es adorno. Feature.fm hoy no manda `X-Frame-Options`, pero el día
              que lo mande esto queda en un rectángulo en blanco sin avisar de
              nada, y esta línea es la única salida que le queda a la persona. */}
          <p className="mt-3 text-center">
            <a
              href={site.presave}
              target="_blank"
              rel="noreferrer"
              className="border-b border-humo/35 pb-0.5 font-mono text-[11px] text-humo transition-colors hover:border-tiza/60 hover:text-tiza"
            >
              abrir en una pestaña
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
