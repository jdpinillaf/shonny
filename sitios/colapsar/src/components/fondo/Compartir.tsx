"use client";

import { useRef, useState } from "react";
import { evento } from "@/lib/analitica";

/**
 * El botón que manda la pieza a Instagram.
 *
 * **Todo el diseño de esto gira alrededor de una regla de Safari**: en iOS,
 * `navigator.share()` tiene que llamarse dentro del gesto que lo disparó. Un
 * `await fetch(...)` antes lo caduca y Safari tira `NotAllowedError`: la hoja no
 * abre y la persona no entiende por qué. Y aquí hay que traerse 300 KB antes de
 * poder compartir nada.
 *
 * De ahí las tres capas:
 *
 * 1. La descarga arranca en `pointerdown`, no en el `click`. Son 100-300 ms de
 *    ventaja gratis, con el dedo todavía apoyado.
 * 2. El `click` comparte con lo que haya llegado. Si el archivo ya está, la
 *    llamada sale dentro del gesto y todo va bien.
 * 3. Si aun así Safari lo rechaza, el botón se convierte en «guardar imagen».
 *    Nadie se queda sin salida.
 */

type Estado = "listo" | "pidiendo" | "guardar" | "error";

const ROTULO: Record<Estado, string> = {
  listo: "Compartir",
  pidiendo: "Preparando…",
  guardar: "Guardar imagen",
  error: "No se pudo",
};

export function Compartir({ id, color }: { id: string; color: string }) {
  const [estado, setEstado] = useState<Estado>("listo");
  const pedido = useRef<Promise<File> | null>(null);

  const pedir = () => {
    pedido.current ??= fetch(`/api/story/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.blob();
      })
      .then((b) => new File([b], `colapsar-${id.slice(0, 8)}.jpg`, { type: "image/jpeg" }));

    // Marcar la promesa como atendida. Sin esto, un `pointerdown` que falla y al
    // que nadie llega a hacerle `await` sale por consola como rechazo sin
    // capturar. El error de verdad lo sigue viendo quien la espera abajo.
    void pedido.current.catch(() => {});
    return pedido.current;
  };

  const descargar = (archivo: File) => {
    const url = URL.createObjectURL(archivo);
    const a = document.createElement("a");
    a.href = url;
    a.download = archivo.name;
    a.click();
    URL.revokeObjectURL(url);
    evento("story descargada", { pieza: id });
  };

  const alPulsar = async () => {
    if (estado === "pidiendo") return;

    let archivo: File;
    try {
      if (estado !== "guardar") {
        evento("story pedida", { pieza: id });
        setEstado("pidiendo");
      }
      archivo = await pedir();
    } catch {
      // Se suelta el intento fallido: el siguiente toque vuelve a pedirla.
      pedido.current = null;
      setEstado("error");
      return;
    }

    // `canShare` con los archivos dentro, no `share` a secas. Safari de
    // escritorio tiene `share` pero no acepta archivos: mirar solo `share`
    // manda a media escritorio a una hoja que falla.
    const puede = navigator.canShare?.({ files: [archivo] }) ?? false;
    if (!puede || estado === "guardar") {
      descargar(archivo);
      setEstado("listo");
      return;
    }

    try {
      await navigator.share({ files: [archivo] });
      evento("story compartida", { pieza: id });
      setEstado("listo");
    } catch (e) {
      // `AbortError` es que se echó atrás en la hoja. No es un fallo y no puede
      // pintarse como tal: es la mitad de la gente que abre el compartir.
      if ((e as Error)?.name === "AbortError") {
        setEstado("listo");
        return;
      }
      setEstado("guardar");
    }
  };

  return (
    <button
      type="button"
      onPointerDown={() => {
        if (estado === "listo") pedir();
      }}
      onClick={alPulsar}
      aria-label="Compartir esta pieza"
      className="shrink-0 cursor-pointer border-b pb-px font-mono text-[8.5px] tracking-[0.28em] uppercase transition-opacity hover:opacity-60"
      style={{ color, borderColor: color }}
    >
      {ROTULO[estado]}
    </button>
  );
}
