import type { Contenido } from "@shonny/datos/tipos";

/**
 * El menú. Se esconde al bajar y vuelve al subir — eso lo maneja `Movimiento`.
 *
 * Los destinos que viven fuera del sitio salen del sitio: "Tienda" va derecho a
 * Wix en vez de bajar a un ancla interna, porque la tienda de verdad está allá y
 * un rodeo de dos clics no le sirve a nadie.
 */
export function Cabecera({ enlaces }: { enlaces: Contenido["enlaces"] }) {
  return (
    <header className="arriba">
      <a className="marca" href="#">
        Shonny
      </a>
      <nav>
        <a href="#suena">Música</a>
        <a href="#universo">Universo</a>
        <a href="https://www.shonny.co/shop">Tienda</a>
        <a href="#vivo">En vivo</a>
        <a href="#paraiso">El Paraíso</a>
        <span className="redes">
          {enlaces.plataformas.slice(0, 1).concat(enlaces.redes.slice(0, 2)).map(([n, u]) => (
            <a key={u} href={u}>
              {n}
            </a>
          ))}
        </span>
      </nav>
    </header>
  );
}
