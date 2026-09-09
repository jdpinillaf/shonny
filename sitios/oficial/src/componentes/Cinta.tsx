/**
 * El universo sensorial del ADN pasando despacio.
 *
 * Le da pulso a la página entre sección y sección: siempre hay algo moviéndose,
 * aunque nadie scrollee.
 *
 * La lista va DOS veces y la animación recorre exactamente el 50%, para que el
 * bucle no salte. La segunda mitad va con `aria-hidden` para que un lector de
 * pantalla no lea todo dos veces.
 */
export function Cinta({ frases }: { frases: string[] }) {
  return (
    <div className="cinta" aria-label="El universo sensorial">
      <ul>
        {frases.map((f) => (
          <li key={f}>{f}</li>
        ))}
        {frases.map((f) => (
          <li key={`eco-${f}`} aria-hidden="true">
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}
