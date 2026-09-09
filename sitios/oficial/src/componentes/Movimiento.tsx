"use client";

import { useEffect } from "react";

/**
 * Todo el movimiento que no es CSS, en una sola isla de cliente.
 *
 * No pinta nada: trabaja sobre los elementos que ya vinieron del servidor. Así
 * el sitio entero sigue siendo HTML servido —se lee sin JavaScript, se indexa y
 * se imprime— y el JavaScript solo agrega comportamiento encima.
 *
 * Son tres cosas y ninguna necesita librería.
 */
export function Movimiento() {
  useEffect(() => {
    const suave = matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ── 1. Las secciones aparecen al entrar en pantalla ────────────────────
    //
    // `once` de verdad: se deja de observar al primer cruce, porque una sección
    // que se esconde y reaparece cada vez que subís y bajás marea.
    const secciones = document.querySelectorAll<HTMLElement>("main section, footer");
    for (const s of secciones) {
      s.classList.add("revela");
      [...s.children].forEach((h, i) => (h as HTMLElement).style.setProperty("--i", String(i)));
    }

    const ojo = new IntersectionObserver(
      (entradas, obs) => {
        for (const e of entradas) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("visto");
          obs.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    for (const s of secciones) ojo.observe(s);

    // ── 2. El menú se esconde al bajar y vuelve al subir ───────────────────
    //
    // Antes era translúcido y el título de la sección se leía por debajo, hecho
    // papilla. Una barra opaca lo arreglaba pero le clavaba a la página una
    // franja que no pega con nada. Esconderlo resuelve las dos cosas y de paso
    // es movimiento: la página responde a lo que hacés con el dedo.
    const cabecera = document.querySelector<HTMLElement>("header");
    let ultimo = 0;
    function alScrollear() {
      if (!cabecera) return;
      const y = scrollY;
      cabecera.classList.toggle("arriba", y < 40);
      // El umbral de 6px evita que el rebote del trackpad lo haga parpadear.
      if (Math.abs(y - ultimo) > 6) {
        cabecera.classList.toggle("oculta", y > ultimo && y > 220);
        ultimo = y;
      }
    }
    addEventListener("scroll", alScrollear, { passive: true });

    // ── 3. Parallax en las imágenes del universo ───────────────────────────
    //
    // Dentro de un rAF: leer `getBoundingClientRect` en cada evento de scroll
    // fuerza a recalcular el layout sesenta veces por segundo y la página se
    // siente pegajosa justo al scrollear, que es cuando peor cae.
    const flotan = document.querySelectorAll<HTMLImageElement>(".universo img");
    let pendiente = false;
    function mover() {
      for (const img of flotan) {
        const marco = img.parentElement;
        if (!marco) continue;
        const r = marco.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) continue;
        const avance = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
        img.style.transform = `scale(1.12) translate3d(0, ${(-avance * 22).toFixed(2)}px, 0)`;
      }
      pendiente = false;
    }
    function pedirMover() {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(mover);
    }
    if (!suave) {
      addEventListener("scroll", pedirMover, { passive: true });
      mover();
    }

    return () => {
      ojo.disconnect();
      removeEventListener("scroll", alScrollear);
      removeEventListener("scroll", pedirMover);
    };
  }, []);

  return null;
}
