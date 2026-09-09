/**
 * El contenido del sitio, escrito a mano y versionado.
 *
 * Es la fuente de última instancia. En producción el anuncio y las fechas salen
 * de Notion, y la discografía de Spotify; esto es lo que se sirve cuando esas
 * dos no contestan.
 *
 * **Por eso importa que esté al día aunque parezca redundante:** el día que se
 * caiga Notion, esto es lo que va a ver la gente.
 */

import type { Contenido } from "./tipos";

export const contenido: Contenido = {
  artista: {
    nombre: "Shonny",
    rotulo: "Ave del paraíso",
    lema: "Pop con consciencia desde el Caribe. Canciones escritas desde adentro para que suenen como mantras: lo cotidiano también es sagrado.",
    retratos: ["/fotos/ave-del-paraiso.jpg", "/fotos/estudio-red.jpg", "/fotos/ola-gasa.jpg"],
  },

  anuncio: {
    activo: true,
    titulo: "Colapsar",
    fecha: "2026-09-04",
    tipo: "single",
    frase: "Un corazón roto por algo que nunca pasó.",
    portada: "https://colapsar.shonny.co/portada.jpg",
    spotifyTrackId: "6a2fZAHDcC4MBCceSnMX6I",
    extra: { texto: "Entrar al museo del single", url: "https://colapsar.shonny.co" },
  },

  /**
   * Los años son estimados y están pendientes de confirmar. Cuando entren las
   * credenciales de Spotify esta lista deja de mantenerse a mano: la API sabe
   * las fechas de verdad.
   */
  canciones: [
    { titulo: "Colapsar", anio: 2026, nueva: true, url: "https://open.spotify.com/track/6a2fZAHDcC4MBCceSnMX6I" },
    { titulo: "Paraíso", anio: 2025, url: "https://open.spotify.com/track/4dP3HHnRtpaIZVDdXbxSsv" },
    { titulo: "Pausa", anio: 2026, url: "https://open.spotify.com/track/7cGOuIve6Qj5vrVndpwwYL" },
    { titulo: "Eres la Magia", anio: 2024, url: "https://open.spotify.com/track/2cjzPUveAWD0ZR7ETGLYLZ" },
    { titulo: "Soy El Sol", anio: 2024, url: "https://open.spotify.com/track/7AxHlCBRMwKUnIhrtA5wg8" },
    { titulo: "Mudar la Piel", anio: 2023, url: "https://open.spotify.com/track/10iVVnheiJ0EoioKGMCf5Z" },
  ],

  universo: [
    { foto: "/fotos/estudio-red.jpg", pie: "Retrato · dirección de arte" },
    { foto: "/fotos/vivo-brazo.jpg", pie: "En vivo · el cuerpo como instrumento" },
    { foto: "/fotos/estudio-bota.jpg", pie: "Danza y movimiento" },
  ],

  /**
   * Copia de la tienda de Wix, escrita a mano. La tienda sigue viviendo en Wix
   * —ahí está el stock y el cobro— y esto es solo la vitrina. **El precio que
   * manda es el de Wix**: si no coinciden, el que está mal es este.
   */
  tienda: [
    {
      nombre: "Bandana Renacer",
      precio: "COP 66.000",
      antes: "77.000",
      foto: "/fotos/tienda/bandana-renacer.jpg",
      url: "https://www.shonny.co/product-page/bandana-jugando-con-el-viento",
    },
    {
      nombre: "Bandana Ser",
      precio: "COP 66.000",
      antes: "77.000",
      foto: "/fotos/tienda/bandana-ser.jpg",
      url: "https://www.shonny.co/product-page/bandana-azul-jugando-con-el-viento",
    },
    {
      nombre: "Maxi Renacer",
      precio: "COP 140.000",
      antes: "160.000",
      foto: "/fotos/tienda/maxi-renacer.jpg",
      url: "https://www.shonny.co/product-page/maxi-renacer",
    },
  ],

  /**
   * El respaldo de las fechas. La lista viva sale de la base `Shows` de Notion;
   * esto es lo que se sirve si Notion no contesta.
   *
   * Conviene mantenerlo al día con lo que esté confirmado y cerca: un show que
   * está en Notion y no acá desaparece del sitio el día que se caiga la API, y
   * ese es justo el día en que más gente lo busca.
   */
  eventos: [
    {
      slug: "living-room-sessions-w-bogota",
      titulo: "Living Room Sessions — W Bogotá",
      // Sin hora: todavía no está confirmada, y una hora inventada en un sitio
      // público es peor que ninguna.
      inicio: "2026-09-10",
      lugar: "W Bogotá",
      ciudad: "Bogotá",
    },
    {
      slug: "caribe-funk-tarima-de-lucho",
      titulo: "Concierto de Caribe Funk",
      inicio: "2026-11-06T20:00:00-05:00",
      lugar: "La Tarima de Lucho",
      ciudad: "Barranquilla",
    },
  ],

  paraiso: {
    titulo: "Quiero que estemos más cerca.",
    texto: "Voice notes, demos, errores. Se enteran primero y me ayudan a decidir. Todo lo lindo, pa' mis aves del paraíso.",
    url: "https://infoshonny.systeme.io/elparaiso",
  },

  enlaces: {
    plataformas: [
      ["Spotify", "https://open.spotify.com/artist/70axD2kGUWcyWjZAGAtgft"],
      ["Apple Music", "https://music.apple.com/us/artist/shonny/1677008444"],
      ["Amazon Music", "https://music.amazon.com/artists/B07B4Q6T3W/shonny"],
      ["YouTube", "https://www.youtube.com/@ShonnyLaMusa"],
    ],
    redes: [
      ["Instagram", "https://www.instagram.com/shonny___/"],
      ["TikTok", "https://www.tiktok.com/@shonny_____"],
      ["Threads", "https://www.threads.com/@shonny___"],
      ["Tienda", "https://www.shonny.co/shop"],
    ],
  },

  sensorial: [
    "un atardecer",
    "la bruma de la mañana",
    "fruta recién cortada",
    "seda mojada en la piel",
    "el romper de las olas",
    "voces celestiales",
  ],
};

export type { Contenido, Anuncio, Cancion, Evento, Prenda, Lamina } from "./tipos";
