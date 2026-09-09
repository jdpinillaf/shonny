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
  /**
   * La hora se muestra solo si el dato la trae. Un ISO sin `T` es una fecha
   * suelta: significa que el show está confirmado pero la hora no, y escribir
   * una hora que nadie confirmó es peor que no poner ninguna.
   */
  const fmt = (iso: string) => {
    const d = new Date(iso);
    /**
     * Una fecha suelta se formatea en UTC, no en Bogotá.
     *
     * `new Date("2026-09-10")` es medianoche UTC, y al pintarla en
     * America/Bogotá (UTC−5) retrocede cinco horas: el show del 10 salía
     * anunciado el 9. Con hora explícita no pasa, porque el ISO trae su offset.
     */
    const dia = d.toLocaleDateString("es-CO", {
      day: "numeric",
      month: "long",
      timeZone: iso.includes("T") ? "America/Bogota" : "UTC",
    });
    if (!iso.includes("T")) return dia;
    const hora = d.toLocaleTimeString("es-CO", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/Bogota",
    });
    return `${dia} · ${hora}`;
  };

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
