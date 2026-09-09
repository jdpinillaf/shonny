import "server-only";
import { contenido as versionado } from "@shonny/datos";
import type { Contenido } from "@shonny/datos/tipos";
import { discografia } from "./spotify";
import { anuncio as anuncioNotion, eventos as eventosNotion } from "./notion";

/**
 * De dónde sale cada cosa.
 *
 * Esta es la única función del sitio que sabe que existen Notion y Spotify. Todo lo
 * demás recibe un `Contenido` y no puede notar de dónde vino, que es lo que
 * permite construir y desplegar hoy sin credenciales y encender las fuentes
 * después sin tocar un componente.
 *
 * El orden es siempre el mismo: si la fuente viva contesta, manda ella; si no,
 * manda lo que está escrito en `datos/`. Nunca al revés, y nunca una mezcla a
 * medias de las dos.
 *
 *   discografía → Spotify, si hay credenciales
 *   anuncio     → Wix CMS, si hay API key
 *   fechas      → Wix Events, si hay API key
 *   el resto    → el repo
 *
 * **Las tres llamadas van en paralelo.** En serie, una API lenta retrasa a las
 * otras dos por nada: no dependen entre sí.
 */
export async function leerContenido(): Promise<Contenido> {
  const [canciones, anuncio, eventos] = await Promise.all([
    discografia(),
    anuncioNotion(),
    eventosNotion(),
  ]);

  return {
    ...versionado,
    canciones: canciones ?? versionado.canciones,
    anuncio: anuncio ?? versionado.anuncio,
    eventos: eventos ?? versionado.eventos,
  };
}

/**
 * Qué fuentes están vivas. Se usa en el pie del panel y en los logs de build,
 * para que "el sitio muestra la discografía vieja" tenga una respuesta de una
 * línea en vez de una tarde de depuración.
 */
export function fuentes() {
  return {
    spotify: Boolean(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET),
    notion: Boolean(process.env.NOTION_TOKEN && process.env.NOTION_DB_SHOWS),
  };
}

/** ¿El anuncio es de algo que todavía no salió? Decide player contra pre-save. */
export function esFuturo(fecha: string): boolean {
  const t = Date.parse(fecha);
  return Number.isFinite(t) && t > Date.now();
}
