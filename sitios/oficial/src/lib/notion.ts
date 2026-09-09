import "server-only";
import type { Anuncio, Evento } from "@shonny/datos/tipos";

/**
 * Notion como panel de la operación.
 *
 * La operación de Shonny ya vive en Notion —estrategia, contenido, métricas— así
 * que el sitio lee de ahí en vez de pedirle a nadie que cargue las mismas fechas
 * dos veces. La razón larga está en `docs/decisiones/`.
 *
 * Reemplaza a `wix.ts` con las mismas dos firmas a propósito: `contenido.ts` no
 * tuvo que cambiar de forma, solo de import.
 *
 * REST directo y sin SDK, igual que con Wix: la autenticación son dos cabeceras y
 * el SDK no aporta nada que compense una dependencia más.
 *
 * Sin `NOTION_TOKEN`, todo devuelve `null` y el sitio cae al contenido versionado
 * de `datos/`.
 */

/** Cinco minutos. Se cambia una fecha en Notion y se ve en el sitio enseguida. */
const REVALIDAR = 300;

/**
 * La versión de la API se fija a mano. Notion la usa para no romper integraciones
 * viejas: sin la cabecera, la cuenta responde con la versión que tenga por
 * defecto ese día, y eso convierte cualquier despliegue suyo en un despliegue
 * nuestro.
 */
const VERSION = "2022-06-28";

function cabeceras() {
  const token = process.env.NOTION_TOKEN;
  if (!token) return null;
  return {
    authorization: `Bearer ${token}`,
    "Notion-Version": VERSION,
    "content-type": "application/json",
  };
}

async function consultar<T>(baseId: string | undefined, cuerpo: unknown): Promise<T | null> {
  const h = cabeceras();
  if (!h || !baseId) return null;
  try {
    const r = await fetch(`https://api.notion.com/v1/databases/${baseId}/query`, {
      method: "POST",
      headers: h,
      body: JSON.stringify(cuerpo),
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
 * Notion devuelve cada propiedad envuelta en su tipo, y el envoltorio cambia
 * según el tipo. Estas cuatro funciones son todo lo que hace falta para
 * desenvolverlas sin arrastrar el SDK.
 */
type Props = Record<string, any>;

const texto = (p: Props, n: string): string =>
  (p[n]?.title ?? p[n]?.rich_text ?? []).map((t: any) => t.plain_text).join("") ||
  p[n]?.url ||
  p[n]?.email ||
  "";

const fecha = (p: Props, n: string): string => p[n]?.date?.start ?? "";
const numero = (p: Props, n: string): number | undefined => p[n]?.number ?? undefined;
const opcion = (p: Props, n: string): string => p[n]?.select?.name ?? "";

/**
 * El anuncio activo.
 *
 * Se filtra por el interruptor `Activo` y se toma el de fecha más reciente, así
 * los anuncios que vienen se pueden dejar escritos con calma y encender el día
 * que salen, en vez de escribirlos con prisa.
 */
export async function anuncio(): Promise<Anuncio | null> {
  const r = await consultar<{ results: { properties: Props }[] }>(
    process.env.NOTION_DB_ANUNCIOS,
    {
      filter: { property: "Activo", checkbox: { equals: true } },
      sorts: [{ property: "Fecha", direction: "descending" }],
      page_size: 1,
    },
  );

  const p = r?.results?.[0]?.properties;
  if (!p) return null;

  const titulo = texto(p, "Título");
  if (!titulo) return null;

  const extraTexto = texto(p, "Extra texto");
  const extraUrl = texto(p, "Extra URL");

  return {
    activo: true,
    titulo,
    fecha: fecha(p, "Fecha"),
    tipo: (opcion(p, "Tipo") as Anuncio["tipo"]) || "single",
    frase: texto(p, "Frase"),
    portada: texto(p, "Portada"),
    spotifyTrackId: texto(p, "Spotify track") || undefined,
    presave: texto(p, "Pre-save") || undefined,
    extra: extraTexto && extraUrl ? { texto: extraTexto, url: extraUrl } : undefined,
  };
}

/**
 * Las fechas que salen al sitio.
 *
 * Tres condiciones, y las tres importan: **confirmado** (un prospecto no se
 * anuncia), **público** (hay shows privados y corporativos que no se cuentan) y
 * **de hoy en adelante**. Un sitio que muestra un show del mes pasado se lee peor
 * que uno que dice que no hay fechas.
 *
 * El filtro de fecha usa `on_or_after: hoy` y no `after`: un show es del día
 * entero, y a las tres de la tarde del día del show todavía tiene que aparecer.
 */
export async function eventos(): Promise<Evento[] | null> {
  const hoy = new Date().toISOString().slice(0, 10);

  const r = await consultar<{ results: { id: string; properties: Props }[] }>(
    process.env.NOTION_DB_SHOWS,
    {
      filter: {
        and: [
          { property: "Estado", select: { equals: "Confirmado" } },
          { property: "Público", checkbox: { equals: true } },
          { property: "Fecha", date: { on_or_after: hoy } },
        ],
      },
      sorts: [{ property: "Fecha", direction: "ascending" }],
      page_size: 20,
    },
  );
  if (!r?.results) return null;

  return r.results
    .map((fila) => {
      const p = fila.properties;
      return {
        slug: fila.id,
        titulo: texto(p, "Show"),
        inicio: fecha(p, "Fecha"),
        lugar: texto(p, "Venue"),
        ciudad: texto(p, "Ciudad"),
        url: texto(p, "Entradas") || undefined,
      };
    })
    .filter((e) => e.titulo && e.inicio);
}

/**
 * Lo que el sitio NO lee de acá, a propósito: `Cachet`, `Contacto` y `Correo`.
 * Están en la misma fila que todo lo demás, y la única razón de que no salgan es
 * que este archivo no los pide. Si algún día alguien agrega un campo al mapeo de
 * arriba sin pensar, los publica.
 */
export const NUNCA_SALEN = ["Cachet", "Contacto", "Correo", "Próximo paso", "Vence"] as const;
