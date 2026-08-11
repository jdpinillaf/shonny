"use client";

import mixpanel from "mixpanel-browser";

/**
 * El token es público —viaja en el bundle, como el de cualquier SDK de
 * navegador—, pero va en variable de entorno igual: así se apunta a otro
 * proyecto de Mixpanel sin tocar código, y un clon del repo no escribe en este.
 */
const TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;

/**
 * En desarrollo React monta dos veces y `init` se llamaría dos veces con él.
 * La segunda no es inofensiva: reinicia el grabador y parte la sesión de replay
 * en dos.
 */
let lista = false;

export function encender() {
  if (lista || !TOKEN) return;
  lista = true;

  mixpanel.init(TOKEN, {
    // Clicks, envíos y cambios de página sin instrumentar nada. Es la mitad de
    // "dónde da click la gente"; la otra mitad son los `evento()` de abajo,
    // porque acá casi todo lo clicable es un papel torcido sin texto que le
    // sirva de etiqueta a Mixpanel.
    autocapture: true,

    record_sessions_percent: 100,

    // Los dos defaults del replay dejarían la grabación en blanco: Mixpanel
    // tapa *todo* el texto y bloquea `img, video, audio`. Acá el texto son las
    // notas y las imágenes son los televisores — o sea, se grabaría un
    // rectángulo gris. Lo que se ve ya es público: piezas que pasaron
    // moderación y están colgadas en la pared.
    record_mask_all_text: false,
    record_block_selector: "",

    // Los inputs siguen tapados, que es el default: lo que alguien está
    // escribiendo todavía no decidió mandarlo.

    // El default guarda el distinct_id en cookie, y esa cookie viaja en cada
    // petición al servidor, subidas de foto incluidas. En localStorage no
    // viaja, y no hay nada del servidor que la mire.
    persistence: "localStorage",

    debug: process.env.NODE_ENV === "development",
  });

  // Para poder sacar del informe lo que sale de `npm run dev`.
  mixpanel.register({ entorno: process.env.NODE_ENV });
}

/**
 * Un evento con nombre.
 *
 * Enciende Mixpanel si hiciera falta en vez de fiarse de que `<Analitica/>` ya
 * corrió: los efectos de los hijos se ejecutan antes que los del layout, así
 * que el primer evento del montaje llega antes que el `init` de allá y se
 * perdería justo el arranque del embudo.
 *
 * Y se traga la llamada si no hay token, en vez de reventar la interacción que
 * la disparó. Ninguna de estas medidas vale una nota que no se abre.
 */
export function evento(nombre: string, props?: Record<string, unknown>) {
  encender();
  if (!lista) return;
  try {
    mixpanel.track(nombre, props);
  } catch {}
}
