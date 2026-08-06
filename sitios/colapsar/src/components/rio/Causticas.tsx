"use client";

/**
 * La luz que se cuela por la superficie, dibujada ENCIMA de las notas.
 *
 * Es la capa que las mete adentro del agua: el shader ya refracta las fotos,
 * pero las notas son DOM y el agua no las toca. Con esta luz pasándoles por
 * arriba dejan de verse pegadas sobre el río.
 */
export function Causticas({ quieto }: { quieto: boolean }) {
  if (quieto) return null;

  return (
    <div
      aria-hidden
      className="causticas pointer-events-none fixed inset-0 z-20"
      style={{ mixBlendMode: "overlay" }}
    />
  );
}
