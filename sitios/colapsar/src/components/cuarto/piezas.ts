import { notas } from "@/content/notas";
import { site } from "@/content/site";
import { azar } from "@/lib/semilla";

/**
 * La pared del cuarto oscuro: todo pegado, sin huecos, salvo uno.
 *
 * Es una grilla con posición explícita por pieza — nada de auto-placement. El
 * hueco del centro se reserva simplemente no poniendo nada en esas celdas, y
 * ahí van la pregunta, el papel y después la card.
 *
 * ⚠️ La tabla y el hueco están acoplados, igual que `MARCOS` y `RANURAS` en la
 * landing #1. Las piezas están calzadas a mano para cubrir exactamente las
 * celdas que el hueco deja libres: si se mueve el hueco, hay que reabrir la
 * tabla. Al agregar una pieza, verificar que no pise una celda ya ocupada —
 * dos piezas en la misma celda se superponen sin avisar.
 */

export const ANCHA = { cols: 16, filas: 9, hueco: { c1: 5, c2: 12, f1: 3, f2: 7 } };
export const ESTRECHA = { cols: 6, filas: 13, hueco: { c1: 1, c2: 6, f1: 4, f2: 10 } };

export type Tipo = "foto" | "nota" | "tira";

type Cruda = {
  id: string;
  col: number;
  fila: number;
  cw: number;
  ch: number;
  tipo: Tipo;
  /** La celda donde aterriza lo que escribe la persona. Una sola por tabla. */
  buzon?: true;
};

/** 16 × 9. Franja de arriba (filas 1-2), costados (cols 1-4 y 13-16), pie (filas 8-9). */
const CRUDAS_ANCHA: Cruda[] = [
  // arriba
  { id: "a01", col: 1, fila: 1, cw: 2, ch: 2, tipo: "foto" },
  { id: "a02", col: 3, fila: 1, cw: 3, ch: 1, tipo: "tira" },
  { id: "a03", col: 3, fila: 2, cw: 2, ch: 1, tipo: "nota" },
  { id: "a04", col: 5, fila: 2, cw: 3, ch: 1, tipo: "nota" },
  { id: "a05", col: 6, fila: 1, cw: 2, ch: 1, tipo: "foto" },
  { id: "a06", col: 8, fila: 1, cw: 3, ch: 1, tipo: "nota", buzon: true },
  { id: "a07", col: 8, fila: 2, cw: 2, ch: 1, tipo: "tira" },
  { id: "a08", col: 10, fila: 2, cw: 3, ch: 1, tipo: "tira" },
  { id: "a09", col: 11, fila: 1, cw: 2, ch: 1, tipo: "foto" },
  { id: "a10", col: 13, fila: 1, cw: 4, ch: 1, tipo: "nota" },
  { id: "a11", col: 13, fila: 2, cw: 2, ch: 1, tipo: "tira" },
  { id: "a12", col: 15, fila: 2, cw: 2, ch: 1, tipo: "tira" },
  // costado izquierdo
  { id: "a13", col: 1, fila: 3, cw: 2, ch: 2, tipo: "foto" },
  { id: "a14", col: 3, fila: 3, cw: 2, ch: 3, tipo: "nota" },
  { id: "a15", col: 1, fila: 5, cw: 2, ch: 3, tipo: "foto" },
  { id: "a16", col: 3, fila: 6, cw: 2, ch: 2, tipo: "foto" },
  { id: "a17", col: 1, fila: 8, cw: 2, ch: 2, tipo: "nota" },
  { id: "a18", col: 3, fila: 8, cw: 2, ch: 2, tipo: "foto" },
  // costado derecho
  { id: "a19", col: 13, fila: 3, cw: 2, ch: 3, tipo: "foto" },
  { id: "a20", col: 15, fila: 3, cw: 2, ch: 2, tipo: "nota" },
  { id: "a21", col: 15, fila: 5, cw: 2, ch: 2, tipo: "foto" },
  { id: "a22", col: 13, fila: 6, cw: 2, ch: 2, tipo: "nota" },
  { id: "a23", col: 15, fila: 7, cw: 2, ch: 3, tipo: "foto" },
  { id: "a24", col: 13, fila: 8, cw: 2, ch: 2, tipo: "nota" },
  // pie
  { id: "a25", col: 5, fila: 8, cw: 4, ch: 1, tipo: "tira" },
  { id: "a26", col: 9, fila: 8, cw: 4, ch: 1, tipo: "nota" },
  { id: "a27", col: 5, fila: 9, cw: 3, ch: 1, tipo: "foto" },
  { id: "a28", col: 8, fila: 9, cw: 2, ch: 1, tipo: "nota" },
  { id: "a29", col: 10, fila: 9, cw: 3, ch: 1, tipo: "foto" },
];

/** 6 × 13. Solo quedan la franja de arriba (1-3) y la de abajo (11-13). */
const CRUDAS_ESTRECHA: Cruda[] = [
  { id: "e01", col: 1, fila: 1, cw: 3, ch: 2, tipo: "foto" },
  { id: "e02", col: 4, fila: 1, cw: 3, ch: 1, tipo: "tira" },
  { id: "e03", col: 4, fila: 2, cw: 3, ch: 1, tipo: "nota", buzon: true },
  { id: "e04", col: 1, fila: 3, cw: 2, ch: 1, tipo: "nota" },
  { id: "e05", col: 3, fila: 3, cw: 2, ch: 1, tipo: "foto" },
  { id: "e06", col: 5, fila: 3, cw: 2, ch: 1, tipo: "tira" },
  { id: "e07", col: 1, fila: 11, cw: 3, ch: 2, tipo: "foto" },
  { id: "e08", col: 4, fila: 11, cw: 3, ch: 1, tipo: "nota" },
  { id: "e09", col: 4, fila: 12, cw: 3, ch: 1, tipo: "tira" },
  { id: "e10", col: 1, fila: 13, cw: 2, ch: 1, tipo: "nota" },
  { id: "e11", col: 3, fila: 13, cw: 2, ch: 1, tipo: "foto" },
  { id: "e12", col: 5, fila: 13, cw: 2, ch: 1, tipo: "nota" },
];

export type Pieza = Cruda & {
  /** Segundos de espera antes de revelarse. Sale de la distancia al hueco. */
  retardo: number;
  /** Índice en `site.fotos`. Solo en `foto` y `tira`. */
  foto: number;
  /** Solo en `nota`. */
  texto: string;
  /** Marco blanco de instantánea en vez de foto sangrada. Solo en `foto`. */
  instantanea: boolean;
  /** Da al hueco. Se pega más torcida y se pasa de su celda para romper el borde. */
  borde: boolean;
  /** Encuadre propio: hace que la misma foto repetida se lea distinta. */
  encuadre: string;
};

/** Cuánto tarda la ola en llegar del hueco al borde. */
const OLA = 1.4;

/** Lo que espera la pared antes de empezar a revelarse: la roja está prendiendo. */
const ARRANQUE = 0.9;

function armar(crudas: Cruda[], rejilla: typeof ANCHA): Pieza[] {
  // Reparto sin repetir de más: se barajan los ids y se van dando fotos y notas
  // por turno. Con Math.random cambiarían entre el HTML del servidor y el del
  // cliente, y la pared se rearmaría sola en la hidratación.
  const dePapel = crudas
    .filter((c) => c.tipo === "nota")
    .map((c) => c.id)
    .sort((x, y) => azar(`nota-${x}`) - azar(`nota-${y}`));

  const deLuz = crudas
    .filter((c) => c.tipo !== "nota")
    .map((c) => c.id)
    .sort((x, y) => azar(`foto-${x}`) - azar(`foto-${y}`));

  const texto = new Map(dePapel.map((id, i) => [id, notas[i % notas.length]]));
  const foto = new Map(deLuz.map((id, i) => [id, i % site.fotos.length]));

  // El centro del hueco, en coordenadas normalizadas de la rejilla. La ola sale
  // de ahí hacia afuera: se revela primero lo que rodea a la pregunta.
  const cx = (rejilla.hueco.c1 - 1 + (rejilla.hueco.c2 - rejilla.hueco.c1 + 1) / 2) / rejilla.cols;
  const cy = (rejilla.hueco.f1 - 1 + (rejilla.hueco.f2 - rejilla.hueco.f1 + 1) / 2) / rejilla.filas;

  const distancias = new Map(
    crudas.map((c) => [
      c.id,
      Math.hypot(
        (c.col - 1 + c.cw / 2) / rejilla.cols - cx,
        (c.fila - 1 + c.ch / 2) / rejilla.filas - cy,
      ),
    ]),
  );

  // El rango se estira contra las distancias reales, no contra el largo de la
  // rejilla. Como el hueco es grande, ninguna pieza cae cerca de su centro:
  // midiendo en absoluto todos los retardos se apelotonan en el último tercio y
  // la pared se revela casi de golpe.
  const cerca = Math.min(...distancias.values());
  const lejos = Math.max(...distancias.values());
  const rango = lejos - cerca || 1;

  // Las que dan al hueco. La rejilla las corta en línea perfectamente recta y
  // eso delata la maqueta: el centro se lee como un rectángulo recortado con
  // tijera en vez de un pedazo de pared sin pegar. Estas se pegan más torcidas
  // y más grandes para que sus esquinas se metan dentro y el borde quede roto.
  const daAlHueco = (c: Cruda) => {
    const { c1, c2, f1, f2 } = rejilla.hueco;
    const col1 = c.col;
    const col2 = c.col + c.cw - 1;
    const fil1 = c.fila;
    const fil2 = c.fila + c.ch - 1;
    const pisaCols = col1 <= c2 && col2 >= c1;
    const pisaFilas = fil1 <= f2 && fil2 >= f1;
    return (
      (pisaCols && (fil2 === f1 - 1 || fil1 === f2 + 1)) ||
      (pisaFilas && (col2 === c1 - 1 || col1 === c2 + 1))
    );
  };

  return crudas.map((c) => {
    const distancia = distancias.get(c.id) as number;

    return {
      ...c,
      borde: daAlHueco(c),
      retardo: ARRANQUE + ((distancia - cerca) / rango) * OLA,
      foto: foto.get(c.id) ?? 0,
      texto: texto.get(c.id) ?? "",
      // Solo las piezas más altas que anchas llevan marco: una instantánea
      // apaisada no existe, y en una celda ancha el marco se ve estirado.
      instantanea: c.ch > c.cw && azar(c.id, 9) > 0.38,
      encuadre: `${azar(c.id, 11) * 60 + 20}% ${azar(c.id, 12) * 60 + 20}%`,
    };
  });
}

export const PIEZAS_ANCHA = armar(CRUDAS_ANCHA, ANCHA);
export const PIEZAS_ESTRECHA = armar(CRUDAS_ESTRECHA, ESTRECHA);
