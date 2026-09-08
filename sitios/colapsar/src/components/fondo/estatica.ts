/**
 * Ruido de televisor.
 *
 * Se generan unos pocos cuadros una sola vez y se reciclan. Pintar ruido en un
 * canvas por marco y por frame es caro y en pantallas grandes se nota; con seis
 * cuadros alternándose rápido el ojo ya lee "estática" y el costo es cero.
 */

let cuadros: string[] | null = null;

export function cuadrosDeEstatica(): string[] {
  if (cuadros) return cuadros;
  if (typeof document === "undefined") return [];

  const lado = 110;
  const generados: string[] = [];

  for (let c = 0; c < 6; c++) {
    const canvas = document.createElement("canvas");
    canvas.width = lado;
    canvas.height = lado;
    const ctx = canvas.getContext("2d");
    if (!ctx) return [];

    const img = ctx.createImageData(lado, lado);
    for (let i = 0; i < img.data.length; i += 4) {
      // Ruido en gris. El sesgo hacia oscuro deja que el blanco lea como chispa.
      const v = Math.random() < 0.5 ? Math.random() * 90 : 120 + Math.random() * 135;
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    generados.push(canvas.toDataURL("image/png"));
  }

  cuadros = generados;
  return cuadros;
}
