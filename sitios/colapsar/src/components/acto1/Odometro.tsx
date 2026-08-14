"use client";

import { useEffect, useState } from "react";

/**
 * Sin `toLocaleString`: el separador de miles depende del locale del entorno, y
 * el del servidor no tiene por qué ser el del navegador. Un "1.200" contra un
 * "1,200" es una discrepancia de hidratación por un punto.
 */
function conMiles(n: number) {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** Justo después de que empiece a entrar el bloque del recuento (1.2s). */
const ARRANQUE = 1.35;

/**
 * Lo que tarda el dígito de la derecha. Aterriza sobre el segundo 2.85, justo
 * antes de que la máquina de escribir acabe el titular (1.8s de espera + 1.1s de
 * tecleo = 2.9s): el conteo se ve entero pero no es lo último que se queda
 * quieto en pantalla. Si se toca `DEMORA` en `Pregunta.tsx`, mover esto también.
 */
const DURACION = 1.5;

/** Lo que se le resta a cada dígito según se va a la izquierda: el de más peso para antes. */
const ESCALON = 0.24;

/**
 * Vueltas completas antes de aterrizar. Las unidades dan una más porque es donde
 * se mira: un rodillo que solo sube de 0 a 2 no se lee como contador.
 */
const VUELTAS_ULTIMO = 2;
const VUELTAS = 1;

/**
 * Un dígito.
 *
 * La tira va en orden **descendente** de arriba a abajo, acabando en 0, y se
 * anima desde arriba hasta su sitio. Así el valor sube mientras la tira baja,
 * que es como se mueve un contador mecánico.
 *
 * Con `celdas = digito + 1 + 10 * vueltas`, la celda de arriba cae justo en el
 * dígito que toca y la de abajo en el 0. El desplazamiento va en `%` —sobre la
 * altura de la propia tira— para no medir nada en píxeles: el cuerpo de la cifra
 * es un `clamp()` y cambia con el ancho de la ventana.
 *
 * **Lo mueve el CSS y no motion**, y no es cosmética: el `initial` de motion se
 * serializaba como un `transform: translateY(-96.4%)` en el HTML del servidor,
 * así que sin JavaScript la tira se quedaba clavada arriba y el recuento
 * mostraba "00" en vez del número. Un número equivocado es peor que ninguno.
 *
 * Que salga gratis es cuestión de cómo está montada la tira: **su posición de
 * reposo ya es el dígito que toca**, porque la celda de arriba es ese dígito.
 * Solo hay que empujarla desde arriba y dejarla caer, y eso es un `@keyframes`
 * con `backwards` (ver `.rodillo-tira` en `globals.css`).
 */
function Rodillo({
  digito,
  vueltas,
  duracion,
}: {
  digito: number;
  vueltas: number;
  duracion: number;
}) {
  const celdas = digito + 1 + 10 * vueltas;

  return (
    <span className="rodillo">
      <span
        className="rodillo-tira"
        style={
          {
            "--rodar-desde": `${((-(celdas - 1) / celdas) * 100).toFixed(3)}%`,
            "--rodar-dur": `${duracion}s`,
            "--rodar-arranque": `${ARRANQUE}s`,
          } as React.CSSProperties
        }
      >
        {Array.from({ length: celdas }, (_, k) => (
          <span className="rodillo-celda" key={k}>
            {(celdas - 1 - k) % 10}
          </span>
        ))}
      </span>
    </span>
  );
}

/**
 * El recuento subiendo desde cero, dígito a dígito.
 *
 * Termina y **se quita de en medio**: en cuanto aterriza vuelve a ser texto
 * suelto dentro de `.cifra`, exactamente el mismo marcado de antes. Los dos
 * motivos son igual de importantes:
 *
 * 1. `.cifra` recorta su degradado con `background-clip: text`, y un
 *    descendiente con `transform` abre un contexto de apilamiento y **deja de
 *    recibir ese recorte**: los dígitos salen invisibles. Por eso cada celda
 *    lleva su propio degradado mientras rueda (comprobado en el navegador: sobre
 *    la celda sí funciona, y como todas las celdas miden igual, todos los
 *    dígitos salen con el mismo brillo).
 * 2. Un número de dos cifras son ~40 celdas. Dejarlas puestas es dejar 40
 *    elementos donde antes había uno, y el barrido de 6.5s de `.cifra` pintando
 *    en todos ellos para siempre.
 *
 * La celda no lleva el barrido, solo el degradado quieto en su posición de
 * arranque, que es la misma en la que está `.cifra` durante todo el rodaje —el
 * barrido no empieza hasta el segundo 1.2— así que el relevo no se nota.
 */
export function Odometro({ valor }: { valor: number }) {
  // Arranca rodando ya en el servidor: así el primer fotograma que ve la persona
  // es el 0, sin un salto desde el número final.
  const [rodando, setRodando] = useState(true);

  useEffect(() => {
    // Con movimiento reducido no hay rodaje. El bloque
    // `prefers-reduced-motion` de `globals.css` ya le quita la animación a
    // `.rodillo-tira` —y como su reposo es el dígito final, la tira aparece
    // directamente en su sitio, no en el 0— y esto además retira los rodillos en
    // cuanto se puede. Antes lo desarmaba `MotionConfig reducedMotion="user"`,
    // que ya no llega hasta acá porque el rodaje no pasa por motion.
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (quieto) {
      setRodando(false);
      return;
    }

    setRodando(true);
    const id = setTimeout(() => setRodando(false), (ARRANQUE + DURACION) * 1000 + 80);
    return () => clearTimeout(id);
  }, [valor]);

  const texto = conMiles(valor);

  if (!rodando) return <>{texto}</>;

  // Solo los dígitos ruedan; el punto de los miles se queda quieto.
  const digitos = [...texto].filter((c) => c !== ".").length;
  let vistos = 0;

  const rodillos = [...texto].map((c, i) => {
    if (c === ".") {
      return (
        <span className="odometro-punto" key={i}>
          .
        </span>
      );
    }

    // Cuántos dígitos quedan a la derecha de este: 0 para el último.
    const desdeLaDerecha = digitos - 1 - vistos;
    vistos += 1;

    return (
      // La `key` lleva el dígito dentro a propósito: si el recuento cambia,
      // solo se vuelve a montar —y por tanto a rodar— el que cambió.
      <Rodillo
        key={`${i}-${c}`}
        digito={Number(c)}
        vueltas={desdeLaDerecha === 0 ? VUELTAS_ULTIMO : VUELTAS}
        duracion={DURACION - ESCALON * desdeLaDerecha}
      />
    );
  });

  return (
    // El fantasma es el número final, invisible, y es quien ocupa el sitio: da
    // el ancho y —lo que de verdad importa— **la línea base**. Un elemento con
    // `overflow: hidden` no aporta la línea base de su texto sino la de su borde
    // de abajo, así que unos rodillos sueltos descolocarían la frase de al lado
    // durante el rodaje y la recolocarían de golpe al acabar. Con el fantasma
    // debajo, la caja es exactamente la de siempre y los rodillos van encima.
    <span className="odometro-caja">
      <span className="odometro-fantasma">{texto}</span>
      <span className="odometro" aria-hidden>
        {rodillos}
      </span>
    </span>
  );
}
