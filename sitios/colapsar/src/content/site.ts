/**
 * Todo lo que cambia sin tocar componentes vive acá.
 */

/**
 * Lo que dura el adelanto. Estuvo escrito a mano en tres sitios sin relación —el
 * nombre del archivo, la barra de la card y su etiqueta— y a la primera que se
 * cambió el corte, los tres dejaron de decir lo mismo. Ahora sale de acá.
 */
const ADELANTO = 40;

/** 40 → "0:40". Local por lo mismo que `conMiles` en `Pregunta`: formato, no dato. */
function reloj(segundos: number) {
  return `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, "0")}`;
}

export const site = {
  artista: "Shonny",
  cancion: "Colapsar",

  // La placa de arriba y la pregunta que se teclea.
  placa: "Museo de lo que nunca pasó",
  pregunta: "Deja tu confesión",
  marcador: "escríbelo aquí…",

  // El recuento que va bajo la placa: "24 cosas que nunca pasaron". El número no
  // se escribe acá porque no es copy: es lo que hay de verdad en `notas.ts` más
  // lo que haya escrito la persona, y el mural enseña exactamente eso.
  recuento: "cosas que nunca pasaron",

  // Lo que se teclea al responder.
  invitacion: "Ven, acompáñame a colapsar.",

  // Pre-save. Cambiar cuando exista la campaña (Feature.fm / Presave.io / Linkfire).
  presave: {
    spotify: "#",
    apple: "#",
  },

  portada: "/portada.jpg",

  // 40s del master (0:48 → 1:28), en loop. Suena desde el primer gesto de la
  // visita. Si el archivo no está, el control de sonido no se muestra.
  // Recortado con: ffmpeg -ss 48 -t 40 -i Colapsar_MASTER_03.wav \
  //   -ar 44100 -ac 2 -codec:a libmp3lame -b:a 160k public/audio/colapsar-40s.mp3
  audio: `/audio/colapsar-${ADELANTO}s.mp3`,
  adelanto: { segundos: ADELANTO, reloj: reloj(ADELANTO) },

  // Las ocho salieron del mismo export, así que miden todas igual. El tamaño se
  // apunta porque una pieza necesita su aspect-ratio para volar sin deformarse,
  // y leerlo del archivo pediría tocar el disco en el servidor.
  fotosTamano: { w: 933, h: 1400 },

  fotos: [
    "/fotos/01.jpg",
    "/fotos/02.jpg",
    "/fotos/03.jpg",
    "/fotos/04.jpg",
    "/fotos/05.jpg",
    "/fotos/06.jpg",
    "/fotos/07.jpg",
    "/fotos/08.jpg",
  ],

  maxRespuesta: 140,
} as const;
