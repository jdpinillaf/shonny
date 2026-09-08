import "server-only";
import { readFile } from "node:fs/promises";

/**
 * La fuente con la que se dibuja la story.
 *
 * Va en TTF dentro del repo y no por `next/font`, por dos motivos que no se
 * pueden esquivar: `next/font` no expone los bytes a `ImageResponse`, y Satori
 * **no lee woff2**, que es justo lo que sirve Google Fonts por defecto.
 *
 * La ruta se resuelve con `import.meta.url` y no con `process.cwd()` para que el
 * trazado de archivos de Next se lleve el .ttf al bundle de la función. Con
 * `cwd()` funciona en local y revienta en producción, que es la peor forma de
 * que falle.
 */
let cache: ArrayBuffer | null = null;

export async function courierPrime(): Promise<ArrayBuffer> {
  if (cache) return cache;
  const b = await readFile(new URL("./fuentes/CourierPrime-Regular.ttf", import.meta.url));
  cache = b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
  return cache;
}
