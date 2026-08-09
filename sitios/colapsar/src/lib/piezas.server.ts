import "server-only";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { unstable_cache } from "next/cache";
import { esPieza, type Pieza } from "@/content/pieza";

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

let cliente: Redis | null = null;

/**
 * Perezoso a propósito. Construirlo en el ámbito del módulo se ejecutaría
 * durante `next build`, y la landing entera dejaría de compilar por una
 * variable que todavía no está puesta.
 *
 * Y a mano en vez de con `Redis.fromEnv()`: cuando Upstash se provisiona desde
 * el marketplace de Vercel, las variables llegan como `KV_REST_API_*`, y
 * `fromEnv()` solo busca `UPSTASH_REDIS_REST_*`. Se aceptan las dos, que es lo
 * que hace que funcione igual si algún día se cambia el marketplace por una
 * cuenta propia de Upstash.
 */
function redis(): Redis {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error("sin credenciales de Redis");
  return (cliente ??= new Redis({ url, token }));
}

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
