import { ImageResponse } from "next/og";
import sharp from "sharp";
import { PIEZAS_SEMILLA } from "@/content/coleccion";
import { ES_ID, unir } from "@/content/pieza";
import { site } from "@/content/site";
import { leerPiezas } from "@/lib/piezas.server";
import { courierPrime } from "@/lib/story/fuentes";
import { ALTO, ANCHO, Pared, paredDe, recortar } from "@/lib/story/pared";

/** Dibujar y comprimir. Sobra, pero un arranque en frío de sharp no es gratis. */
export const maxDuration = 30;

/**
 * Los ids de las semillas: `s01` en `notas.ts`, `f01` en la colección de fotos.
 *
 * Hace falta además de `ES_ID` porque el visitante puede abrir una semilla igual
 * que abre lo que ha dejado alguien, y `ES_ID` solo casa uuid. Sin esto, las
 * dieciséis notas del repo —que son la mayor parte de la pared— no se pueden
 * compartir.
 */
const ES_SEMILLA = /^[sf][0-9]{2}$/;

/**
 * La story de una pieza: 1080x1920, lista para Instagram.
 *
 * Una sola ruta para los dos caminos. El botón de la pieza abierta la pide con
 * `fetch` y se la pasa a la hoja del sistema; Meta la va a buscar a esta misma
 * URL cuando se publica desde el panel. El diseño no se duplica en ningún lado.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!ES_ID.test(id) && !ES_SEMILLA.test(id)) {
    return new Response(null, { status: 404 });
  }

  const todas = unir(await leerPiezas(), PIEZAS_SEMILLA);
  const pieza = todas.find((p) => p.id === id);

  // **Sin texto no hay story.** Las piezas de solo foto —los televisores— no
  // tienen confesión que enseñar, y la composición entera está construida
  // alrededor de una frase en un papel. El botón tampoco se pinta para ellas.
  if (!pieza?.texto) return new Response(null, { status: 404 });

  const png = new ImageResponse(
    (
      <Pared
        pieza={{ ...pieza, texto: recortar(pieza.texto, site.maxRespuesta) }}
        fondo={paredDe(id, todas)}
      />
    ),
    {
      width: ANCHO,
      height: ALTO,
      fonts: [
        { name: "Courier Prime", data: await courierPrime(), weight: 400, style: "normal" },
      ],
    },
  );

  // A JPEG y no PNG: la API de Meta solo acepta JPEG para stories, y son 300 KB
  // en vez de 1.4 MB por los datos móviles de quien la comparta.
  const jpeg = await sharp(Buffer.from(await png.arrayBuffer()))
    .jpeg({ quality: 92, chromaSubsampling: "4:4:4" })
    .toColorspace("srgb")
    .toBuffer();

  return new Response(new Uint8Array(jpeg), {
    headers: {
      "content-type": "image/jpeg",
      // Un día en el CDN, no un año. La imagen de una pieza no cambia nunca, así
      // que `immutable` sería lo correcto… si se pudiera purgar. No se puede:
      // `revalidatePath` gobierna las cachés de Next, no una entrada del CDN
      // puesta a mano con `s-maxage`. Con un año, retirar una confesión del
      // panel la dejaría servida en internet igualmente. Un día es el techo de
      // lo que puede sobrevivir a su propio borrado.
      "cache-control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
