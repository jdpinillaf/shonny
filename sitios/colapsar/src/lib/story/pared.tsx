import { PIE } from "@/content/pieza";
import { type Pieza } from "@/content/pieza";
import { azar } from "@/lib/semilla";

/**
 * La pared, dibujada para Instagram.
 *
 * Esto no es un componente de React DOM y por eso vive en `lib/` y no en
 * `components/`: lo consume Satori a través de `ImageResponse`, que entiende un
 * subconjunto de CSS y nada de hooks. Montarlo en la página no funcionaría.
 *
 * **Ni una gaussiana acá dentro.** Ni `filter: blur`, ni sombras difusas, ni el
 * degradado de la penumbra: todo eso lo hace `sharp` después, donde cuesta
 * milisegundos en vez de segundos. Ver `TINTA_LEJOS` para la medida.
 *
 * **Lo que Satori no tiene, y que aquí se nota:** no hay pseudo-elementos —la
 * penumbra es un `<div>` de verdad, no un `::before`—, no hay `grid`, no hay
 * `inset` y `display` es siempre flex. Cambiar cualquiera de esas tres cosas por
 * la versión "normal" de CSS no da error: dibuja mal y en silencio.
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

const NOCHE = "#0b0d0c";
const PAPEL = "#d6d1c4";
const TIZA = "#f2f0ea";
const TINTA = "#22201c";
/**
 * La tinta de las notas del fondo.
 *
 * Aquí había un `filter: blur(3px)`, que es lo que pedía el boceto. Se cayó por
 * medida, no por gusto: la gaussiana costaba 800 ms de los 1900 del render en
 * esta máquina, y la función de Vercel es siete veces más lenta. Da igual que
 * sean siete filtros pequeños o uno grande envolviéndolos —se probaron los
 * dos—, porque el coste va con el área, no con el número.
 *
 * La profundidad la dan ahora el contraste y la penumbra que aplica `sharp`.
 */
const TINTA_LEJOS = "rgba(34,32,28,0.5)";
const TINTA_PIE = "rgba(34,32,28,0.5)";
const TINTA_BORDE = "rgba(34,32,28,0.22)";

/** Dónde cuelga cada nota del fondo. A mano: el azar acá no aporta nada. */
const HUECOS = [
  { top: 128, left: 470, giro: 1.5 },
  { top: 232, left: 74, giro: -4 },
  { top: 356, left: 694, giro: 3 },
  { top: 592, left: -36, giro: 2 },
  { top: 1222, left: 712, giro: -3 },
  { top: 1348, left: 96, giro: 3.5 },
  { top: 1512, left: 540, giro: -1.5 },
] as const;

/** Lo que se ve de una nota del fondo antes de que el desenfoque la coma. */
const CORTE_FONDO = 64;

/**
 * Corta por la última palabra entera, no por el caracter n.
 *
 * Las del fondo están desenfocadas, pero no tanto: partir «desayu…» a la mitad
 * se lee como un fallo del generador, no como profundidad de campo. Y para el
 * texto principal es la red de seguridad de una semilla que se pase de 140.
 */
export function recortar(texto: string, tope: number) {
  if (texto.length <= tope) return texto;
  const corte = texto.slice(0, tope);
  const espacio = corte.lastIndexOf(" ");
  return `${espacio > 0 ? corte.slice(0, espacio) : corte}…`;
}

/**
 * Las siete notas que rodean a la protagonista.
 *
 * **La semilla lleva dentro el id de la protagonista.** Sin eso, todas las
 * stories saldrían con la misma pared de fondo; con eso, cada pieza tiene su
 * pared y siempre la misma. Y como no hay `Math.random` de por medio, dos
 * peticiones de la misma story dan el mismo píxel, que es lo que deja cachearla.
 */
export function paredDe(
  id: string,
  piezas: readonly Pieza[],
  cuantas: number = HUECOS.length,
): Pieza[] {
  return piezas
    .filter((p) => p.id !== id && p.texto)
    .map((pieza) => ({ pieza, orden: azar(`pared-${id}-${pieza.id}`) }))
    .sort((a, b) => a.orden - b.orden)
    .slice(0, cuantas)
    .map((n) => n.pieza);
}

export function Pared({ pieza, fondo }: { pieza: Pieza; fondo: readonly Pieza[] }) {
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
      {/* El orden en el que van escritas es el orden en el que se pintan: Satori
          no tiene z-index. Fondo, penumbra encima, y la protagonista al final. */}
      {fondo.map((n, i) => {
        const hueco = HUECOS[i];
        if (!hueco) return null;
        return (
          <div
            key={n.id}
            style={{
              position: "absolute",
              top: hueco.top,
              left: hueco.left,
              width: 330,
              display: "flex",
              padding: "34px 30px 26px",
              background: PAPEL,
              color: TINTA,
              boxShadow: "3px 6px 0 rgba(0,0,0,0.42)",
              transform: `rotate(${hueco.giro}deg)`,
              opacity: 0.34,
            }}
          >
            <div style={{ fontSize: 27, lineHeight: 1.5, color: TINTA_LEJOS }}>
              {recortar(n.texto ?? "", CORTE_FONDO)}
            </div>
          </div>
        );
      })}

      <div
        style={{
          position: "relative",
          width: 720,
          display: "flex",
          flexDirection: "column",
          padding: "78px 70px 58px",
          background: PAPEL,
          color: TINTA,
          boxShadow: "6px 12px 0 rgba(0,0,0,0.5)",
          transform: "rotate(-1.4deg)",
        }}
      >
        {/* El chinche. `left` a pelo y no `50%` + `translateX`: el papel mide 720
            y el chinche 52, así que el centro es una resta, no una capa más de
            transform que Satori tenga que componer con el giro. */}
        <div
          style={{
            position: "absolute",
            top: -26,
            left: (720 - 52) / 2,
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundImage:
              "radial-gradient(circle at 34% 30%, #d08a72 0%, #a8624a 46%, #6f3b2b 100%)",
            boxShadow: "0 6px 10px rgba(0,0,0,0.55)",
          }}
        />

        <div style={{ fontSize: 48, lineHeight: 1.55 }}>{pieza.texto}</div>

        <div
          style={{
            marginTop: 46,
            paddingTop: 26,
            borderTop: `1px solid ${TINTA_BORDE}`,
            fontSize: 15,
            letterSpacing: "0.2em",
            color: TINTA_PIE,
          }}
        >
          {/* En mayúsculas desde JS y no con `textTransform`: es una cadena fija,
              y hacerlo acá es una cosa menos que depende del CSS de Satori. */}
          {PIE.toUpperCase()}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 146,
          left: 140,
          width: ANCHO - 280,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div style={{ width: ANCHO - 280, height: 2, background: "rgba(138,143,139,0.5)" }} />
        <div
          style={{
            marginTop: 40,
            fontSize: 40,
            letterSpacing: "0.2em",
            color: TIZA,
          }}
        >
          COLAPSAR.SHONNY.CO
        </div>
      </div>
    </div>
  );
}
