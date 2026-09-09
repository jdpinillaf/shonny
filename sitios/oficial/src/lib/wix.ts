import "server-only";
import type { Anuncio, Evento } from "@shonny/datos/tipos";

/**
 * Wix como panel de administración.
 *
 * La idea completa está en `docs/decisiones/2026-09-09-como-se-gestiona-el-sitio.md`:
 * ella edita en Wix, que ya sabe usar y ya paga, y este sitio lo lee. No hay CMS
 * nuevo que aprender ni suscripción que sumar.
 *
 * Se habla REST directo y no `@wix/sdk` por dos motivos: con una API key la
 * autenticación son dos cabeceras, y los módulos tipados del SDK van por detrás
 * de las versiones REST (`@wix/events` todavía expone v2 cuando la API viva es
 * la v3). Menos dependencias y menos reescrituras.
 *
 * Sin credenciales, todo esto devuelve `null` y el sitio cae al contenido
 * versionado del repo.
 */

/** Cinco minutos. Ella cambia el anuncio y quiere verlo, no esperar una hora. */
const REVALIDAR = 300;

function credenciales() {
  const clave = process.env.WIX_API_KEY;
  const sitio = process.env.WIX_SITE_ID;
  if (!clave || !sitio) return null;
  return { authorization: clave, "wix-site-id": sitio, "content-type": "application/json" };
}

async function pedir<T>(url: string, cuerpo?: unknown): Promise<T | null> {
  const cabeceras = credenciales();
  if (!cabeceras) return null;
  try {
    const r = await fetch(url, {
      method: cuerpo ? "POST" : "GET",
      headers: cabeceras,
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
      next: { revalidate: REVALIDAR },
    });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    // Un fallo de red no puede tumbar el sitio: quien llama cae al repo.
    return null;
  }
}

/**
 * El anuncio activo.
 *
 * La colección `Anuncios` del CMS de Wix, con un campo `activo`. Se filtra por
 * ese campo y se toma el más reciente: así ella deja escritos los anuncios que
 * vienen y los enciende el día que salen, en vez de escribirlos con prisa.
 */
export async function anuncio(): Promise<Anuncio | null> {
  type Fila = {
    dataItems?: { data: Record<string, unknown> }[];
  };
  const r = await pedir<Fila>("https://www.wixapis.com/wix-data/v2/items/query", {
    dataCollectionId: "Anuncios",
    query: {
      filter: { activo: true },
      sort: [{ fieldName: "fecha", order: "DESC" }],
      paging: { limit: 1 },
    },
  });

  const d = r?.dataItems?.[0]?.data;
  if (!d) return null;

  return {
    activo: true,
    titulo: String(d.titulo ?? ""),
    fecha: String(d.fecha ?? ""),
    tipo: (d.tipo as Anuncio["tipo"]) ?? "single",
    frase: String(d.frase ?? ""),
    portada: String(d.portada ?? ""),
    spotifyTrackId: d.spotifyTrackId ? String(d.spotifyTrackId) : undefined,
    presave: d.presave ? String(d.presave) : undefined,
    extra:
      d.extraTexto && d.extraUrl
        ? { texto: String(d.extraTexto), url: String(d.extraUrl) }
        : undefined,
  };
}

/**
 * Las fechas, de Wix Events.
 *
 * Solo las que todavía no pasaron y en orden. Un sitio que muestra un show del
 * mes pasado se lee peor que uno que dice que no hay fechas.
 */
export async function eventos(): Promise<Evento[] | null> {
  type Respuesta = {
    events?: {
      slug?: string;
      title?: string;
      dateAndTimeSettings?: { startDate?: string };
      location?: { name?: string; address?: { city?: string } };
    }[];
  };

  const r = await pedir<Respuesta>("https://www.wixapis.com/events/v3/events/query", {
    query: {
      filter: { status: "UPCOMING" },
      sort: [{ fieldName: "dateAndTimeSettings.startDate", order: "ASC" }],
      cursorPaging: { limit: 20 },
    },
  });
  if (!r?.events) return null;

  return r.events.map((e) => ({
    slug: e.slug ?? "",
    titulo: e.title ?? "",
    inicio: e.dateAndTimeSettings?.startDate ?? "",
    lugar: e.location?.name ?? "",
    ciudad: e.location?.address?.city ?? "",
    url: e.slug ? `https://www.shonny.co/event-details/${e.slug}` : undefined,
  }));
}
