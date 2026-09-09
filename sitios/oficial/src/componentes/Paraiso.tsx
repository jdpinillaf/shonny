import type { Contenido } from "@shonny/datos/tipos";

/**
 * La comunidad cierra el sitio y no vive en el pie.
 *
 * El ADN pide construir una comunidad que se nutra del universo del proyecto, y
 * una comunidad no se pide entre los links legales. Es además lo único del sitio
 * que convierte un oyente prestado por un algoritmo en un contacto propio.
 */
export function Paraiso({ paraiso }: { paraiso: Contenido["paraiso"] }) {
  return (
    <section id="paraiso" className="paraiso">
      <p className="rotulo">El Paraíso · grupo privado</p>
      <h2>{paraiso.titulo}</h2>
      <p>{paraiso.texto}</p>
      <a className="puerta" href={paraiso.url}>
        Unirme <span aria-hidden="true">→</span>
      </a>
    </section>
  );
}
