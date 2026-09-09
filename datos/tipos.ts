/**
 * La forma del contenido del sitio.
 *
 * Estos tipos son el contrato entre tres fuentes que dicen lo mismo de maneras
 * distintas: los archivos de este paquete, el CMS de Wix y la API de Spotify.
 * Quien consume el contenido no debería poder notar de dónde salió.
 */

/** Lo que se destaca arriba de todo. Es lo que ella cambia en cada lanzamiento. */
export type Anuncio = {
  /** Se apaga sin borrar nada: un interruptor, no un `delete`. */
  activo: boolean;
  titulo: string;
  /** ISO. Si es futura, el sitio muestra cuenta regresiva y pre-save. */
  fecha: string;
  tipo: "single" | "álbum" | "video" | "show";
  frase: string;
  portada: string;
  /** El track de Spotify, para el reproductor. Sin esto no hay player. */
  spotifyTrackId?: string;
  /** A dónde va el botón principal si todavía no salió. */
  presave?: string;
  /** Un segundo enlace, opcional: la sala del single, el video, lo que sea. */
  extra?: { texto: string; url: string };
};

export type Cancion = {
  titulo: string;
  anio?: number;
  url: string;
  portada?: string;
  /** `true` solo para la que está sonando ahora. */
  nueva?: boolean;
};

export type Evento = {
  slug: string;
  titulo: string;
  /** ISO con zona. */
  inicio: string;
  lugar: string;
  ciudad: string;
  url?: string;
};

export type Prenda = {
  nombre: string;
  precio: string;
  antes?: string;
  foto: string;
  url: string;
};

export type Lamina = { foto: string; pie: string };

export type Contenido = {
  artista: {
    nombre: string;
    rotulo: string;
    lema: string;
    retratos: string[];
  };
  anuncio: Anuncio;
  canciones: Cancion[];
  universo: Lamina[];
  tienda: Prenda[];
  eventos: Evento[];
  paraiso: { titulo: string; texto: string; url: string };
  enlaces: { plataformas: [string, string][]; redes: [string, string][] };
  /** El universo sensorial del ADN, el que corre en la cinta. */
  sensorial: string[];
};
