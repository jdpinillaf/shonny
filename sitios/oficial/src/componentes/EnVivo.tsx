import type { Evento } from "@shonny/datos/tipos";

/**
 * Las fechas, o el vacío que enseña a dónde ir.
 *
 * Hoy shonny.co dice "No hay eventos en este momento" y eso se lee a sitio
 * abandonado. Decir que no hay fechas está bien; lo que no puede faltar es la
 * siguiente frase, que es dónde enterarse cuando las haya.
 *
 * Cuando Wix Events devuelva fechas, la franja crece con la lista adentro sin
 * cambiar de forma.
 */
export function EnVivo({ eventos, paraiso }: { eventos: Evento[]; paraiso: string }) {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("es-CO", {
      day: "numeric",
      month: "long",
      timeZone: "America/Bogota",
    });

  return (
    <section id="vivo" className="vivo">
      <p className="rotulo">En vivo</p>

      {eventos.length === 0 ? (
        <>
          <h2>Todavía no hay fechas</h2>
          <a className="boton" href={paraiso}>
            Enterarme primero
          </a>
        </>
      ) : (
        <ol className="fechas">
          {eventos.map((e) => (
            <li key={e.slug}>
              <span className="cuando">{fmt(e.inicio)}</span>
              <span className="donde">
                {e.lugar}
                {e.ciudad && ` · ${e.ciudad}`}
              </span>
              {e.url && (
                <a className="boton" href={e.url}>
                  Entradas
                </a>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
