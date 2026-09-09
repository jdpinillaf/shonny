import type { Lamina } from "@shonny/datos/tipos";

/**
 * La sala que el ADN pide y que ningún referente tiene resuelta: mostrarla como
 * artista que va más allá de la música — danza, dirección de arte, audiovisual.
 *
 * Son tres fotos y una línea cada una. No hay párrafo explicando qué es el
 * universo: si hace falta explicarlo, las fotos están mal elegidas.
 */
export function Universo({ laminas }: { laminas: Lamina[] }) {
  return (
    <section id="universo">
      <p className="rotulo">El universo · más allá de la canción</p>
      <div className="universo" style={{ marginTop: "clamp(1.2rem,2.5vw,1.8rem)" }}>
        {laminas.map((l) => (
          <figure key={l.foto}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={l.foto} alt={l.pie} />
            <figcaption>{l.pie}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
