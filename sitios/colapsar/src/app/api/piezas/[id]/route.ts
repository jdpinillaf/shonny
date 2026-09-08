import { ES_ID } from "@/content/pieza";
import { esAdmin } from "@/lib/admin.server";
import { retirarPieza } from "@/lib/piezas.server";

/**
 * Retirar una pieza de la pared, desde la terminal.
 *
 * El panel de `/admin` hace lo mismo con el dedo, pero esto se queda: es lo que
 * funciona cuando lo que está roto es la página.
 *
 *   curl -X DELETE https://…/api/piezas/<id> -H "authorization: Bearer $ADMIN_TOKEN"
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const dado = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!esAdmin(dado)) return new Response(null, { status: 404 });

  const { id } = await params;
  if (!ES_ID.test(id)) return new Response(null, { status: 400 });

  const pieza = await retirarPieza(id);
  if (!pieza) return new Response(null, { status: 404 });

  return Response.json({ ok: true, id });
}
