"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Cualquiera de estos cuenta como gesto de usuario para el navegador. */
const GESTOS = ["pointerdown", "keydown", "touchstart", "wheel"] as const;

/** La canción es fondo, no protagonista. */
const VOLUMEN = 0.4;

/**
 * El adelanto, en loop, sonando al primer gesto que haga la persona.
 *
 * Chrome y Safari bloquean el audio con sonido hasta que haya un gesto en la
 * página, así que se deja armado el primer toque —click, tecla, dedo o rueda,
 * en cualquier parte— para encenderlo. En la práctica suena antes de que
 * lleguen a escribir nada.
 *
 * No hay intento de `play()` al montar, y no es un olvido: el `<audio>` va con
 * `preload="none"` para sacar 800 KB del arranque, y un `play()` temprano
 * dispara igual la descarga aunque el navegador rechace el autoplay —lo manda
 * la spec: `play()` con `networkState` vacío arranca la carga del recurso—.
 * O sea, el intento nos costaba el archivo entero y casi nunca lo dejaban
 * sonar: solo funciona con visitas que ya tengan mucho historial en el sitio.
 *
 * Si el mp3 no está, `alFallar` apaga `hay` y el control desaparece. Antes eso
 * se sabía con un `HEAD` al montar; ahora se sabe cuando el navegador intenta
 * bajarlo de verdad, que es lo mismo sin gastar una petición por visita.
 */
export function useSonido() {
  const [hay, setHay] = useState(true);
  const [sonando, setSonando] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);

  const encender = useCallback(() => {
    const el = audio.current;
    if (!el || !el.paused) return;
    el.volume = VOLUMEN;
    el.play().then(
      () => setSonando(true),
      // Puede negarse igual. No vale la pena interrumpir nada: el botón de la
      // esquina sigue ahí para prenderlo a mano.
      () => setSonando(false),
    );
  }, []);

  useEffect(() => {
    if (!hay) return;

    const alGesto = () => {
      soltar();
      encender();
    };
    const soltar = () => {
      for (const g of GESTOS) document.removeEventListener(g, alGesto);
    };

    for (const g of GESTOS) document.addEventListener(g, alGesto);
    return soltar;
  }, [hay, encender]);

  /**
   * Callar sin tocar el botón de la esquina. Lo usa el reproductor de Spotify
   * del acto 3: en cuanto la persona toca ese marco, lo nuestro sobra — dos
   * canciones a la vez no es un fondo, es ruido.
   *
   * No pone `hay` en falso: el control de la esquina sigue ahí para volver a
   * encenderlo si le da la gana.
   */
  const apagar = useCallback(() => {
    const el = audio.current;
    if (!el || el.paused) return;
    el.pause();
    setSonando(false);
  }, []);

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

  /** El archivo no está o no se pudo decodificar: mejor nada que un botón mudo. */
  const alFallar = useCallback(() => {
    setHay(false);
    setSonando(false);
  }, []);

  return { hay, sonando, audio, encender, apagar, alternar, alFallar };
}
