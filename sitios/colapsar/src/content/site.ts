/**
 * Todo lo que cambia sin tocar componentes vive acá.
 */
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

  // 15s del master (0:50 → 1:05). Suena al enviar la respuesta.
  // Si el archivo no está, el control de sonido no se muestra.
  audio: "/audio/colapsar-15s.mp3",

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
