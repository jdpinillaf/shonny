"use server";

import { redirect } from "next/navigation";
import { ES_ID } from "@/content/pieza";
import { abrirSesion, cerrarSesion, haySesion, puedeIntentar } from "@/lib/admin.server";
import { retirarPieza } from "@/lib/piezas.server";
import { publicarStory } from "@/lib/story/instagram.server";

/**
 * Las tres acciones del panel.
 *
 * **Cada una comprueba la sesión por su cuenta.** Un action es un POST público
 * contra la ruta: que la página no pinte el botón si no has entrado no impide
 * que alguien mande el formulario a mano. El render no es el guardia.
 */

export async function entrar(datos: FormData) {
  if (!(await puedeIntentar())) redirect("/admin?mal=espera");
  const ok = await abrirSesion(String(datos.get("token") ?? ""));
  redirect(ok ? "/admin" : "/admin?mal=1");
}

export async function salir() {
  await cerrarSesion();
  redirect("/admin");
}

export async function retirar(datos: FormData) {
  if (!(await haySesion())) redirect("/admin");

  const id = String(datos.get("id") ?? "");
  // El id termina siendo el pathname del blob que se borra: se valida antes.
  if (!ES_ID.test(id)) redirect("/admin");

  await retirarPieza(id);

  // Se vuelve a `/admin` limpio para soltar el `?borrar=` de la confirmación:
  // sin esto, recargar reabre el "¿seguro?" sobre una pieza que ya no existe.
  redirect("/admin");
}

/**
 * Sacar una pieza como story en la cuenta.
 *
 * El `redirect` va **fuera** del `try`: `redirect()` funciona lanzando, así que
 * dentro lo cazaría el `catch` y el error de Meta se comería el suyo propio.
 */
export async function publicar(datos: FormData) {
  if (!(await haySesion())) redirect("/admin");

  const id = String(datos.get("id") ?? "");
  if (!ES_ID.test(id)) redirect("/admin");

  // Meta va a buscar la imagen ella misma: tiene que ser el dominio público.
  // En local no hay ninguno y no se puede publicar, que es lo correcto.
  const dominio = process.env.VERCEL_PROJECT_PRODUCTION_URL;

  let mal: string | null = null;
  if (!dominio) {
    mal = "sin dominio de producción: Meta no puede ver la imagen";
  } else {
    try {
      await publicarStory(id, `https://${dominio}`);
    } catch (e) {
      mal = e instanceof Error ? e.message : "falló y no dijo por qué";
    }
  }

  redirect(mal ? `/admin?ig=${encodeURIComponent(mal.slice(0, 140))}` : "/admin?ig=ok");
}
