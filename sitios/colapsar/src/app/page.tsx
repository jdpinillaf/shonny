import { Museo } from "@/components/Museo";
import { PIEZAS_SEMILLA } from "@/content/coleccion";
import { leerPiezas } from "@/lib/piezas.server";

/**
 * Un minuto. La pared no es un chat: que lo que deja alguien tarde un momento en
 * salir para los demás no se nota, y a cambio la página se sirve casi siempre
 * desde caché. Cuando se aprueba una pieza, el route handler llama a
 * `revalidatePath("/")` y esto se rehace sin esperar al minuto.
 *
 * Literal y no una cuenta: Next 16 lo lee estáticamente del módulo.
 */
export const revalidate = 60;

export default async function Home() {
  const aprobadas = await leerPiezas();
  return <Museo piezas={[...PIEZAS_SEMILLA, ...aprobadas]} />;
}
