"use client";

import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pregunta } from "./acto1/Pregunta";
import { Respuesta } from "./acto1/Respuesta";
import { Colapso } from "./acto2/Colapso";
import { Disco } from "./acto3/Disco";
import { Guardar } from "./acto3/Guardar";
import { Canales, FOTOS_MOVIL, TOPE_FOTOS } from "./fondo/Canales";
import { MuroNotas, NOTAS_MOVIL, TOPE_NOTAS } from "./fondo/MuroNotas";
import { PiezaAbierta } from "./fondo/PiezaAbierta";
import { type Origen } from "./fondo/origen";
import { Mural } from "./mural/Mural";
import { Sonido } from "./Sonido";
import { barajar } from "@/content/coleccion";
import { conFoto, conTexto, esPieza, unir, type Pieza } from "@/content/pieza";
import { site } from "@/content/site";
import { evento } from "@/lib/analitica";
import { useSonido } from "@/lib/useSonido";

type Acto = "pregunta" | "colapso" | "disco";

const GUARDADO = "colapsar:respuestas";
const SUAVE = [0.16, 1, 0.3, 1] as const;

/**
 * Lo que la persona escribió en este navegador.
 *
 * Se guardaba como `string[]` y ahora son piezas con id. Se leen los dos
 * formatos: quien ya tenga cosas guardadas de antes no puede encontrarse la
 * pared vacía porque cambiamos de forma.
 */
function leerMias(): Pieza[] {
  try {
    const crudo = localStorage.getItem(GUARDADO);
    if (!crudo) return [];
    const datos: unknown = JSON.parse(crudo);
    if (!Array.isArray(datos)) return [];
    return datos
      .map((x, i): Pieza | null => {
        if (typeof x === "string") return { id: `local-${i}-${x.length}`, texto: x, creado: 0 };
        return esPieza(x) ? x : null;
      })
      .filter((p): p is Pieza => p !== null);
  } catch {
    // localStorage bloqueado (modo privado): la pared arranca vacía y ya.
    return [];
  }
}

export function Museo({ piezas }: { piezas: readonly Pieza[] }) {
  const [acto, setActo] = useState<Acto>("pregunta");
  const [inputListo, setInputListo] = useState(false);
  const [mias, setMias] = useState<Pieza[]>([]);
  const [quieto, setQuieto] = useState(false);
  const [fotos, setFotos] = useState(FOTOS_MOVIL);
  const [cuantasNotas, setCuantasNotas] = useState(NOTAS_MOVIL);
  const [mural, setMural] = useState(false);
  const [guardar, setGuardar] = useState(false);

  // El par que abre cualquier pieza, viva donde viva. Vive acá y no en
  // `MuroNotas` porque ahora despegan también los televisores, que son hermanos
  // suyos. `abierta` monta la pieza grande; `hueco` es la de la pared o el marco
  // que se apaga mientras tanto. Son dos porque el hueco tiene que seguir vacío
  // durante el vuelo de vuelta: si se llenara al cerrar, se vería dos veces.
  const [abierta, setAbierta] = useState<Origen | null>(null);
  const [hueco, setHueco] = useState<Origen | null>(null);

  const sonido = useSonido();

  // Lo del servidor y lo de esta persona son la misma colección. Se unen por id:
  // en cuanto la moderación aprueba lo que escribió, su pieza vuelve desde el
  // servidor y las dos copias se colapsan en una.
  const coleccion = useMemo(() => unir(mias, piezas), [mias, piezas]);
  const fotosDeLaColeccion = useMemo(() => conFoto(coleccion), [coleccion]);
  const notasDeLaColeccion = useMemo(() => conTexto(coleccion), [coleccion]);
  const ultima = mias.at(-1);

  // El mural es solo notas: las fotos se ven en los televisores y ahí se quedan.
  // Va barajado y no en el orden en que llegan las piezas, para que las semillas
  // no salgan siempre en el orden en que están escritas en `notas.ts`. Lo suyo va
  // delante, lo último arriba del todo.
  const paraMural = useMemo(
    () => conTexto(unir([...mias].reverse(), barajar(piezas))),
    [mias, piezas],
  );

  // Las respuestas se leen después del montaje. Si se leyeran durante el render
  // el HTML del servidor y el del cliente no coincidirían.
  useEffect(() => {
    setMias(leerMias());

    const params = new URLSearchParams(window.location.search);

    // ?acto=colapso | ?acto=disco entra directo a ese momento. Sirve para
    // revisar el final sin volver a escribir la respuesta cada vez.
    const salto = params.get("acto");
    if (salto === "colapso" || salto === "disco") setActo(salto);

    // ?fotos=N y ?notas=N tantean cuánta densidad aguanta el collage de móvil.
    // Escritorio los ignora: sus tablas siguen fijas y puestas a mano.
    const cuenta = (clave: string, porDefecto: number, tope: number) => {
      // El `null` de un param que no viene hay que atajarlo antes: `Number(null)`
      // es 0, y 0 pasa la validación tan campante. Sin esto, no poner el
      // parámetro deja la pared vacía en vez de dejar el default.
      const crudo = params.get(clave);
      if (!crudo) return porDefecto;
      const n = Number(crudo);
      return Number.isInteger(n) && n >= 0 && n <= tope ? n : porDefecto;
    };
    setFotos(cuenta("fotos", FOTOS_MOVIL, TOPE_FOTOS));
    setCuantasNotas(cuenta("notas", NOTAS_MOVIL, TOPE_NOTAS));
  }, []);

  // El embudo entero: pregunta → colapso → disco. Es lo único que autocapture
  // no puede ver, porque los dos saltos que importan no los dispara un click
  // sino el final de una animación.
  useEffect(() => {
    evento("acto visto", { acto });
  }, [acto]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const leer = () => setQuieto(mq.matches);
    leer();
    mq.addEventListener("change", leer);
    return () => mq.removeEventListener("change", leer);
  }, []);

  // El hover de las notas lo decidía acá un `matchMedia("(hover: hover)")` que
  // bajaba por props hasta `Nota`, porque en táctil el toque cuenta como hover y
  // se queda pegado. Eso ahora es una media query de CSS en `.colgada`, que dice
  // lo mismo sin estado, sin efecto y sin un render extra al montar.

  const abrir = useCallback((origen: Origen) => {
    setAbierta(origen);
    setHueco(origen);
    evento("pieza abierta", {
      tipo: origen.pieza.foto ? "foto" : "nota",
      pieza: origen.pieza.id,
    });
  }, []);

  const volvioASuSitio = useCallback(() => {
    hueco?.boton?.focus();
    setHueco(null);
  }, [hueco]);

  // El audio no se toca acá: `useSonido` ya lo enciende con el primer gesto de
  // la visita, que siempre pasa antes de este envío. Volver a llamarlo acá le
  // reviviría la canción a quien la haya apagado a propósito.
  const enviar = useCallback((texto: string) => {
    // El id lo pone el cliente para que, cuando la pieza vuelva aprobada desde
    // el servidor, se reconozca como la misma y no salga dos veces.
    const pieza: Pieza = { id: crypto.randomUUID(), texto, creado: Date.now() };

    setMias((prev) => {
      const siguiente = [...prev, pieza].slice(-8);
      try {
        localStorage.setItem(GUARDADO, JSON.stringify(siguiente));
      } catch {}
      return siguiente;
    });
    setActo("colapso");

    // El texto no se manda: es de la persona y ya vive en la pared. Solo el
    // largo, que es lo que dice si la caja invita a escribir o a despachar.
    evento("respuesta enviada", { largo: texto.length });

    // Se manda y no se espera. La persona ya está viendo el colapso, y lo que
    // pase con la moderación no le cambia nada de lo que ve: su nota está en su
    // pared pase lo que pase. Sigue siendo `FormData` y no JSON porque es lo
    // que lee la ruta, que todavía acepta foto para las piezas que ya existen.
    const cuerpo = new FormData();
    cuerpo.set("id", pieza.id);
    cuerpo.set("texto", texto);
    void fetch("/api/piezas", { method: "POST", body: cuerpo }).catch(() => {});
  }, []);

  const otraVez = useCallback(() => {
    setInputListo(true);
    setActo("pregunta");
  }, []);

  const preguntaLista = useCallback(() => setInputListo(true), []);

  return (
    // El CSS de globals.css apaga los keyframes propios, pero las transiciones
    // de motion viven en JS y no las ve ninguna media query: reducedMotion
    // "user" es lo que las desarma.
    <MotionConfig reducedMotion="user">
      <main className="relative h-dvh w-full overflow-hidden">
        <Canales
          pool={fotosDeLaColeccion}
          quieto={quieto}
          fotos={fotos}
          apagado={acto === "disco"}
          onAbrir={abrir}
          huecoId={hueco?.pieza.id ?? null}
        />
        <MuroNotas
          piezas={coleccion}
          ultima={ultima}
          quieto={quieto}
          notas={cuantasNotas}
          apagado={acto === "disco"}
          onAbrir={abrir}
          huecoId={hueco?.pieza.id ?? null}
        />

        {/* Rebaja lo que haya detrás justo donde va el texto. Sin esto, una nota
            o un canal claro pueden dejar la pregunta ilegible. Cuando entra el
            disco se afloja: ahí el centro ya no es texto sino la portada a
            color, y el mismo velo que salvaba la lectura le apagaría el momento.

            Era un `motion.div` para un solo cambio de opacidad entre dos
            valores, que es exactamente lo que hace una `transition` de CSS sin
            traerse nada. */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-20"
          style={{
            background:
              "radial-gradient(58% 44% at 50% 50%, rgba(11,13,12,0.92) 0%, rgba(11,13,12,0.74) 45%, rgba(11,13,12,0) 100%)",
            opacity: acto === "disco" ? 0.5 : 1,
            transition: "opacity 1.4s ease-out",
          }}
        />

        {/* La columna tapa la pantalla entera, así que sin esto se comería los
            clicks de las notas de la pared. Solo el bloque de contenido —el
            ancho de 860px centrado, donde no hay ninguna ranura— los recibe. */}
        <div className="pointer-events-none relative z-30 flex h-full items-center justify-center px-5">
          <div className="pointer-events-auto w-full max-w-[860px]">
            <AnimatePresence mode="wait">
              {acto === "pregunta" && (
                <motion.div
                  key="pregunta"
                  exit={{ opacity: 0, y: -26, filter: "blur(5px)" }}
                  transition={{ duration: 0.62, ease: SUAVE }}
                >
                  <Pregunta
                    onListo={preguntaLista}
                    // El recuento cuenta lo que hay dentro del mural, que es lo
                    // que abre: notas. Las fotos no entran en la cifra.
                    total={notasDeLaColeccion.length}
                    muralAbierto={mural}
                    onAbrirMural={() => {
                      setMural(true);
                      // El recuento no parece un botón a propósito. Este evento
                      // es el que dice si aun así lo encuentran.
                      evento("mural abierto", { piezas: notasDeLaColeccion.length });
                    }}
                  />
                  {inputListo && <Respuesta onEnviar={enviar} />}
                </motion.div>
              )}

              {acto === "colapso" && (
                <motion.div
                  key="colapso"
                  exit={{ opacity: 0, y: -22, filter: "blur(5px)" }}
                  transition={{ duration: 0.55, ease: SUAVE }}
                >
                  <Colapso onListo={() => setActo("disco")} />
                </motion.div>
              )}

              {acto === "disco" && (
                <motion.div key="disco" className="flex justify-center">
                  <Disco onOtraVez={otraVez} onGuardar={() => setGuardar(true)} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence>
          {mural && <Mural piezas={paraMural} onCerrar={() => setMural(false)} />}
        </AnimatePresence>

        {/* Acá y no dentro de `Disco`: un ancestro con `transform` convierte un
            `position: fixed` en `absolute`, y el árbol del disco está lleno de
            transforms de motion. Colgando de la raíz, como el mural, no pasa.
            El evento no se dispara acá — ya lo manda la card al pulsarla. */}
        <AnimatePresence>
          {guardar && <Guardar onCerrar={() => setGuardar(false)} />}
        </AnimatePresence>

        {/* Después del mural a propósito: los dos viven en z-[35] y entre
            hermanos del mismo z manda el orden del DOM. */}
        <AnimatePresence onExitComplete={volvioASuSitio}>
          {abierta && (
            <PiezaAbierta
              key={abierta.pieza.id}
              origen={abierta}
              onCerrar={() => setAbierta(null)}
            />
          )}
        </AnimatePresence>

        {/* Grano y barrido sobre absolutamente todo, interfaz incluida. */}
        <div
          aria-hidden
          className="grano pointer-events-none fixed inset-0 z-40 opacity-[0.055] mix-blend-overlay"
        />
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-40 opacity-[0.16]"
          style={{
            background:
              "repeating-linear-gradient(to bottom, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 2px, rgba(0,0,0,0.5) 3px, rgba(0,0,0,0.5) 4px)",
          }}
        />

        {sonido.hay && (
          <>
            {/* `preload="none"`: son 480 KB y nadie los necesita hasta que haya
                un gesto. Con `auto` bajaban durante la primera pintada, que es
                justo cuando compiten con las fotos y la fuente. */}
            <audio
              ref={sonido.audio}
              src={site.audio}
              loop
              preload="none"
              onError={sonido.alFallar}
            />
            <Sonido sonando={sonido.sonando} onAlternar={sonido.alternar} />
          </>
        )}
      </main>
    </MotionConfig>
  );
}
