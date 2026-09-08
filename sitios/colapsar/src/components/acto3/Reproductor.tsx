"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { site } from "@/content/site";
import { evento } from "@/lib/analitica";

const SUAVE = [0.16, 1, 0.3, 1] as const;

/**
 * Alto oficial del embed compacto de Spotify. Vive acá y no suelto en la clase
 * porque el hueco que se reserva antes de cargar tiene que medir exactamente lo
 * mismo que el marco, o la caja salta cuando termina.
 */
const ALTO = 152;

/**
 * La canción, sonando dentro de la página.
 *
 * Reemplaza a la card dibujada a mano (`CardSpotify`), que imitaba un
 * reproductor mientras la canción todavía no existía: portada, círculo verde y
 * una barra que avanzaba sin ir atada a nada. Ya salió, así que en vez de
 * parecerlo, suena.
 *
 * **Lo que oye cada quien no lo decidimos nosotros**: sin sesión de Spotify en
 * ese navegador son 20s de adelanto; con sesión abierta, los 3:32 enteros. Lo
 * manda su cookie de `open.spotify.com`.
 *
 * El halo se queda. Es la copia desenfocada y saturada de la portada, y era lo
 * que hacía del acto 3 el único objeto a color de la página: el embed por sí
 * solo es una caja gris de Spotify como cualquier otra.
 */
export function Reproductor({
  emerge = false,
  onSuena,
}: {
  /** Lo enciende el río: el reproductor sale del agua en vez de solo subir. */
  emerge?: boolean;
  /**
   * Se llama la primera vez que la persona toca el marco de Spotify. Lo usa
   * `Museo` para callar el adelanto de la casa.
   */
  onSuena?: () => void;
}) {
  const marco = useRef<HTMLIFrameElement>(null);
  const yaSono = useRef(false);
  const [listo, setListo] = useState(false);

  // No hay forma de escuchar el play de Spotify sin cargar su IFrame API, que
  // es otro script de terceros en la única página que tenemos. Esto es el truco
  // barato: un click dentro de un iframe le quita el foco a la ventana y deja
  // el propio iframe como `activeElement`. Cambiar de pestaña también dispara
  // `blur`, pero ahí el `activeElement` es el `body`, así que la guarda basta.
  //
  // El precio de hacerlo así: si tocan el marco sin darle al play —los tres
  // puntos, el "Save on Spotify"— igual se calla lo nuestro. Se asume: quien
  // toca esa caja vino a oír la canción, no el fondo.
  useEffect(() => {
    const alPerderElFoco = () => {
      if (yaSono.current || document.activeElement !== marco.current) return;
      yaSono.current = true;
      evento("spotify tocado");
      onSuena?.();
    };

    window.addEventListener("blur", alPerderElFoco);
    return () => window.removeEventListener("blur", alPerderElFoco);
  }, [onSuena]);

  return (
    <motion.div
      className="relative w-full max-w-[352px]"
      initial={
        emerge
          ? { opacity: 0, y: 78, scale: 0.9, filter: "blur(22px)" }
          : { opacity: 0, y: 54, scale: 0.94 }
      }
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      transition={{ duration: emerge ? 1.8 : 1.05, ease: SUAVE }}
    >
      {/* Halo: la portada otra vez, desenfocada y por detrás.
          La máscara radial es obligatoria — sin ella el desenfoque termina en
          un borde recto y el halo se lee como un panel gris, no como luz.

          Cuadrado y centrado a mano, no el `-inset-24` que llevaba la card: la
          card era 352×352 y estirar la máscara a sus bordes daba un círculo. El
          embed es 352×152, y con `inset` el mismo halo salía como una elipse
          aplastada del ancho de la caja — se leía como una sombra, no como luz.
          Acá el halo mide lo que quiere y la caja no le impone la forma. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 aspect-square w-[132%] max-w-none -translate-x-1/2 -translate-y-1/2"
        style={{
          maskImage:
            "radial-gradient(closest-side, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%)",
          WebkitMaskImage:
            "radial-gradient(closest-side, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%)",
        }}
        initial={{ opacity: 0, scale: 0.84 }}
        animate={{ opacity: 0.9, scale: 1 }}
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

      {/* El alto va en el contenedor y no solo en el marco: así la caja mide lo
          mismo antes y después de cargar y nada salta. El `#181818` es el fondo
          del propio embed, para que el hueco vacío no se vea como un agujero. */}
      <div
        className="relative w-full overflow-hidden rounded-xl"
        style={{
          height: ALTO,
          background: "#181818",
          boxShadow: "0 26px 70px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.06)",
        }}
      >
        <iframe
          ref={marco}
          src={site.spotify.embed}
          title={`${site.cancion}, de ${site.artista}, en Spotify`}
          // `lazy` porque el acto 3 está al final de la visita: no tiene por qué
          // pesar en la pantalla donde la persona todavía está escribiendo.
          loading="lazy"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          onLoad={() => setListo(true)}
          className="block h-full w-full border-0 transition-opacity duration-500"
          style={{ opacity: listo ? 1 : 0 }}
        />
      </div>

      {/* No es adorno. Spotify hoy no manda `X-Frame-Options` en `/embed/`, pero
          el día que lo mande esto queda en un rectángulo negro sin avisar de
          nada, y esta línea es la única salida que le queda a la persona. */}
      <p className="mt-3 text-center">
        <a
          href={site.spotify.pagina}
          target="_blank"
          rel="noreferrer"
          onClick={() => evento("spotify abierto", { desde: "reproductor" })}
          className="font-mono text-[9px] uppercase tracking-[0.2em] text-humo transition-colors hover:text-tiza"
        >
          abrir en Spotify
        </a>
      </p>
    </motion.div>
  );
}
