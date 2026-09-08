"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Chinche } from "@/components/fondo/Chinche";
import { site } from "@/content/site";
import { Odometro } from "./Odometro";

/**
 * La pregunta se teclea. El input no existe hasta que termina de escribirse:
 * primero te preguntan, después te dan dónde contestar.
 */

/** Lo que se espera antes de llamar la atención sobre el papelito. */
const ESPERA_LATIDO = 5000;

/**
 * El tecleado, en milisegundos. Estos dos números viven acá y viajan al CSS
 * como variables: la animación es de `globals.css` (`.teclear-visible`) pero el
 * temporizador que monta el input tiene que durar exactamente lo mismo.
 *
 * Antes eran 900 de espera más 17 caracteres a 54ms con jitter y pausas de
 * puntuación: 2.2s largos, y encima no empezaban a contar hasta que el
 * navegador acababa de hidratar. Ahora arrancan con la primera pintada, así que
 * la espera se puede permitir ser más larga y seguir siendo más corta que antes.
 *
 * **El titular es lo último que se mueve**, y de ahí sale este 1800: los
 * televisores se encienden entre 0.25s y 1.5s (`Canales.tsx`), los papeles se
 * pinchan entre 0.9s y 2.1s (`Nota.tsx`) y esto entra cuando la pared ya está.
 * Al tocar cualquiera de los tres hay que mirar los otros dos.
 */
const DEMORA = 1800;
const POR_LETRA = 65;

export function Pregunta({
  onListo,
  total,
  muralAbierto,
  onAbrirMural,
}: {
  onListo: () => void;
  total: number;
  muralAbierto: boolean;
  onAbrirMural: () => void;
}) {
  const letras = site.pregunta.length;
  const duracion = letras * POR_LETRA;

  // Cuándo aparece el input. Se cuenta desde `performance.now()` —milisegundos
  // desde que empezó la navegación— y no desde que monta este efecto, porque la
  // animación del CSS arranca con la primera pintada y la hidratación puede
  // llegar mucho después en un teléfono lento. Sin esta resta, en ese teléfono
  // el titular acabaría de escribirse y el input seguiría esperando su turno.
  //
  // Y no vale `onAnimationEnd`: si hidrata pasada la animación, el evento ya
  // ocurrió, no vuelve a dispararse y el input no montaría nunca.
  useEffect(() => {
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const restante = quieto ? 0 : Math.max(0, DEMORA + duracion - performance.now());
    const id = setTimeout(onListo, restante);
    return () => clearTimeout(id);
  }, [duracion, onListo]);

  // El empujón al rótulo. `tocado` es un ref y no estado porque solo decide si
  // el temporizador hace algo: si fuera estado, cambiarlo relanzaría el efecto.
  const [llama, setLlama] = useState(false);
  const tocado = useRef(false);

  const calmar = useCallback(() => {
    tocado.current = true;
    setLlama(false);
  }, []);

  useEffect(() => {
    if (muralAbierto || tocado.current) return;
    const id = setTimeout(() => {
      if (!tocado.current) setLlama(true);
    }, ESPERA_LATIDO);
    return () => clearTimeout(id);
  }, [muralAbierto]);

  return (
    <div className="text-center">
      <p
        // `.placa` trae 0.34em de tracking, que a este cuerpo parte el título en
        // dos líneas por debajo de 375px. El clamp y el tracking corto lo
        // sostienen en una sola línea hasta 320px, y en `md` recupera el
        // espaciado de placa de museo.
        className="placa entra text-[clamp(9px,2.6vw,16px)] tracking-[0.22em] md:tracking-[0.34em]"
        style={
          {
            "--entrada-dur": "1.4s",
            // La placa sí entra pronto: es el rótulo del museo y lo que encuadra
            // todo lo demás. Va con el primer televisor, no detrás.
            "--entrada-retardo": "0.5s",
            "--entrada-desde": "0px",
          } as React.CSSProperties
        }
      >
        {site.placa}
      </p>

      {/* El recuento, debajo de la placa. La cifra va en serif y grande y el
          resto de la frase pequeño al lado: es lo que la separa de un dato de
          pie de página y hace que se mire.

          Antes el recuento *era* el botón, sin borde y sin fondo, confiando en
          la luz que lo recorre. En una prueba con diez personas no lo apretó
          ninguna y ninguna sabía que se podía. Así que la cifra se queda igual
          —es lo bonito— y la señal la lleva un papelito colgado debajo, el mismo
          objeto que puebla la pared. Uno se mira, el otro se aprieta.

          El `.cifra` se mudó al span de dentro y no es cosmética: lleva
          `background-clip: text` + `color: transparent`, así que en el botón le
          habría comido el fondo al papel. */}
      <button
        type="button"
        onClick={() => {
          calmar();
          onAbrirMural();
        }}
        onPointerEnter={calmar}
        onFocus={calmar}
        aria-haspopup="dialog"
        aria-expanded={muralAbierto}
        // Sin él el nombre accesible sale de concatenar la cifra, la frase y el
        // rótulo, con la flecha de propina.
        aria-label={`Ver las ${total} cosas que nunca pasaron`}
        className="grupo-mural entra mx-auto mt-3 flex cursor-pointer flex-col items-center gap-3 focus:outline-none"
        style={
          {
            "--entrada-dur": "1.2s",
            // Entre la placa y el titular. El odómetro de dentro arranca justo
            // después (`ARRANQUE` en `Odometro.tsx`) y aterriza un pelo antes de
            // que el titular acabe de escribirse.
            "--entrada-retardo": "1.2s",
            "--entrada-desde": "6px",
          } as React.CSSProperties
        }
      >
        {/* `items-baseline` se queda como estaba: el odómetro lleva dentro un
            fantasma del número final que le presta la línea base mientras rueda,
            así que desde fuera esta caja no se entera de nada. */}
        <span className="cifra flex items-baseline justify-center gap-2 font-serif">
          <span className="text-[clamp(1.7rem,6.4vw,2.8rem)] leading-[1] tracking-[-0.02em] [font-variant-numeric:tabular-nums]">
            <Odometro valor={total} />
          </span>
          <span className="text-[clamp(0.72rem,2.5vw,1.05rem)] leading-[1]">
            {site.recuento}
          </span>
        </span>

        <span className={`papelito ${llama ? "papelito--llama" : ""}`}>
          <Chinche tamano={9} />
          {site.verTodas}
          <span className="papelito-flecha" aria-hidden>
            →
          </span>
        </span>
      </button>

      {/* `mt-6` y no `mt-7`: el papelito ya trajo alto propio al bloque.

          El texto va **dos veces**: el fantasma ocupa el sitio y presta la caja,
          y la copia de encima es la que se descubre. Es el mismo par que usa el
          odómetro y por el mismo motivo — no se puede animar un `width` hasta
          `auto`, hace falta algo que dé el 100%.

          El fantasma es el que leen los lectores de pantalla: el de encima va
          `aria-hidden` para que no lo dicten dos veces. */}
      <h1 className="glow mt-6 font-serif text-[clamp(1.9rem,6.2vw,4.1rem)] leading-[1.12] tracking-[-0.01em] md:mt-8">
        <span
          className="teclear"
          style={
            {
              "--teclear-letras": letras,
              "--teclear-dur": `${duracion}ms`,
              "--teclear-demora": `${DEMORA}ms`,
            } as React.CSSProperties
          }
        >
          <span className="teclear-fantasma">{site.pregunta}</span>
          <span className="teclear-visible" aria-hidden>
            {site.pregunta}
          </span>
          <span className="cursor" aria-hidden />
        </span>
      </h1>
    </div>
  );
}
