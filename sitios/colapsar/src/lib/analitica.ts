"use client";

/**
 * El token es público —viaja en el bundle, como el de cualquier SDK de
 * navegador—, pero va en variable de entorno igual: así se apunta a otro
 * proyecto de Mixpanel sin tocar código, y un clon del repo no escribe en este.
 */
const TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;

type Mixpanel = typeof import("mixpanel-browser").default;

/**
 * El SDK entra por `import()` y no por `import` normal a propósito: son 125 KB
 * comprimidos, más los 104 KB del grabador de replay que él mismo se baja de
 * cdn.mxpnl.com. Con el import de arriba iban los dos en el chunk principal y
 * competían con las fotos y la fuente por la primera pintada.
 *
 * Mientras baja, `mp` es null y los eventos esperan en `cola`.
 */
let mp: Mixpanel | null = null;

/**
 * En desarrollo React monta dos veces y `encender` se llamaría dos veces con él.
 * La segunda no es inofensiva: reinicia el grabador y parte la sesión de replay
 * en dos. Se marca al *pedir* el SDK, no al recibirlo, porque entre las dos
 * cosas hay una descarga entera y ahí caben muchas llamadas.
 */
let pedido = false;

/** Lo que se disparó antes de que llegara el SDK. Se vacía al llegar. */
const cola: Array<[string, Record<string, unknown>?]> = [];

export function encender() {
  if (pedido || !TOKEN) return;
  pedido = true;

  import("mixpanel-browser").then(({ default: m }) => {
    m.init(TOKEN, {
      // Clicks, envíos y cambios de página sin instrumentar nada. Es la mitad de
      // "dónde da click la gente"; la otra mitad son los `evento()` de abajo,
      // porque acá casi todo lo clicable es un papel torcido sin texto que le
      // sirva de etiqueta a Mixpanel.
      //
      // Ojo con el precio de diferir: autocapture no ve los clicks que ocurran
      // antes de que llegue el SDK. Los `evento()` con nombre —los del embudo—
      // sí, que para eso está la cola.
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
    m.register({ entorno: process.env.NODE_ENV });

    mp = m;
    for (const [nombre, props] of cola) {
      try {
        m.track(nombre, props);
      } catch {}
    }
    cola.length = 0;
  });
}

/**
 * Un evento con nombre.
 *
 * Si el SDK todavía no llegó, el evento **solo se encola**. Pedirlo desde acá
 * es lo que arruinaba el diferido: los efectos de los hijos corren antes que
 * los del layout, y `Museo` dispara "acto visto" en el suyo. O sea que este
 * camino ganaba siempre la carrera y el SDK entraba en plena hidratación —
 * exactamente lo que `<Analitica/>` intenta evitar—, con `pedido` ya en true
 * para cuando su `requestIdleCallback` llegaba a registrarse.
 *
 * El único que enciende es `<Analitica/>`. Acá basta la cola: se vacía en orden
 * al llegar el SDK, así que no se pierde nada, solo llega hasta 2s más tarde.
 *
 * Y se traga la llamada si no hay token, en vez de reventar la interacción que
 * la disparó. Ninguna de estas medidas vale una nota que no se abre.
 */
export function evento(nombre: string, props?: Record<string, unknown>) {
  if (mp) {
    try {
      mp.track(nombre, props);
    } catch {}
    return;
  }
  if (!TOKEN) return;
  cola.push([nombre, props]);
}
