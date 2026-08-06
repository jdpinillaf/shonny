import { site } from "@/content/site";
import { entre, indice } from "@/lib/semilla";

const LADO = 2048;
const PIEZAS = 24;

function cargar(src: string): Promise<HTMLImageElement> {
  return new Promise((ok, mal) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = mal;
    img.src = src;
  });
}

/**
 * Recorta la foto con los bordes difuminados.
 *
 * Dibujada derecha, cada pieza deja un rectángulo con esquinas duras y el
 * fondo se lee como un collage con filtro azul encima. Con los bordes
 * desvanecidos las piezas se funden entre sí y recién ahí parece algo hundido.
 */
function piezaDifuminada(foto: HTMLImageElement, ancho: number, alto: number) {
  const c = document.createElement("canvas");
  c.width = Math.max(2, Math.round(ancho));
  c.height = Math.max(2, Math.round(alto));
  const ctx = c.getContext("2d");
  if (!ctx) return null;

  ctx.drawImage(foto, 0, 0, c.width, c.height);

  ctx.globalCompositeOperation = "destination-in";
  const mascara = ctx.createRadialGradient(
    c.width / 2,
    c.height / 2,
    Math.min(c.width, c.height) * 0.12,
    c.width / 2,
    c.height / 2,
    Math.max(c.width, c.height) * 0.58,
  );
  mascara.addColorStop(0, "rgba(0,0,0,1)");
  mascara.addColorStop(0.55, "rgba(0,0,0,0.85)");
  mascara.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = mascara;
  ctx.fillRect(0, 0, c.width, c.height);

  return c;
}

/**
 * El fondo del río: las fotos tiradas en el lecho, en gris, superpuestas.
 *
 * Se arma una sola vez y se sube a la GPU como textura. La tentación es
 * redibujarla por frame para que el collage se mueva, pero eso son varios
 * megabytes de subida sesenta veces por segundo; el movimiento sale gratis
 * paneando las UV en el shader.
 *
 * Cuadrada a propósito: el shader corrige la relación de aspecto, y una textura
 * cuadrada se comporta igual en horizontal que en vertical.
 */
export async function construirLecho(): Promise<HTMLCanvasElement | null> {
  const lienzo = document.createElement("canvas");
  lienzo.width = LADO;
  lienzo.height = LADO;
  const ctx = lienzo.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#05090e";
  ctx.fillRect(0, 0, LADO, LADO);

  let fotos: HTMLImageElement[];
  try {
    fotos = await Promise.all(site.fotos.map(cargar));
  } catch {
    return lienzo; // sin fotos el río igual corre, solo queda oscuro
  }

  // Oscuro a propósito: esto vive al fondo del río, debajo de la pregunta y de
  // las notas. Si se lee cómodo, compite con ellas y deja de ser un fondo.
  ctx.filter = "grayscale(1) contrast(1.12) brightness(0.52)";

  for (let i = 0; i < PIEZAS; i++) {
    const semilla = `lecho-${i}`;
    const foto = fotos[indice(semilla, fotos.length)];

    const ancho = entre(semilla, LADO * 0.16, LADO * 0.32, 1);
    const alto = (ancho * foto.naturalHeight) / foto.naturalWidth;
    const pieza = piezaDifuminada(foto, ancho, alto);
    if (!pieza) continue;

    ctx.save();
    ctx.globalAlpha = entre(semilla, 0.3, 0.72, 5);
    ctx.translate(entre(semilla, -LADO * 0.05, LADO * 1.02, 2), entre(semilla, -LADO * 0.05, LADO * 1.02, 3));
    ctx.rotate(entre(semilla, -0.7, 0.7, 4));
    ctx.drawImage(pieza, -ancho / 2, -alto / 2);
    ctx.restore();
  }

  ctx.filter = "none";

  // Los bordes se hunden: el shader paña las UV y sin esto se ven las costuras.
  const borde = ctx.createRadialGradient(
    LADO / 2,
    LADO / 2,
    LADO * 0.22,
    LADO / 2,
    LADO / 2,
    LADO * 0.72,
  );
  borde.addColorStop(0, "rgba(5,9,14,0)");
  borde.addColorStop(1, "rgba(5,9,14,0.92)");
  ctx.fillStyle = borde;
  ctx.fillRect(0, 0, LADO, LADO);

  return lienzo;
}
