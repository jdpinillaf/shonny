/**
 * Las piezas de la colección. Escritas para el boceto —
 * en producción estas serían las respuestas reales de la gente.
 *
 * Registro: primera persona, concreta, seca. Un hecho, no un poema.
 *
 * Español caribeño, con tuteo. Nada de voseo ni de España: el objeto que
 * aparece en cada frase tiene que ser de acá — el tinto, la boleta, el
 * matrimonio, la tienda de la esquina. Eso es lo que hace que se sientan
 * escritas por alguien y no traducidas.
 */

/**
 * El `id` va escrito y no sale de la posición en la lista.
 *
 * Era `notas.map((texto, i) => "s" + (i + 1))`, y con eso borrar una nota del
 * medio le corría el id a todas las de abajo. Como el id es la semilla de todo
 * lo que "parece azar" en la pared —la inclinación, el vaivén, el sitio en la
 * baraja—, quitar una frase rebarajaba media pared de gente que no había tocado
 * nada. Escritos a mano, cada nota conserva su sitio aunque se borre la de
 * arriba o se le corrija una tilde.
 *
 * **Un id no se reutiliza.** Si se borra `s12`, el siguiente que se añada es
 * `s17`, no `s12`: el hueco vacío no molesta a nadie y reciclarlo le daría a una
 * frase nueva el sitio y la inclinación de una que ya no está.
 *
 * `fija` es la otra mitad: esas notas salen **siempre**, no importa cuántas deje
 * la gente ni cómo caiga la baraja. Ver `tajadas` en `coleccion.ts`.
 */
export type Nota = {
  id: string;
  texto: string;
  /** Sale siempre en la pared, en escritorio y en móvil. */
  fija?: boolean;
};

export const notas: readonly Nota[] = [
  { id: "s01", texto: "Te guardé el lado izquierdo de la cama tres años." },
  { id: "s02", texto: "Aprendí a hacerte el tinto. Nunca viniste a desayunar." },
  { id: "s03", texto: "Compré dos tiquetes. Viajé sola." },
  { id: "s04", texto: "Dijiste “algún día” y yo escuché una fecha." },
  { id: "s05", texto: "Sigues en mis contactos de emergencia.", fija: true },
  { id: "s06", texto: "Guardé el vestido para un matrimonio que no hubo.", fija: true },
  { id: "s07", texto: "Te presenté a mi mamá en mi cabeza." },
  { id: "s08", texto: "Escribí el mensaje. Lo borré. Doce veces.", fija: true },
  { id: "s09", texto: "Aprendí a bailar para no pisarte." },
  { id: "s10", texto: "Aparté el sábado entero por si volvías." },
  { id: "s11", texto: "Todavía me muevo despacio creyendo que te voy a despertar.", fija: true },
  // s12 —"Dejé la puerta sin seguro un año."— se retiró. El id no se reutiliza.
  { id: "s13", texto: "Nos imaginé viejitos y con perro." },
  { id: "s14", texto: "Practiqué decir tu apellido junto al mío.", fija: true },
  { id: "s15", texto: "Guardé la boleta de un cine al que no fuimos." },
  // s16 —"Sé exactamente cómo te habrías reído."— se retiró.
] as const;
