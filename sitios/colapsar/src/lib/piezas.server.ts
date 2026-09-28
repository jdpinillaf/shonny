import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { del } from "@vercel/blob";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { esPieza, type Pieza } from "@/content/pieza";
import { site } from "@/content/site";
import { redis } from "@/lib/redis.server";

const LISTA = "piezas";

/** El tag de caché de la colección. Se invalida al aprobar y al borrar. */
export const TAG = "piezas";

/**
 * Cuántas piezas de la gente se guardan.
 *
 * La pared enseña siete y el mural unas cuantas más; quinientas es mucho más de
 * lo que nadie va a mirar, y es lo que evita que la lista crezca sin techo.
 * Recortar deja el blob de la foto huérfano: fuga lenta y conocida, se
 * reconcilia a mano con `list()` cuando haga falta.
 */
const TOPE = 500;

/** Llamadas al modelo que se permiten en un día. Tope duro de gasto. */
const TOPE_DIARIO = 400;

/**
 * Cuántas piezas puede dejar una misma IP, y en cuánto tiempo.
 *
 * Es una hora y no diez minutos porque los dos frenos tienen que encajar: a 3
 * cada 10 minutos, una sola IP llega a 432 al día y **se come sola el
 * `TOPE_DIARIO` de 400**, dejando a todos los demás rechazados en silencio
 * hasta medianoche. A 3 por hora son 72 al día: hacen falta seis IPs a tope el
 * día entero para agotar el presupuesto.
 *
 * El precio es que la IP no es la persona. Detrás de un CGNAT de operador móvil
 * hay mucha gente compartiendo salida, y ahí esto va a tumbar envíos legítimos.
 */
const POR_IP = 3;
const VENTANA_IP = "1 h" as const;

let limitador: Ratelimit | null = null;

function limite(): Ratelimit {
  return (limitador ??= new Ratelimit({
    redis: redis(),
    limiter: Ratelimit.slidingWindow(POR_IP, VENTANA_IP),
    prefix: "ratelimit:piezas",
  }));
}

async function traerPiezas(): Promise<Pieza[]> {
  try {
    const crudo = await redis().lrange<Pieza>(LISTA, 0, TOPE - 1);
    // El cliente de Upstash ya deserializa el JSON, pero la lista sobrevive a
    // los cambios de forma del tipo: lo que hay dentro se comprueba igual.
    return crudo.filter(esPieza);
  } catch {
    // **Falla en silencio a la lista vacía.** Sin Redis el museo enseña sus
    // semillas y ya; que se caiga la base no puede tumbar la página. Y hace
    // falta de verdad: la página se prerrenderiza en `next build`, cuando las
    // variables de entorno todavía pueden no existir.
    return [];
  }
}

/**
 * Lo que ha dejado la gente y pasó el filtro.
 *
 * Va envuelto en caché y no suelto. Sin esto la ruta entera se vuelve dinámica
 * —una lectura sin cachear basta— y cada visita gasta un comando de Redis: el
 * medio millón mensual del plan gratis se iría en unas diez mil visitas. Con la
 * caché, la pared se lee una vez por minuto y las visitas salen de disco.
 *
 * El `revalidate` de la página no sirve para esto: gobierna los `fetch`, y una
 * consulta a la base no es un `fetch`.
 */
export const leerPiezas = unstable_cache(traerPiezas, ["colapsar:piezas"], {
  revalidate: 60,
  tags: [TAG],
});

/**
 * Lo mismo, sin caché. **Solo para el panel.**
 *
 * Moderar contra una lectura de hasta un minuto de antigüedad es enseñar una
 * pared que ya no existe: borras algo, la lista lo sigue mostrando, lo vuelves
 * a borrar y sale un 404. El panel lo ve una persona cada tanto, así que el
 * comando de Redis por visita da igual acá.
 */
export const leerPiezasSinCache = traerPiezas;

export async function guardarPieza(pieza: Pieza): Promise<void> {
  const r = redis();
  await r.lpush(LISTA, JSON.stringify(pieza));
  await r.ltrim(LISTA, 0, TOPE - 1);
}

export async function borrarPieza(id: string): Promise<Pieza | null> {
  const r = redis();
  const todas = await r.lrange<Pieza>(LISTA, 0, TOPE - 1);
  const pieza = todas.find((p) => esPieza(p) && p.id === id) ?? null;
  if (!pieza) return null;
  await r.lrem(LISTA, 1, JSON.stringify(pieza));
  return pieza;
}

/**
 * Retirar una pieza del museo del todo: la lista, su foto y la caché.
 *
 * Vive acá y no en la ruta porque ahora hay dos puertas —el `curl` con el token
 * y el panel— y las dos tienen que dejar exactamente el mismo rastro. Una de
 * ellas olvidándose del blob es una foto borrada de la pared que sigue
 * colgada en internet con su URL pública.
 */
export async function retirarPieza(id: string): Promise<Pieza | null> {
  const pieza = await borrarPieza(id);
  if (!pieza) return null;

  // Si el blob ya no está, `del` no es problema: la pieza ya salió de la lista.
  if (pieza.foto?.url) await del(pieza.foto.url).catch(() => {});

  // Acá sí se expira de golpe, al revés que al publicar: cuando estás quitando
  // algo de la pared no quieres que la siguiente visita todavía lo vea mientras
  // se refresca por detrás. Que la próxima pague la espera.
  revalidateTag(TAG, { expire: 0 });
  revalidatePath("/");

  return pieza;
}

/**
 * Colgar una pieza a mano, desde el panel.
 *
 * Se salta el filtro y el presupuesto a propósito: quien está acá tiene el
 * token, y el filtro existe para lo que escribe gente que no lo tiene. El resto
 * es lo mismo que deja la ruta pública —mismo tope de largo, misma lista—, así
 * que en la pared no se distingue de lo que dejó alguien.
 */
export async function anadirPieza(texto: string): Promise<Pieza | null> {
  const limpio = texto.trim().slice(0, site.maxRespuesta);
  if (!limpio) return null;

  const pieza: Pieza = { id: crypto.randomUUID(), texto: limpio, creado: Date.now() };
  await guardarPieza(pieza);

  // De golpe, como al retirar: quien la cuelga va a abrir la portada justo
  // después para verla, y con `"max"` le tocaría la versión de antes.
  revalidateTag(TAG, { expire: 0 });
  revalidatePath("/");

  return pieza;
}

/** ¿Puede esta IP mandar otra pieza? */
export async function puedeEnviar(ip: string): Promise<boolean> {
  try {
    const { success } = await limite().limit(ip);
    return success;
  } catch {
    // Sin Redis no hay forma de contar. Se cierra: publicar sin límite es peor
    // que no publicar.
    return false;
  }
}

/**
 * Descuenta una llamada al modelo del presupuesto del día.
 *
 * Devuelve false cuando ya no queda. Es el freno de mano contra una tarde de
 * envíos automatizados: sin esto, el rate limit por IP no acota el gasto total.
 */
export async function hayPresupuesto(): Promise<boolean> {
  try {
    const hoy = new Date().toISOString().slice(0, 10);
    const clave = `gasto:${hoy}`;
    const n = await redis().incr(clave);
    if (n === 1) await redis().expire(clave, 172_800);
    return n <= TOPE_DIARIO;
  } catch {
    return false;
  }
}
