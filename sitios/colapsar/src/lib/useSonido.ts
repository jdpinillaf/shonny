"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { site } from "@/content/site";

/** Cualquiera de estos cuenta como gesto de usuario para el navegador. */
const GESTOS = ["pointerdown", "keydown", "touchstart", "wheel"] as const;

/**
 * Los 15 segundos, en loop, sonando lo antes que el navegador deje.
 *
 * Chrome y Safari bloquean el audio con sonido hasta que la persona haga algún
 * gesto en la página; no hay forma de saltarse eso y un autoplay a secas falla
 * en silencio. Así que se intenta arrancar al montar y, si lo rechazan, queda
 * armado el primer toque —click, tecla, dedo o rueda, en cualquier parte— para
 * encenderlo. En la práctica suena antes de que lleguen a escribir nada.
 *
 * Si el mp3 no está, `hay` queda en false y el control no se dibuja: mejor nada
 * que un botón que no hace ruido.
 */
export function useSonido() {
  const [hay, setHay] = useState(false);
  const [sonando, setSonando] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let vivo = true;
    fetch(site.audio, { method: "HEAD" })
      .then((r) => vivo && setHay(r.ok))
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, []);

  const encender = useCallback(() => {
    const el = audio.current;
    if (!el || !el.paused) return;
    el.volume = 0.7;
    el.play().then(
      () => setSonando(true),
      // Puede negarse igual. No vale la pena interrumpir nada: el botón de la
      // esquina sigue ahí para prenderlo a mano.
      () => setSonando(false),
    );
  }, []);

  useEffect(() => {
    if (!hay) return;
    const el = audio.current;
    if (!el) return;

    let vivo = true;

    const alGesto = () => {
      soltar();
      encender();
    };
    const soltar = () => {
      for (const g of GESTOS) document.removeEventListener(g, alGesto);
    };

    el.volume = 0.7;
    el.play().then(
      () => {
        if (vivo) setSonando(true);
      },
      () => {
        // Bloqueado: esperamos al primer gesto, sea cual sea.
        if (vivo) for (const g of GESTOS) document.addEventListener(g, alGesto);
      },
    );

    return () => {
      vivo = false;
      soltar();
    };
  }, [hay, encender]);

  const alternar = useCallback(() => {
    const el = audio.current;
    if (!el) return;
    if (el.paused) {
      encender();
    } else {
      el.pause();
      setSonando(false);
    }
  }, [encender]);

  return { hay, sonando, audio, encender, alternar };
}
