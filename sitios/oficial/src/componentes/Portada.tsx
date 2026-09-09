import type { Contenido } from "@shonny/datos/tipos";

/**
 * La artista primero y el lanzamiento después.
 *
 * Los tres retratos se cruzan cada 24 segundos con retardos distintos, y cada uno
 * deriva mientras está en pantalla. No es un carrusel: no hay flechas ni puntos,
 * es la luz de la página cambiando sola.
 *
 * El nombre grande es el de ella y no el del single. Un home que abre con el
 * título de una canción hay que rehacerlo en cada lanzamiento; acá el
 * lanzamiento entra como una línea que se cambia desde el CMS.
 */
export function Portada({
  artista,
  anuncio,
  paraiso,
}: {
  artista: Contenido["artista"];
  anuncio: Contenido["anuncio"];
  paraiso: Contenido["paraiso"];
}) {
  const escuchar = anuncio.spotifyTrackId
    ? `https://open.spotify.com/track/${anuncio.spotifyTrackId}`
    : (anuncio.presave ?? "#suena");

  return (
    <section className="portada">
      <div>
        <p className="rotulo entra" style={{ ["--retardo" as string]: ".05s" }}>
          {artista.rotulo}
        </p>
        <h1 className="entra" style={{ ["--retardo" as string]: ".12s" }}>
          {artista.nombre}
        </h1>
        <p className="lema entra" style={{ ["--retardo" as string]: ".26s" }}>
          {artista.lema}
        </p>

        {anuncio.activo && (
          <a className="aviso entra" style={{ ["--retardo" as string]: ".36s" }} href={escuchar}>
            <span className="rotulo">Ya está afuera</span>
            <span className="que">{anuncio.titulo}</span>
            <span className="flecha" aria-hidden="true">
              →
            </span>
          </a>
        )}

        <div className="acciones entra" style={{ ["--retardo" as string]: ".44s" }}>
          <a className="boton" href={escuchar}>
            Escuchar en Spotify
          </a>
          <a className="boton boton--linea" href={paraiso.url}>
            Entrar al Paraíso
          </a>
        </div>
      </div>

      {/* El `margin: 0` va en la hoja de estilos y no acá: un estilo en línea le
          gana a cualquier regla, y en móvil este figure necesita margen
          negativo para sangrar hasta los bordes. */}
      <figure className="retrato entra" style={{ ["--retardo" as string]: ".2s" }}>
        {artista.retratos.map((src, i) => (
          // Sin `next/image`: son tres capas superpuestas que animan opacidad y
          // transform, y acá el control del posicionamiento pesa más que la
          // optimización de un archivo que ya viene recortado y comprimido.
          // eslint-disable-next-line @next/next/no-img-element
          <img key={src} src={src} alt={i === 0 ? `${artista.nombre}` : ""} aria-hidden={i > 0} />
        ))}
      </figure>
    </section>
  );
}
