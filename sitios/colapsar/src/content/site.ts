/**
 * Todo lo que cambia sin tocar componentes vive acá.
 */

/**
 * Lo que dura el adelanto. Estuvo escrito a mano en tres sitios sin relación —el
 * nombre del archivo, la barra de la card y su etiqueta— y a la primera que se
 * cambió el corte, los tres dejaron de decir lo mismo. Ahora sale de acá.
 */
const ADELANTO = 40;

/** 40 → "0:40". Local por lo mismo que `conMiles` en `Odometro`: formato, no dato. */
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

  // Lo que dice el papelito colgado bajo el recuento. Existe porque el recuento
  // solo no se leía como botón: en una prueba con diez personas no lo apretó
  // ninguna, y es la única puerta al mural. Corto porque el papel es pequeño, y
  // "todas" se apoya en la cifra que tiene justo encima.
  verTodas: "Ver todas",

  // Lo que se teclea al responder.
  invitacion: "Ven, acompáñame a colapsar.",

  // El smart link de Feature.fm que monta Symphonic. Una sola URL para las siete
  // plataformas y no una por servicio: los botones de ffm llevan un `cd` que se
  // acuña en su servidor por visitante —lleva IP, user-agent y la sesión firmada—
  // así que no existe enlace estable a "el pre-save de Spotify". La card es la
  // puerta y ffm reparte.
  //
  // El 4 sep 2026 la misma URL se voltea sola de "pre-save" a "escuchar". No hay
  // que redesplegar nada ese día.
  presave: "https://sym.ffm.to/colapsar",

  // El rótulo que cuelga bajo la card. Existe porque la card se lee como un
  // reproductor —portada, círculo verde, barra que avanza— y nada decía que al
  // pulsarla se guarda. Es el mismo problema del recuento del mural, que en una
  // prueba con diez personas no apretó ninguna hasta que se le colgó una
  // etiqueta debajo diciendo qué era.
  //
  // La fecha va escrita a mano y no calculada: formatearla en cliente y
  // servidor con locales distintos es hidratación rota, y esto cambia una vez.
  // **El 4 de septiembre de 2026 este rótulo deja de tener sentido — pasa a
  // "escúchala" o se quita. El smart link sí se voltea solo.**
  guardar: "guárdala · sale el 4 sep",

  portada: "/portada.jpg",

  // 40s del master (0:49 → 1:29), en loop. Suena desde el primer gesto de la
  // visita. Si el archivo no está, el control de sonido no se muestra.
  //
  // Mono y 96k, no estéreo y 160k: son 480 KB en vez de 800 y es música de
  // fondo a volumen 0.4 bajo grano y scanlines. El `<audio>` va con
  // `preload="none"`, así que esto no se baja hasta que alguien toque algo.
  // Recortado con: ffmpeg -ss 49 -t 40 -i Colapsar_MASTER_03.wav \
  //   -ar 44100 -ac 1 -codec:a libmp3lame -b:a 96k public/audio/colapsar-40s.mp3
  audio: `/audio/colapsar-${ADELANTO}s.mp3`,
  adelanto: { segundos: ADELANTO, reloj: reloj(ADELANTO) },

  // Las ocho salieron del mismo export, así que miden todas igual. El tamaño se
  // apunta porque una pieza necesita su aspect-ratio para volar sin deformarse,
  // y leerlo del archivo pediría tocar el disco en el servidor. **Si se vuelven
  // a procesar las fotos, este número cambia con ellas.**
  fotosTamano: { w: 780, h: 1170 },

  // El sufijo `-bn` es el gris cocido en el archivo, y es también el que rompe
  // la caché: `images.minimumCacheTTL` está en un año, así que reusar el nombre
  // dejaría la versión vieja pegada. Reprocesadas del original de 933x1400 a
  // color con sharp: .grayscale().resize({width:780}).jpeg({quality:82,mozjpeg:true}).
  // De 1.0 MB a 304 KB, y el optimizador deja de decodificar a color en cada miss.
  fotos: [
    "/fotos/01-bn.jpg",
    "/fotos/02-bn.jpg",
    "/fotos/03-bn.jpg",
    "/fotos/04-bn.jpg",
    "/fotos/05-bn.jpg",
    "/fotos/06-bn.jpg",
    "/fotos/07-bn.jpg",
    "/fotos/08-bn.jpg",
  ],

  maxRespuesta: 140,
} as const;
