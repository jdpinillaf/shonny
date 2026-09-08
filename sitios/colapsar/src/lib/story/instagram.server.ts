import "server-only";
import { redis } from "@/lib/redis.server";

/**
 * Publicar una story en la cuenta, desde el panel.
 *
 * Usa **Instagram Login**, no Facebook Login: por eso el host es
 * `graph.instagram.com` y los permisos son `instagram_business_basic` e
 * `instagram_business_content_publish`. La diferencia práctica es que no hace
 * falta una página de Facebook enganchada a la cuenta.
 *
 * Publicar en tu propia cuenta con la app en modo desarrollo no necesita
 * revisión de Meta. La revisión es para publicar en cuentas de terceros.
 */

const HOST = "https://graph.instagram.com/v25.0";

const CLAVE_TOKEN = "ig:token";
const CLAVE_CADUCA = "ig:token:caduca";
const CLAVE_PUBLICADA = (id: string) => `ig:publicada:${id}`;

/** Por debajo de esto al token le quedan pocos días y se refresca. */
const MARGEN_MS = 10 * 24 * 60 * 60 * 1000;

export type Publicada = { cuando: number; media: string };

/**
 * Si no hay cuenta configurada, el botón no existe.
 *
 * Misma idea que `hayPuerta()` en el panel: media función sin configurar no es
 * un botón que da error, es un botón que no está.
 */
export function hayInstagram(): boolean {
  return Boolean(process.env.IG_USER_ID);
}

async function pedir(ruta: string, cuerpo?: Record<string, string>) {
  const url = `${HOST}${ruta}`;
  const r = await fetch(url, {
    method: cuerpo ? "POST" : "GET",
    ...(cuerpo
      ? {
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams(cuerpo),
        }
      : {}),
    cache: "no-store",
  });

  const datos = await r.json().catch(() => null);
  if (!r.ok) {
    // El mensaje de Meta es lo único que dice qué pasó de verdad; se propaga
    // hasta el panel en vez de morir en un log que nadie lee.
    const motivo = datos?.error?.message ?? `http ${r.status}`;
    throw new Error(String(motivo));
  }
  return datos;
}

/**
 * El token vigente, refrescándolo si le queda poco.
 *
 * Vive en Redis y no en una variable de entorno porque **caduca a los 60 días**
 * y hay que poder reescribirlo sin un deploy. `IG_TOKEN_INICIAL` solo siembra
 * el primero; a partir de ahí manda Redis.
 *
 * **Si caduca del todo no hay refresco posible** y hay que rehacer el OAuth a
 * mano. Por eso el margen es de diez días y no de uno.
 */
async function token(): Promise<string> {
  const r = redis();
  const [guardado, caduca] = await Promise.all([
    r.get<string>(CLAVE_TOKEN),
    r.get<number>(CLAVE_CADUCA),
  ]);

  const actual = guardado ?? process.env.IG_TOKEN_INICIAL;
  if (!actual) throw new Error("no hay token de Instagram");

  const queda = (caduca ?? 0) - Date.now();
  if (guardado && queda > MARGEN_MS) return actual;

  try {
    const nuevo = await pedir(
      `/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(actual)}`,
    );
    if (nuevo?.access_token) {
      await r.set(CLAVE_TOKEN, nuevo.access_token);
      await r.set(CLAVE_CADUCA, Date.now() + Number(nuevo.expires_in ?? 0) * 1000);
      return nuevo.access_token as string;
    }
  } catch {
    // Un refresco fallido no puede tumbar la publicación: el token de ahora
    // todavía sirve. Se reintenta en la siguiente.
  }
  return actual;
}

/** Cuántas se han publicado hoy, de las 50 que deja Meta. */
export async function cupo(): Promise<{ usadas: number; total: number } | null> {
  try {
    const t = await token();
    const d = await pedir(
      `/${process.env.IG_USER_ID}/content_publishing_limit?fields=quota_usage,config&access_token=${encodeURIComponent(t)}`,
    );
    const fila = d?.data?.[0];
    return { usadas: Number(fila?.quota_usage ?? 0), total: Number(fila?.config?.quota_total ?? 50) };
  } catch {
    return null;
  }
}

/**
 * Cuáles de estas piezas ya salieron, en una sola ida a Redis.
 *
 * Con `get` por pieza, un panel con cien piezas son cien comandos por visita, y
 * el plan gratis se cuenta por comandos.
 */
export async function publicadas(
  ids: readonly string[],
): Promise<Map<string, Publicada>> {
  if (ids.length === 0) return new Map();
  const filas = await redis()
    .mget<(Publicada | null)[]>(...ids.map(CLAVE_PUBLICADA))
    .catch(() => null);
  const salida = new Map<string, Publicada>();
  filas?.forEach((fila, i) => {
    const id = ids[i];
    if (fila && id) salida.set(id, fila);
  });
  return salida;
}

/**
 * Sube la story de una pieza.
 *
 * Dos llamadas: se crea el contenedor con la URL de la imagen y luego se
 * publica. **La URL tiene que ser la de producción**: Meta va a buscarla ella
 * misma, y un preview de Vercel está detrás de protección y le devuelve un 401.
 */
export async function publicarStory(id: string, base: string): Promise<string> {
  const t = await token();
  const usuario = process.env.IG_USER_ID;
  if (!usuario) throw new Error("falta IG_USER_ID");

  const contenedor = await pedir(`/${usuario}/media`, {
    media_type: "STORIES",
    image_url: `${base}/api/story/${id}`,
    access_token: t,
  });
  if (!contenedor?.id) throw new Error("Meta no devolvió contenedor");

  const publicado = await pedir(`/${usuario}/media_publish`, {
    creation_id: String(contenedor.id),
    access_token: t,
  });
  if (!publicado?.id) throw new Error("Meta no devolvió la publicación");

  const media = String(publicado.id);
  await redis().set(CLAVE_PUBLICADA(id), { cuando: Date.now(), media } satisfies Publicada);
  return media;
}
