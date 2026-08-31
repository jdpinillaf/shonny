import { CHINCHE_COLOR, sombraChinche } from "@/components/fondo/Chinche";
import { PIE, type Pieza } from "@/content/pieza";
import { site } from "@/content/site";

/**
 * La story de una pieza, dibujada para Instagram.
 *
 * Esto no es un componente de React DOM y por eso vive en `lib/` y no en
 * `components/`: lo consume Satori a través de `ImageResponse`, que entiende un
 * subconjunto de CSS y nada de hooks. Montarlo en la página no funcionaría.
 *
 * **El archivo se llamaba `pared.tsx` y dibujaba una pared**: la nota en foco
 * rodeada de otras siete apagadas, con una penumbra radial encima. Se probaron
 * las dos y ganó el negro plano; git guarda la otra. Con la pared se fueron la
 * penumbra —sobre negro liso no apagaba nada y dejaba anillos de banda— y todo
 * el reparto de notas de fondo.
 *
 * **Ni una gaussiana acá dentro.** Ni `filter: blur` ni sombras difusas: en la
 * función de Vercel costaban 14 segundos de render, catorce veces lo que cuesta
 * ahora. Ver el spec para la medida completa.
 *
 * **Lo que Satori no tiene, y que aquí se nota:** no hay pseudo-elementos, no
 * hay `grid`, no hay `inset` y `display` es siempre flex. Cambiar cualquiera de
 * esas tres cosas por la versión "normal" de CSS no da error: dibuja mal y en
 * silencio.
 */

export const ANCHO = 1080;
export const ALTO = 1920;

/**
 * A cuánto se rasteriza, antes de que `sharp` lo suba a 1080x1920.
 *
 * El coste de resvg va con el área del lienzo, así que rasterizar a 3/4 cuesta
 * poco más de la mitad. Ampliar después con lanczos son 15 ms y la diferencia
 * en un móvil no existe: Instagram recomprime y reescala la imagen igualmente.
 */
export const ESCALA = 0.75;

/**
 * Lo que Instagram tapa arriba y abajo con su propia interfaz: el nombre de la
 * cuenta por arriba, la barra de responder por abajo. Nada que haya que leer
 * puede caer dentro de esos márgenes.
 */
const ZONA_IG = 300;

const NOCHE = "#0b0d0c";
const PAPEL = "#d6d1c4";
const HUMO = "#8a8f8b";
const TINTA = "#22201c";
const TINTA_PIE = "rgba(34,32,28,0.5)";
const TINTA_BORDE = "rgba(34,32,28,0.22)";

/**
 * Lo que mide el papel, y el chinche que lo cuelga.
 *
 * Van juntos y como constantes porque el chinche se centra con una resta: con
 * el ancho escrito a mano en los dos sitios, tocar el tamaño del papel deja el
 * chinche descolocado y no lo dice nadie.
 */
const ANCHO_PAPEL = 600;
const MARGEN_PAPEL = 58;
const CHINCHE = 46;

/**
 * La letra, calcada del modal en un móvil.
 *
 * Medido en la página, no estimado: en un viewport de 390, el papel de la pieza
 * abierta mide 335 con 28 de margen a cada lado —279 útiles— y la nota va a
 * 17px. Eso es el **6,1 % del ancho útil**, y el pie el 3,05 %.
 *
 * Acá el papel deja 484 útiles, así que salen 30 y 15. Escrito como proporción
 * y no como número suelto para que cambiar `ANCHO_PAPEL` no vuelva a
 * descuadrarlo: es lo mismo que le pasó al chinche.
 */
const UTIL = ANCHO_PAPEL - MARGEN_PAPEL * 2;
const LETRA = Math.round(UTIL * 0.061);
const LETRA_PIE = Math.round(UTIL * 0.0305);

/**
 * Corta por la última palabra entera, no por el caracter n.
 *
 * Es la red de seguridad de una semilla que se pase de `site.maxRespuesta`: lo
 * que escribe la gente ya viene recortado desde la ruta que lo guarda.
 */
export function recortar(texto: string, tope: number) {
  if (texto.length <= tope) return texto;
  const corte = texto.slice(0, tope);
  const espacio = corte.lastIndexOf(" ");
  return `${espacio > 0 ? corte.slice(0, espacio) : corte}…`;
}

export function Composicion({ pieza }: { pieza: Pieza }) {
  return (
    <div
      style={{
        width: ANCHO,
        height: ALTO,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: NOCHE,
        overflow: "hidden",
        fontFamily: "Courier Prime",
      }}
    >
      {/* La placa, arriba, fuera de lo que tapa Instagram. Dice de qué es esto
          antes de que se lea la confesión, que es lo que abajo no hacía: ahí
          competía con la firma del propio papel, que ya dice «anónimo».

          El texto sale de `site.placa`, el mismo de la página. Escribirlo acá a
          mano era el cuarto sitio con la misma cadena copiada. */}
      <div
        style={{
          position: "absolute",
          top: ZONA_IG,
          left: 0,
          width: ANCHO,
          display: "flex",
          justifyContent: "center",
          fontSize: 26,
          letterSpacing: "0.34em",
          color: HUMO,
        }}
      >
        {site.placa.toUpperCase()}
      </div>

      <div
        style={{
          position: "relative",
          width: ANCHO_PAPEL,
          display: "flex",
          flexDirection: "column",
          padding: `64px ${MARGEN_PAPEL}px 48px`,
          background: PAPEL,
          color: TINTA,
          boxShadow: "6px 12px 0 rgba(0,0,0,0.5)",
          transform: "rotate(-1.4deg)",
        }}
      >
        {/* El chinche. `left` a pelo y no `50%` + `translateX`: el centro es una
            resta, no una capa más de transform que Satori tenga que componer
            con el giro del papel. */}
        <div
          style={{
            position: "absolute",
            top: -CHINCHE / 2,
            left: (ANCHO_PAPEL - CHINCHE) / 2,
            width: CHINCHE,
            height: CHINCHE,
            borderRadius: CHINCHE / 2,
            background: CHINCHE_COLOR,
            // El brillo va a 4 y no a 1: la fórmula está pensada para un chinche
            // de 7 a 11 px en pantalla, y acá mide 46 sobre un lienzo de 1080.
            // Con 1px el reflejo metálico desaparece del todo.
            boxShadow: sombraChinche(CHINCHE, 4),
          }}
        />

        <div style={{ fontSize: LETRA, lineHeight: 1.6 }}>{pieza.texto}</div>

        <div
          style={{
            marginTop: 38,
            paddingTop: 22,
            borderTop: `1px solid ${TINTA_BORDE}`,
            fontSize: LETRA_PIE,
            letterSpacing: "0.2em",
            color: TINTA_PIE,
          }}
        >
          {/* En mayúsculas desde JS y no con `textTransform`: es una cadena fija,
              y hacerlo acá es una cosa menos que depende del CSS de Satori. */}
          {PIE.toUpperCase()}
        </div>
      </div>
    </div>
  );
}
