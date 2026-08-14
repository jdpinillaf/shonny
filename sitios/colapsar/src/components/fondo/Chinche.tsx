/**
 * El chinche que sostiene un papel.
 *
 * Estaba escrito tres veces —la nota de la pared, la pieza abierta y el papelito
 * que abre el mural— con el mismo color y la misma sombra copiados a mano. Es
 * exactamente la forma en que el pie de las notas se desincronizó en su día, así
 * que vive en un solo sitio: si cambia el chinche, cambian los tres.
 *
 * El brillo no es adorno: la sombra dura por debajo lo levanta del papel y el
 * `inset` claro por arriba es lo que lo hace metálico en vez de un círculo gris.
 *
 * Se coloca centrado sobre el borde de arriba de quien lo contenga, que tiene
 * que ser `relative`. En la pared es además el eje del péndulo (`.nota` lleva
 * `transform-origin: 50% 2px`), por eso siempre va en el mismo punto.
 */
export function Chinche({ tamano }: { tamano: number }) {
  // El desenfoque crece con el chinche. No es un capricho: los dos sitios que ya
  // existían usaban 2px a 7px y 3px a 11px, y con un valor fijo el chinche
  // grande de la pieza abierta se queda sin peso. La fórmula da justo esos dos.
  const desenfoque = Math.max(2, Math.round(tamano / 4));

  return (
    <div
      aria-hidden
      className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full"
      style={{
        width: tamano,
        height: tamano,
        background: "#8c8377",
        boxShadow: `0 1px ${desenfoque}px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.5)`,
      }}
    />
  );
}
