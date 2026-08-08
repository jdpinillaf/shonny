"use client";

/** Lado máximo del lado largo. Por encima de esto no se gana nada en pantalla. */
export const MAX_LADO = 1600;

/** Holgura cómoda por debajo del tope de payload de una función. */
export const MAX_BYTES = 3_000_000;

export type FotoLista = { blob: Blob; w: number; h: number };

/**
 * Reencoda la foto en el navegador antes de subirla.
 *
 * No es una optimización, son tres cosas que hacen falta:
 *
 * 1. **Quita el EXIF.** Ahí va la geolocalización de la foto. Alguien sube la
 *    terraza de su casa y sin esto sube también sus coordenadas.
 * 2. **Hace que el tipo declarado y el real coincidan.** Lo que sale de un
 *    canvas es un JPEG de verdad, no un archivo que dice serlo.
 * 3. **Acota el peso**, que es lo que mantiene la subida por debajo del tope de
 *    payload de la función.
 *
 * El servidor lo vuelve a comprobar todo igual: esto corre en el navegador de
 * quien sube y por tanto no es de fiar. Es la ruta feliz, no la defensa.
 */
export async function comprimir(archivo: File): Promise<FotoLista> {
  // `createImageBitmap` decodifica fuera del hilo principal y ya aplica la
  // orientación del EXIF, así que la foto de un móvil no llega tumbada.
  const bitmap = await createImageBitmap(archivo, { imageOrientation: "from-image" });

  const escala = Math.min(1, MAX_LADO / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * escala);
  const h = Math.round(bitmap.height * escala);

  const lienzo = document.createElement("canvas");
  lienzo.width = w;
  lienzo.height = h;
  const pincel = lienzo.getContext("2d");
  if (!pincel) throw new Error("sin canvas 2d");
  pincel.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  // Se baja la calidad solo si hace falta. Empezar en 0.85 y no tocarlo casi
  // nunca es mejor que reencodar tres veces por costumbre.
  for (const calidad of [0.85, 0.7, 0.55]) {
    const blob = await new Promise<Blob | null>((listo) =>
      lienzo.toBlob(listo, "image/jpeg", calidad),
    );
    if (!blob) throw new Error("el canvas no dio blob");
    if (blob.size <= MAX_BYTES) return { blob, w, h };
  }
  throw new Error("la foto no baja del tope ni al mínimo de calidad");
}
