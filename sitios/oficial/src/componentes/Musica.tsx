import type { Cancion } from "@shonny/datos/tipos";

/**
 * La discografía. Cuando hay credenciales de Spotify esta lista no la mantiene
 * nadie: sale de su perfil y se actualiza sola.
 *
 * Se muestran seis y el resto queda detrás del enlace a Spotify. Una lista
 * completa de veinte canciones en el home no la lee nadie, y quien quiere el
 * catálogo entero lo quiere en la app donde puede reproducirlo.
 */
export function Musica({ canciones, deSpotify }: { canciones: Cancion[]; deSpotify: boolean }) {
  return (
    <section id="suena">
      <p className="rotulo">Lo que suena</p>
      <h2 style={{ margin: ".6rem 0 clamp(1.4rem,3vw,2.2rem)", maxWidth: "16ch" }}>La música</h2>

      <div className="suena">
        <ol className="canciones">
          {canciones.slice(0, 6).map((c) => (
            <li key={c.url}>
              <a href={c.url}>
                <span className="titulo">
                  {c.titulo}
                  {(c.anio || c.nueva) && (
                    <small>
                      {c.anio}
                      {c.nueva && " · nuevo"}
                    </small>
                  )}
                </span>
                <span className="ir">Spotify</span>
              </a>
            </li>
          ))}
        </ol>
      </div>

      <p className="rotulo" style={{ marginTop: "1.6rem" }}>
        {deSpotify ? "Se actualiza sola desde Spotify" : "Los años son estimados"} ·{" "}
        <a href="https://open.spotify.com/artist/70axD2kGUWcyWjZAGAtgft" style={{ color: "inherit" }}>
          ver todo en Spotify
        </a>
      </p>
    </section>
  );
}
