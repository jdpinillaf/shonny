import { put } from "@vercel/blob";
import { revalidateTag } from "next/cache";
import { after } from "next/server";
import sharp from "sharp";
import { ES_ID, type Pieza } from "@/content/pieza";
import { site } from "@/content/site";
import { moderar } from "@/lib/moderar";
import { guardarPieza, hayPresupuesto, puedeEnviar, TAG } from "@/lib/piezas.server";

/** El trabajo de verdad vive en `after()`, pero se cobra contra este techo. */
export const maxDuration = 30;

/** Lado máximo. El cliente ya lo trae así; esto es por si no vino del cliente. */
const MAX_LADO = 1600;

/** Más que esto no es una foto de alguien, es un intento de tumbar la función. */
const MAX_BYTES = 4_000_000;

/**
 * Bombas de descompresión: un PNG de 20000x20000 pesa poco comprimido y revienta
 * la memoria al decodificar. Por encima de esto, `sharp` lanza y se rechaza.
 */
const MAX_PIXELES = 40_000_000;

/**
 * Qué es de verdad este archivo, mirándole los primeros bytes.
 *
 * `File.type` lo pone el navegador con lo que diga la extensión: es un dato del
 * cliente y no se puede creer. SVG se excluye a propósito aunque sea una imagen
 * — lleva script dentro y no hay ninguna razón para aceptarlo acá.
 */
function tipoReal(b: Uint8Array): "image/jpeg" | "image/png" | "image/webp" | null {
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (
    b[0] === 0x89 &&
    b[1] === 0x50 &&
    b[2] === 0x4e &&
    b[3] === 0x47 &&
    b[4] === 0x0d &&
    b[5] === 0x0a &&
    b[6] === 0x1a &&
    b[7] === 0x0a
  ) {
    return "image/png";
  }
  const txt = (i: number, s: string) =>
    [...s].every((c, k) => b[i + k] === c.charCodeAt(0));
  if (txt(0, "RIFF") && txt(8, "WEBP")) return "image/webp";
  return null;
}

function ipDe(request: Request): string {
  // `x-vercel-forwarded-for` es la que Vercel no deja sobrescribir a un proxy;
  // `x-forwarded-for` sí se puede falsear si hay algo delante.
  return (
    request.headers.get("x-vercel-forwarded-for") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "anon"
  );
}

/**
 * Deja una pieza en el museo.
 *
 * **Responde 200 siempre.** Pase lo que pase: rechazada por el filtro, cortada
 * por el rate limit, o con el modelo caído. Un 4xx delataría dónde está el
 * límite —y quien vino a tantearlo lo encontraría en tres intentos— y además
 * haría que un fallo de infraestructura se leyera como un rechazo. El silencio
 * es el diseño, no un descuido.
 *
 * El trabajo caro va en `after()`: la persona ya está mirando el acto del
 * colapso y puede cerrar la pestaña, y una petición abortada se lleva por
 * delante la invocación entera. `after()` corre después de vaciar la respuesta.
 */
export async function POST(request: Request) {
  const gracias = () => Response.json({ ok: true });

  let formulario: FormData;
  try {
    formulario = await request.formData();
  } catch {
    return gracias();
  }

  if (!(await puedeEnviar(ipDe(request)))) return gracias();

  const id = String(formulario.get("id") ?? "");
  const texto = String(formulario.get("texto") ?? "")
    .trim()
    .slice(0, site.maxRespuesta);
  const adjunto = formulario.get("foto");

  // El id termina siendo el pathname del blob: se valida antes de que llegue
  // a tocarlo.
  if (!ES_ID.test(id)) return gracias();
  if (!texto && !(adjunto instanceof File)) return gracias();

  // `Buffer` y no `Uint8Array` porque es lo que pide `put()`. Es una subclase,
  // así que `sharp` y el modelo lo aceptan igual.
  let bytes: Buffer | undefined;
  if (adjunto instanceof File) {
    if (adjunto.size > MAX_BYTES) return gracias();
    bytes = Buffer.from(await adjunto.arrayBuffer());
  }

  after(async () => {
    let foto: Pieza["foto"];

    if (bytes) {
      if (!tipoReal(bytes)) return;
      try {
        // Reencodar hace cuatro cosas de una: confirma que es una imagen de
        // verdad (si no decodifica, lanza), le quita el EXIF —ahí va la
        // geolocalización—, endereza lo que venga tumbado de un móvil, y acota
        // el peso. El cliente ya hace lo mismo, pero el cliente no es de fiar.
        const normalizada = await sharp(bytes, { limitInputPixels: MAX_PIXELES })
          .rotate()
          .resize(MAX_LADO, MAX_LADO, { fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 82 })
          .toBuffer({ resolveWithObject: true });

        bytes = normalizada.data;
        foto = { url: "", w: normalizada.info.width, h: normalizada.info.height };
      } catch {
        return;
      }
    }

    if (!(await hayPresupuesto())) return;
    if (!(await moderar(texto, bytes ? { bytes, mediaType: "image/jpeg" } : undefined))) {
      // Rechazada. Los bytes no han salido de memoria: nada que limpiar.
      return;
    }

    if (foto && bytes) {
      const subida = await put(`piezas/${id}.jpg`, bytes, {
        access: "public",
        addRandomSuffix: false,
        contentType: "image/jpeg",
        cacheControlMaxAge: 31_536_000,
      });
      foto = { ...foto, url: subida.url };
    }

    await guardarPieza({ id, texto: texto || undefined, foto, creado: Date.now() });

    // `"max"` marca la colección como pasada, no la tira: la siguiente visita
    // ve lo de antes y la fresca se trae por detrás. Nadie está esperando —
    // quien acaba de escribir ya tiene su nota en su pared— así que no vale la
    // pena hacerle pagar la espera al siguiente que entre.
    revalidateTag(TAG, "max");
  });

  return gracias();
}
