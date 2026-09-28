"use client";

import { useState } from "react";

/**
 * Un enlace de descarga que dice que está trabajando.
 *
 * Es el único componente de cliente del panel, y existe porque el PNG no está
 * hecho de antemano: se dibuja al pedirlo y tarda un par de segundos. Con un
 * `<a download>` a pelo esos segundos no se ven en ningún sitio —sobre todo en
 * el móvil— y parece que el botón no hizo nada. Acá se pide con `fetch`, se
 * enseña «descargando…» mientras llega, y el archivo se entrega con el nombre
 * que manda la ruta.
 */
export function Descargar({ href, children }: { href: string; children: React.ReactNode }) {
  const [estado, setEstado] = useState<"quieto" | "bajando" | "mal">("quieto");

  async function bajar() {
    if (estado === "bajando") return;
    setEstado("bajando");
    try {
      const r = await fetch(href);
      if (!r.ok) throw new Error(String(r.status));

      // El nombre lo pone la ruta en `content-disposition`; se reutiliza para
      // no tener dos sitios que decidan cómo se llama el archivo.
      const nombre =
        r.headers.get("content-disposition")?.match(/filename="([^"]+)"/)?.[1] ?? "colapsar.png";

      const url = URL.createObjectURL(await r.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = nombre;
      a.click();
      // Un respiro antes de soltarlo: Safari empieza la descarga en el
      // siguiente tick y revocar en el mismo la cancela.
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setEstado("quieto");
    } catch {
      setEstado("mal");
    }
  }

  return (
    <button
      type="button"
      onClick={bajar}
      disabled={estado === "bajando"}
      aria-busy={estado === "bajando"}
      className={`cursor-pointer underline underline-offset-4 disabled:cursor-wait disabled:no-underline ${
        estado === "mal" ? "text-terracota" : "text-humo hover:text-tiza"
      } ${estado === "bajando" ? "animate-pulse" : ""}`}
    >
      {estado === "bajando" ? "descargando…" : estado === "mal" ? "falló, otra vez" : children}
    </button>
  );
}
