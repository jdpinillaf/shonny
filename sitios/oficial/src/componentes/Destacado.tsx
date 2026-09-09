import type { Anuncio } from "@shonny/datos/tipos";

/**
 * La franja de lo nuevo: la sección que hay que poder cambiar en cinco minutos
 * cada vez que sale una canción, y la única del sitio donde se puede escuchar
 * sin irse.
 *
 * Si la fecha del anuncio es futura muestra pre-save en vez de reproductor: no
 * tiene sentido ofrecer un player de algo que todavía no existe, y el pre-save
 * es lo único que sirve pedir ese día.
 *
 * `theme=0` en el embed no es un capricho: sin ese parámetro Spotify tiñe la
 * caja con el color dominante de la portada y la franja deja de pertenecer a la
 * página.
 */
export function Destacado({ anuncio, futuro }: { anuncio: Anuncio; futuro: boolean }) {
  if (!anuncio.activo) return null;

  const fecha = new Date(anuncio.fecha).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "America/Bogota",
  });

  return (
    <section id="nuevo" className="destacado">
      <figure className="tapa" style={{ margin: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={anuncio.portada} alt={`Portada de ${anuncio.titulo}`} />
      </figure>

      <div>
        <p className="rotulo">
          {futuro ? "Lo que viene" : "Lo nuevo"} · {anuncio.tipo} · {fecha}
        </p>
        <h2>{anuncio.titulo}</h2>
        <p className="frase">{anuncio.frase}</p>

        {futuro ? (
          anuncio.presave && (
            <div className="acciones" style={{ marginTop: "1.3rem" }}>
              <a className="boton" href={anuncio.presave}>
                Guardar antes de que salga
              </a>
            </div>
          )
        ) : (
          anuncio.spotifyTrackId && (
            <iframe
              src={`https://open.spotify.com/embed/track/${anuncio.spotifyTrackId}?theme=0`}
              height={152}
              loading="lazy"
              title={`${anuncio.titulo} en Spotify`}
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
            />
          )
        )}

        {anuncio.extra && (
          <a className="secundario" href={anuncio.extra.url}>
            {anuncio.extra.texto} <span aria-hidden="true">→</span>
          </a>
        )}
      </div>
    </section>
  );
}
