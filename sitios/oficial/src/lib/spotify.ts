import "server-only";
import type { Cancion } from "@shonny/datos/tipos";

/**
 * La discografía, leída del perfil de Spotify de la artista.
 *
 * Existe para que nadie tenga que mantener una lista de canciones a mano. El
 * sitio de Wix se desactualizó porque pedía trabajo manual, y el trabajo manual
 * no ocurre: acá ella sube la canción a Spotify —cosa que hace igual— y la
 * sección de música ya está bien.
 *
 * Usa el flujo de client credentials, que es el que sirve para leer datos
 * públicos sin que nadie inicie sesión. Las credenciales salen de crear una app
 * en developer.spotify.com; sin ellas, esta función devuelve `null` y el sitio
 * cae al contenido versionado del repo.
 */

const ARTISTA = "70axD2kGUWcyWjZAGAtgft";

/** Una hora. El catálogo de una artista no cambia cada cinco minutos, y la API
 *  tiene límites que no vale la pena gastar en visitas repetidas. */
const REVALIDAR = 3600;

type Token = { access_token: string; expires_in: number };

async function token(): Promise<string | null> {
  const id = process.env.SPOTIFY_CLIENT_ID;
  const secreto = process.env.SPOTIFY_CLIENT_SECRET;
  if (!id || !secreto) return null;

  const r = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      // Basic con las credenciales, que es lo que pide el flujo.
      authorization: `Basic ${Buffer.from(`${id}:${secreto}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
    // El token dura una hora; pedirlo en cada render sería una llamada de más.
    next: { revalidate: REVALIDAR },
  });
  if (!r.ok) return null;
  const t = (await r.json()) as Token;
  return t.access_token ?? null;
}

type Album = {
  id: string;
  name: string;
  release_date: string;
  album_type: string;
  images: { url: string; width: number }[];
  external_urls: { spotify: string };
};

/**
 * Devuelve los lanzamientos, del más nuevo al más viejo.
 *
 * Se piden ÁLBUMES y SINGLES, no "top tracks": el top ordena por popularidad y
 * eso deja el lanzamiento nuevo abajo justo cuando más importa que esté arriba.
 * `include_groups` deja fuera las apariciones en discos de otros, que no son
 * discografía propia.
 */
export async function discografia(): Promise<Cancion[] | null> {
  const bearer = await token();
  if (!bearer) return null;

  /**
   * Se pide de a 10 y no de a 50.
   *
   * La documentación dice que el límite de este endpoint es 50, y no es cierto
   * para esta app: con `limit=12` en adelante devuelve `400 Invalid limit`, y con
   * 10 contesta bien. Verificado a mano subiendo de a poco. Como ella tiene 22
   * lanzamientos, hay que paginar sí o sí.
   *
   * Las páginas van en serie y no en paralelo a propósito: son tres llamadas,
   * el ahorro sería de milisegundos, y disparar todo junto contra un endpoint
   * que ya demostró ser quisquilloso con los parámetros invita a que nos limite.
   */
  const items: Album[] = [];
  for (let desde = 0; desde < 60; desde += 10) {
    const r = await fetch(
      `https://api.spotify.com/v1/artists/${ARTISTA}/albums?include_groups=album,single&limit=10&offset=${desde}`,
      { headers: { authorization: `Bearer ${bearer}` }, next: { revalidate: REVALIDAR } },
    );
    if (!r.ok) break;
    const pagina = (await r.json()) as { items: Album[]; total: number };
    items.push(...pagina.items);
    if (items.length >= pagina.total) break;
  }
  if (!items.length) return null;

  /**
   * Spotify publica el mismo título varias veces —el single suelto, el que va
   * dentro del álbum, la versión de otro mercado— y la lista se llena de
   * duplicados. Nos quedamos con la aparición más vieja de cada título, que es
   * la fecha en que la canción salió de verdad.
   */
  const porTitulo = new Map<string, Album>();
  for (const a of items) {
    const clave = a.name.trim().toLowerCase();
    const previo = porTitulo.get(clave);
    if (!previo || a.release_date < previo.release_date) porTitulo.set(clave, a);
  }

  const ordenados = [...porTitulo.values()].sort((a, b) =>
    b.release_date.localeCompare(a.release_date),
  );

  return ordenados.map((a, i) => ({
    titulo: a.name,
    anio: Number(a.release_date.slice(0, 4)) || undefined,
    url: a.external_urls.spotify,
    portada: a.images.sort((x, y) => y.width - x.width)[0]?.url,
    // Solo la primera se marca como nueva, y solo si salió hace menos de 90 días:
    // un catálogo dormido no debería anunciar como novedad algo de hace dos años.
    nueva: i === 0 && Date.now() - Date.parse(a.release_date) < 90 * 86400_000,
  }));
}
