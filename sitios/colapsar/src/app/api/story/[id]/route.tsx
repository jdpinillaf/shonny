import { ImageResponse } from "next/og";
import sharp from "sharp";
import { PIEZAS_SEMILLA } from "@/content/coleccion";
import { ES_ID, unir } from "@/content/pieza";
import { site } from "@/content/site";
import { leerPiezas } from "@/lib/piezas.server";
import { courierPrime } from "@/lib/story/fuentes";
import { ALTO, ANCHO, ESCALA, Pared, paredDe, recortar } from "@/lib/story/pared";

/**
 * La penumbra de la sala, como imagen.
 *
 * Vivía dentro de la composición, como un `radial-gradient` a pantalla completa,
 * y costaba medio segundo del render en local —varios en la función—. Acá la
 * rasteriza librsvg una sola vez por instancia y componerla son 20 ms.
 */
const PENUMBRA = `<svg xmlns="http://www.w3.org/2000/svg" width="${ANCHO}" height="${ALTO}">
  <radialGradient id="p" cx="50%" cy="47%" r="80%">
    <stop offset="24%" stop-color="#0b0d0c" stop-opacity="0"/>
    <stop offset="100%" stop-color="#0b0d0c" stop-opacity="0.94"/>
  </radialGradient>
  <rect width="${ANCHO}" height="${ALTO}" fill="url(#p)"/>
</svg>`;

let penumbra: Buffer | null = null;
async function capaPenumbra(): Promise<Buffer> {
  return (penumbra ??= await sharp(Buffer.from(PENUMBRA)).png().toBuffer());
}

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

  const t0 = performance.now();
  const png = new ImageResponse(
    (
      // El lienzo mide 3/4 y la composición se dibuja dentro a escala. Así la
      // composición se sigue escribiendo en píxeles de 1080 y no hay dos juegos
      // de medidas que mantener sincronizados.
      <div style={{ display: "flex", transform: `scale(${ESCALA})`, transformOrigin: "top left" }}>
      <Pared
        pieza={{ ...pieza, texto: recortar(pieza.texto, site.maxRespuesta) }}
        fondo={paredDe(id, todas)}
      />
      </div>
    ),
    {
      width: Math.round(ANCHO * ESCALA),
      height: Math.round(ALTO * ESCALA),
      fonts: [
        { name: "Courier Prime", data: await courierPrime(), weight: 400, style: "normal" },
      ],
    },
  );

  // A JPEG y no PNG: la API de Meta solo acepta JPEG para stories, y son 300 KB
  // en vez de 1.4 MB por los datos móviles de quien la comparta.
  const crudo = Buffer.from(await png.arrayBuffer());
  const t1 = performance.now();
  const jpeg = await sharp(crudo)
    .resize(ANCHO, ALTO, { kernel: "lanczos3" })
    .composite([{ input: await capaPenumbra(), blend: "over" }])
    .jpeg({ quality: 92, chromaSubsampling: "4:4:4" })
    .toColorspace("srgb")
    .toBuffer();

  const t2 = performance.now();
  console.log(`[story] satori=${(t1 - t0).toFixed(0)}ms sharp=${(t2 - t1).toFixed(0)}ms`);

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
