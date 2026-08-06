"use client";

import { useMotionValue, useSpring, type MotionValue } from "motion/react";
import { useEffect } from "react";

export type Puntero = { x: MotionValue<number>; y: MotionValue<number> };

/**
 * Posición del puntero normalizada a −1..1 desde el centro de la pantalla.
 *
 * Devuelve MotionValues, no estado de React: un `useState` en mousemove
 * re-renderiza el árbol entero decenas de veces por segundo y con veinte notas
 * encima eso se nota. El resorte además le pone inercia, que es lo que hace que
 * las cartas se sientan colgadas en agua y no pegadas al mouse.
 */
export function usePuntero(activo = true): Puntero {
  const crudoX = useMotionValue(0);
  const crudoY = useMotionValue(0);

  const x = useSpring(crudoX, { stiffness: 42, damping: 18, mass: 1.1 });
  const y = useSpring(crudoY, { stiffness: 42, damping: 18, mass: 1.1 });

  useEffect(() => {
    if (!activo) return;

    const mover = (e: PointerEvent) => {
      crudoX.set((e.clientX / window.innerWidth) * 2 - 1);
      crudoY.set((e.clientY / window.innerHeight) * 2 - 1);
    };

    window.addEventListener("pointermove", mover, { passive: true });
    return () => window.removeEventListener("pointermove", mover);
  }, [activo, crudoX, crudoY]);

  return { x, y };
}
