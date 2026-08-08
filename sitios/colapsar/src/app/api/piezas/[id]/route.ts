import { del } from "@vercel/blob";
import { revalidatePath, revalidateTag } from "next/cache";
import { timingSafeEqual } from "node:crypto";
import { ES_ID } from "@/content/pieza";
import { borrarPieza, TAG } from "@/lib/piezas.server";

/**
 * Retirar una pieza de la pared.
 *
 * No es opcional. El filtro de AI se equivoca, y una pared pública que cualquiera
 * puede llenar y nadie puede vaciar no se despliega. Esto es lo mínimo: un token
 * en una variable de entorno, para poder borrar algo desde el móvil un domingo.
 *
 *   curl -X DELETE https://…/api/piezas/<id> -H "authorization: Bearer $ADMIN_TOKEN"
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const esperado = process.env.ADMIN_TOKEN;
  if (!esperado) return new Response(null, { status: 404 });

  const dado = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!igual(dado, esperado)) return new Response(null, { status: 404 });

  const { id } = await params;
  if (!ES_ID.test(id)) return new Response(null, { status: 400 });

  const pieza = await borrarPieza(id);
  if (!pieza) return new Response(null, { status: 404 });

  if (pieza.foto?.url) {
    // Si el blob ya no está, `del` no es problema: la pieza ya salió de la lista.
    await del(pieza.foto.url).catch(() => {});
  }

  // Acá sí se expira de golpe, al revés que al publicar: cuando estás quitando
  // algo de la pared no quieres que la siguiente visita todavía lo vea mientras
  // se refresca por detrás. Que la próxima pague la espera.
  revalidateTag(TAG, { expire: 0 });
  revalidatePath("/");

  return Response.json({ ok: true, id });
}

/**
 * Comparación en tiempo constante.
 *
 * `timingSafeEqual` exige que los dos búferes midan lo mismo o lanza, y la
 * longitud del token no es secreta, así que se atajan antes los distintos.
 */
function igual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
