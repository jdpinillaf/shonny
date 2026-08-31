/**
 * El gris del chinche, y la fórmula de su sombra.
 *
 * Están sueltos, fuera del componente, porque hay un cuarto sitio que dibuja un
 * chinche y **no puede usarlo**: la story de Instagram, que la pinta Satori, que
 * no entiende ni `className` ni componentes de React DOM. Copiar el color allí
 * era volver exactamente al problema que este archivo existe para evitar.
 *
 * El desenfoque crece con el chinche. No es un capricho: los dos sitios que ya
 * existían usaban 2px a 7px y 3px a 11px, y con un valor fijo el chinche grande
 * de la pieza abierta se queda sin peso. La fórmula da justo esos dos.
 *
 * `brillo` sale aparte porque la story dibuja el chinche a 46px sobre un lienzo
 * de 1080: con el 1px de la pantalla, el reflejo metálico desaparece del todo.
 */
export const CHINCHE_COLOR = "#8c8377";

export const sombraChinche = (tamano: number, brillo = 1) =>
  `0 ${brillo}px ${Math.max(2, Math.round(tamano / 4))}px rgba(0,0,0,0.8),` +
  ` inset 0 ${brillo}px 0 rgba(255,255,255,0.5)`;

/**
 * El chinche que sostiene un papel.
 *
 * Estaba escrito tres veces —la nota de la pared, la pieza abierta y el papelito
 * que abre el mural— con el mismo color y la misma sombra copiados a mano. Es
 * exactamente la forma en que el pie de las notas se desincronizó en su día, así
 * que vive en un solo sitio: si cambia el chinche, cambian los tres. Cuatro,
 * desde la story.
 *
 * El brillo no es adorno: la sombra dura por debajo lo levanta del papel y el
 * `inset` claro por arriba es lo que lo hace metálico en vez de un círculo gris.
 *
 * Se coloca centrado sobre el borde de arriba de quien lo contenga, que tiene
 * que ser `relative`. En la pared es además el eje del péndulo (`.nota` lleva
 * `transform-origin: 50% 2px`), por eso siempre va en el mismo punto.
 */
export function Chinche({ tamano }: { tamano: number }) {
  return (
    <div
      aria-hidden
      className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full"
      style={{
        width: tamano,
        height: tamano,
        background: CHINCHE_COLOR,
        boxShadow: sombraChinche(tamano),
      }}
    />
  );
}
