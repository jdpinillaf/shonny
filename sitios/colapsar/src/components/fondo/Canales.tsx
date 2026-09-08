"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { type Pieza } from "@/content/pieza";
import { useEscritorio } from "@/lib/useEscritorio";
import { corrido, entre, indice } from "@shonny/escenografia";
import { cuadrosDeEstatica } from "./estatica";
import { medir, type Origen } from "./origen";

/**
 * Los marcos. Coordenadas en % del viewport.
 *
 * **Cuántos marcos hay es constante de maqueta; cuántas fotos hay es dato.** Los
 * televisores son 5 en escritorio y 6 en móvil pase lo que pase: las ranuras de
 * `MuroNotas.tsx` están puestas a mano encima de estos marcos, uno a uno. Si el
 * número de marcos pasara a depender de cuántas fotos haya subido la gente, los
 * papeles dejarían de caer sobre sus marcos y el collage de móvil se deshace. Lo
 * único que crece con la colección es de dónde sacan la imagen.
 *
 * El centro queda libre (ahí van la pregunta, el input y la card) y la franja
 * de arriba al centro también: es donde aterriza la nota que escribe la
 * persona, y es el único momento de la página en que algo tiene que leerse
 * sobre fondo limpio.
 */
type Marco = { id: string; x: string; y: string; w: string; h: string };

/**
 * Los `id` son los mismos que los de móvil, y en el mismo orden, **a propósito**.
 * El servidor pinta la maqueta de móvil (ver `useEscritorio`) y escritorio la
 * cambia al hidratar: como cada marco conserva su `id`, y el `id` es la `key`,
 * React reutiliza el mismo `<Canal>` en vez de desmontarlo y montar otro. Le
 * cambia de sitio y de tamaño y nada más — el `id` también es lo que elige la
 * foto (`indice(marco.id, …)`), así que la URL de la imagen tampoco cambia y no
 * se pide ni un byte de más. Con ids distintos, escritorio bajaría cinco fotos
 * para tirarlas y bajar otras cinco.
 */
const MARCOS_ESCRITORIO: Marco[] = [
  { id: "m1", x: "2%", y: "6%", w: "20vw", h: "30vh" },
  { id: "m2", x: "13%", y: "56%", w: "17vw", h: "27vh" },
  { id: "m3", x: "76%", y: "10%", w: "21vw", h: "32vh" },
  { id: "m4", x: "80%", y: "58%", w: "18vw", h: "28vh" },
  { id: "m5", x: "52%", y: "78%", w: "16vw", h: "24vh" },
];

/**
 * Móvil no es escritorio recortado: es un collage propio, con sus fotos y las
 * notas encima (las ranuras que las tapan están en `MuroNotas.tsx`, en el mismo
 * orden). La lista va de mejor a peor, así que `?fotos=1` enseña la mejor
 * colocación sola y cada número que subes añade la siguiente.
 *
 * Dos montones, arriba y abajo, y el medio libre. **La pantalla más baja
 * manda**: estos porcentajes son del alto del viewport, pero el papel mide en px
 * y encima crece cuando la pantalla es estrecha, porque el texto se envuelve
 * más. En un 320x700 el centro sube y el papel baja a la vez. Comprobar siempre
 * a 320x700, no a 375x812.
 *
 * Lo demás que hay que dejar en paz:
 *
 * - El medio (y 36-64%): placa, pregunta, input y después la card.
 * - El velo de `Museo.tsx` llega a 0.92 de negro en el centro y no se apaga
 *   hasta los bordes, así que todo lo que se acerque al medio se ve mucho más
 *   oscuro de lo que sugieren estos porcentajes. Se mira con los ojos.
 * - `m4` y `m6` son los que más se acercan al bloque central de contenido, que
 *   sí recibe clicks. Al tocarlos hay que comprobar que siguen siendo tocables.
 *
 * El ancho tiene suelo: los `minWidth`/`minHeight` de `Canal` pisan al vw/vh en
 * pantalla chica. Por debajo de ~34vw bajar el número deja de tener efecto.
 */
const PIEZAS_MOVIL = [
  { id: "m1", x: -6, y: 1, w: "52vw", h: "24vh" },
  { id: "m2", x: 52, y: 67, w: "50vw", h: "23vh" },
  { id: "m3", x: -4, y: 74, w: "48vw", h: "22vh" },
  { id: "m4", x: 46, y: 3, w: "46vw", h: "21vh" },
  { id: "m5", x: 22, y: 66, w: "44vw", h: "19vh" },
  { id: "m6", x: 14, y: 17, w: "42vw", h: "15vh" },
];

const MARCOS_MOVIL: Marco[] = PIEZAS_MOVIL.map((p) => ({
  id: p.id,
  w: p.w,
  h: p.h,
  ...corrido(p.id, p.x, p.y),
}));

/** Cuántas fotos entran en móvil. Se tantea con `?fotos=`. */
export const FOTOS_MOVIL = 5;
export const TOPE_FOTOS = MARCOS_MOVIL.length;

/**
 * Cuando entra el disco, el collage de móvil se apaga.
 *
 * En escritorio el centro se libera y ya, pero en móvil el bloque del disco baja
 * hasta el 86% y le cae justo encima al montón de abajo: el "COLAPSAR / SHONNY"
 * se vuelve ilegible sobre una pila de papeles. Apagarlo también cuenta bien lo
 * que pasa ahí — el museo se apaga y queda la canción.
 *
 * Va en CSS y no en motion porque envuelve el árbol entero: una transición de
 * opacidad sobre un contenedor es gratis, y `MotionConfig` no llega hasta acá.
 */
export const ATENUAR = (apagado: boolean) => ({
  opacity: apagado ? 0.22 : 1,
  transition: "opacity 1.6s ease-out",
});

const DURACION_CORTE = 150; // ms de estática al cambiar de canal

function Estatica({ activa }: { activa: boolean }) {
  const cuadros = useMemo(() => cuadrosDeEstatica(), []);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!activa || cuadros.length === 0) return;
    let raf = 0;
    const loop = () => {
      setTick((t) => t + 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [activa, cuadros.length]);

  if (!activa || cuadros.length === 0) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-20"
      style={{
        backgroundImage: `url(${cuadros[tick % cuadros.length]})`,
        backgroundSize: "180px 180px",
        opacity: 0.72,
      }}
    />
  );
}

function Canal({
  marco,
  pool,
  quieto,
  primera,
  onAbrir,
  huecoId,
}: {
  marco: Marco;
  pool: readonly Pieza[];
  quieto: boolean;
  primera: boolean;
  onAbrir: (origen: Origen) => void;
  /** La pieza que está abierta en grande, si la hay. Solo la sabe comparar el marco. */
  huecoId: string | null;
}) {
  const total = pool.length;
  const cuadro = useRef<HTMLButtonElement>(null);
  const [foto, setFoto] = useState(() => indice(marco.id, Math.max(total, 1)));
  const [cortando, setCortando] = useState(false);

  // Cada marco lleva su propio reloj. Si compartieran uno, todos cortarían a la
  // vez y dejaría de parecer un cuarto con varios televisores prendidos.
  useEffect(() => {
    // Con una sola foto no hay a dónde cortar, y con ninguna la cuenta de abajo
    // da NaN: `% 0` no existe y `total - 1` se vuelve negativo.
    if (quieto || total < 2) return;
    let corte: ReturnType<typeof setTimeout>;
    let siguiente: ReturnType<typeof setTimeout>;

    const programar = (ms: number) => {
      siguiente = setTimeout(() => {
        setCortando(true);
        corte = setTimeout(() => {
          setFoto((f) => (f + 1 + Math.floor(Math.random() * (total - 1))) % total);
          setCortando(false);
          programar(5600 + Math.random() * 6200);
        }, DURACION_CORTE);
      }, ms);
    };

    // La base por marco es fija para que nunca corten dos a la vez; el sumando
    // al azar evita que todas las visitas vean el mismo corte en el mismo
    // segundo (y que una captura de pantalla siempre agarre la misma estática).
    programar(entre(marco.id, 1800, 8200, 3) + Math.random() * 2600);
    return () => {
      clearTimeout(corte);
      clearTimeout(siguiente);
    };
  }, [marco.id, total, quieto]);

  // La colección crece: si se aprueba una pieza mientras alguien mira la página,
  // el índice que tenía este marco puede quedar fuera de rango.
  const pieza = pool[foto % Math.max(total, 1)];
  if (!pieza?.foto) return null;

  const abrir = () => {
    // Se mide **el marco**, no el div de dentro: ese está a mitad de la deriva
    // ken-burns, con un scale animado, y su rectángulo no es el que se ve.
    const el = cuadro.current;
    if (el) onAbrir(medir(el, pieza, 0));
  };

  return (
    <button
      ref={cuadro}
      type="button"
      onClick={abrir}
      aria-label={pieza.texto ? `Abrir pieza: ${pieza.texto}` : "Abrir foto del museo"}
      className="canal scanlines pointer-events-auto absolute cursor-pointer overflow-hidden"
      style={
        {
          left: marco.x,
          top: marco.y,
          width: marco.w,
          height: marco.h,
          minWidth: 128,
          minHeight: 168,
          boxShadow: "0 0 0 1px rgba(242,240,234,0.07), 0 30px 90px rgba(0,0,0,0.6)",
          // Igual que el papel: `opacity` y no `visibility`, para que el marco
          // siga siendo enfocable y se le pueda devolver el foco al cerrar.
          //
          // El relleno `backwards` de `.canal` manda sobre esto mientras el
          // televisor se enciende, y al acabar suelta y vuelve a mandar el
          // `huecoId`. Son los tres primeros segundos: para abrir una pieza hay
          // que tocarla, y no da tiempo.
          opacity: pieza.id === huecoId ? 0 : 1,
          // Cuándo se enciende este televisor. Sale de la semilla de su `id`,
          // igual que su deriva y su reloj de cortes, así que la misma pantalla
          // se enciende siempre en el mismo orden.
          //
          // Los televisores van **primero y despacio**: son lo que emerge de la
          // oscuridad, y todo lo demás está temporizado detrás de ellos (las
          // notas en `Nota.tsx`, el recuento y el titular en `Pregunta.tsx`).
          // Duran más que su propio retardo a propósito — el último acaba de
          // encenderse pasados cuatro segundos, con la página ya legible, así que
          // el fondo sigue moviéndose cuando ya se está leyendo.
          "--canal-retardo": `${entre(marco.id, 0.25, 1.5, 8).toFixed(2)}s`,
          "--canal-dur": `${entre(marco.id, 2, 2.8, 9).toFixed(2)}s`,
        } as React.CSSProperties
      }
    >
      <div
        aria-hidden
        className="canal-img absolute inset-0"
        style={
          {
            "--dx": `${entre(marco.id, -22, 22, 1).toFixed(1)}px`,
            "--dy": `${entre(marco.id, -26, 26, 2).toFixed(1)}px`,
            "--dur": `${entre(marco.id, 24, 34, 4).toFixed(1)}s`,
            "--retardo": `-${entre(marco.id, 0, 20, 5).toFixed(1)}s`,
            // El roll horizontal del corte: la imagen se desplaza y se estira un
            // pelo, como cuando la señal pierde sincronía vertical.
            translate: cortando ? `${entre(marco.id, -14, 14, 6).toFixed(0)}px 0` : "0 0",
            scale: cortando ? "1.04 1.09" : "1 1",
            transition: cortando ? "none" : "translate 220ms ease-out, scale 220ms ease-out",
          } as React.CSSProperties
        }
      >
        <Image
          src={pieza.foto.url}
          alt=""
          fill
          // El marco de escritorio mide ~384px. Con `24vw` una pantalla de 1920
          // resolvía a ~921px y el navegador pedía la variante de 1080w — un
          // reescalado hacia arriba del original, para una caja de un tercio.
          sizes="(max-width: 767px) 55vw, 400px"
          // Van en gris, oscurecidas, bajo viñeta, grano y scanlines. A 50 no se
          // distingue del default de 75 y pesan un tercio menos. La calidad hay
          // que declararla en `next.config.ts`: Next 16 rechaza las que no estén.
          quality={50}
          className="object-cover"
          // El gris va también en el archivo de las fotos de semilla, pero el
          // filtro se queda: por acá pasan además las fotos que sube la gente,
          // que llegan a color desde Blob. Gris sobre gris no hace nada.
          style={{ filter: "grayscale(1) contrast(1.16) brightness(0.74)" }}
          // Solo la primera, para no precargar de más. Ahora sí sirve de algo:
          // desde que `Canales` monta una sola maqueta, todas las que se piden
          // son las que se ven.
          priority={primera}
        />
      </div>

      <Estatica activa={cortando} />

      {/* Viñeta: hunde los bordes para que el marco no se vea recortado con tijera. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-30"
        style={{
          background:
            "radial-gradient(120% 100% at 50% 45%, rgba(11,13,12,0) 40%, rgba(11,13,12,0.72) 100%)",
        }}
      />
    </button>
  );
}

export function Canales({
  pool,
  quieto,
  fotos,
  apagado,
  onAbrir,
  huecoId,
}: {
  /** Las piezas que traen foto. Los marcos son fijos; esto es lo que crece. */
  pool: readonly Pieza[];
  quieto: boolean;
  fotos: number;
  apagado: boolean;
  onAbrir: (origen: Origen) => void;
  huecoId: string | null;
}) {
  const escritorio = useEscritorio();

  if (pool.length === 0) return null;

  // En el servidor y en el primer render del cliente esto es `false`: se pinta la
  // maqueta de móvil. Es lo que devuelve las fotos al HTML —y con la primera, su
  // `<link rel=preload>`— para que empiecen a bajar con el documento en vez de
  // después de hidratar. Escritorio las recoloca sin volver a pedirlas: los ids
  // coinciden con los de móvil, así que son los mismos marcos cambiados de sitio.
  const marcos = escritorio ? MARCOS_ESCRITORIO : MARCOS_MOVIL.slice(0, fotos);

  return (
    // El contenedor no puede llevar `aria-hidden`: dentro hay botones enfocables
    // y un subárbol oculto con foco dentro es la violación `aria-hidden-focus`.
    // Lo decorativo se esconde pieza a pieza, ahí dentro.
    //
    // Sí sigue siendo `pointer-events-none`: ocupa la pantalla entera y sin eso
    // se comería los clicks de todo lo demás. Cada marco los reactiva.
    <div className="pointer-events-none fixed inset-0 z-0">
      {/* El atenuado es solo del collage de móvil: en escritorio los
          televisores están lejos del contenido y no estorban. */}
      <div style={escritorio ? undefined : ATENUAR(apagado)}>
        {marcos.map((m, i) => (
          <Canal
            key={m.id}
            marco={m}
            pool={pool}
            quieto={quieto}
            primera={i === 0}
            onAbrir={onAbrir}
            huecoId={huecoId}
          />
        ))}
      </div>
    </div>
  );
}
