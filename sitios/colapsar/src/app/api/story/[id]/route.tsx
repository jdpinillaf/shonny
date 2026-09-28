import { ImageResponse } from "next/og";
import sharp from "sharp";
import { PIEZAS_SEMILLA } from "@/content/coleccion";
import { ES_ID, unir } from "@/content/pieza";
import { site } from "@/content/site";
import { leerPiezas } from "@/lib/piezas.server";
import { courierPrime } from "@/lib/story/fuentes";
import {
  ALTO,
  ALTO_SOLO,
  ANCHO,
  ANCHO_SOLO,
  Composicion,
  ESCALA,
  recortar,
} from "@/lib/story/composicion";

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
 * El papel suelto se rasteriza al doble: se exporta para usarlo fuera —un post,
 * un diseño— y ahí sí se amplía. El lienzo es chico, así que sale barato.
 */
const ESCALA_PAPEL = 2;

/** El aire transparente que se deja alrededor del papel ya recortado. */
const AIRE = 24;

/**
 * Los tres formatos que sirve la ruta:
 *
 * - `story` (por defecto): JPEG 1080x1920, lo que pide la API de Meta y lo que
 *   comparte el botón de la pieza.
 * - `png`: la misma story en PNG, sin pérdida. Se exporta desde el panel.
 * - `papel`: solo el papel con su chinche, PNG sobre transparente.
 */
type Formato = "story" | "png" | "papel";

function formatoDe(url: URL): Formato {
  const f = url.searchParams.get("formato");
  return f === "png" || f === "papel" ? f : "story";
}

/**
 * La story de una pieza: 1080x1920, lista para Instagram.
 *
 * Una sola ruta para los dos caminos. El botón de la pieza abierta la pide con
 * `fetch` y se la pasa a la hoja del sistema; Meta la va a buscar a esta misma
 * URL cuando se publica desde el panel. El diseño no se duplica en ningún lado.
 */
export async function GET(
  request: Request,
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

  const url = new URL(request.url);
  const formato = formatoDe(url);
  const texto = recortar(pieza.texto, site.maxRespuesta);
  const fuentes = [
    { name: "Courier Prime", data: await courierPrime(), weight: 400 as const, style: "normal" as const },
  ];

  // `?descargar` convierte la misma imagen en un archivo con nombre: el panel lo
  // usa para que exportar no sea abrir una pestaña y guardar a mano.
  const archivo = url.searchParams.has("descargar")
    ? `colapsar-${id.slice(0, 8)}-${formato === "papel" ? "papel" : "story"}.${formato === "story" ? "jpg" : "png"}`
    : null;

  if (formato === "papel") {
    const lienzo = new ImageResponse(
      (
        <div style={{ display: "flex", transform: `scale(${ESCALA_PAPEL})`, transformOrigin: "top left" }}>
          <Composicion pieza={{ ...pieza, texto }} lienzo="papel" />
        </div>
      ),
      { width: ANCHO_SOLO * ESCALA_PAPEL, height: ALTO_SOLO * ESCALA_PAPEL, fonts: fuentes },
    );

    // El lienzo sobra a propósito: `trim` se come todo el transparente que
    // rodea al papel —la esquina de arriba a la izquierda es la referencia— y
    // `extend` le devuelve un margen fijo, para que el giro y la sombra no
    // queden pegados al borde del archivo.
    const papel = await sharp(Buffer.from(await lienzo.arrayBuffer()))
      .trim()
      .extend({ top: AIRE, bottom: AIRE, left: AIRE, right: AIRE, background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    return imagen(papel, "image/png", archivo);
  }

  const t0 = performance.now();
  const png = new ImageResponse(
    (
      // El lienzo mide 3/4 y la composición se dibuja dentro a escala. Así la
      // composición se sigue escribiendo en píxeles de 1080 y no hay dos juegos
      // de medidas que mantener sincronizados.
      <div style={{ display: "flex", transform: `scale(${ESCALA})`, transformOrigin: "top left" }}>
      <Composicion pieza={{ ...pieza, texto }} />
      </div>
    ),
    {
      width: Math.round(ANCHO * ESCALA),
      height: Math.round(ALTO * ESCALA),
      fonts: fuentes,
    },
  );

  // A JPEG y no PNG: la API de Meta solo acepta JPEG para stories, y son 300 KB
  // en vez de 1.4 MB por los datos móviles de quien la comparta.
  const crudo = Buffer.from(await png.arrayBuffer());
  const t1 = performance.now();
  const escalada = sharp(crudo).resize(ANCHO, ALTO, { kernel: "lanczos3" });
  const salida =
    formato === "png"
      ? await escalada.png().toBuffer()
      : await escalada.jpeg({ quality: 92, chromaSubsampling: "4:4:4" }).toColorspace("srgb").toBuffer();

  const t2 = performance.now();
  console.log(`[story] satori=${(t1 - t0).toFixed(0)}ms sharp=${(t2 - t1).toFixed(0)}ms`);

  return imagen(salida, formato === "png" ? "image/png" : "image/jpeg", archivo);
}

function imagen(bytes: Buffer, tipo: string, archivo: string | null) {
  return new Response(new Uint8Array(bytes), {
    headers: {
      "content-type": tipo,
      ...(archivo && { "content-disposition": `attachment; filename="${archivo}"` }),
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
