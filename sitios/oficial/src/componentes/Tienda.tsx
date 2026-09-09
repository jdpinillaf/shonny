import type { Prenda } from "@shonny/datos/tipos";

/**
 * Un preview que sí deja ver el producto, con las fotos reales del catálogo.
 *
 * Lo que NO se hace acá es carrito: cada tarjeta abre su ficha en Wix, que es
 * donde vive el stock y el cobro. Mantener dos vitrinas tiene un final conocido
 * —un día los precios no coinciden— y el que está mal siempre es el que nadie
 * recuerda que existe.
 */
export function Tienda({ prendas }: { prendas: Prenda[] }) {
  if (!prendas.length) return null;

  return (
    <section id="tienda">
      <p className="rotulo">La tienda · Colección Renacer · pre-order</p>

      <div className="vitrina" style={{ marginTop: "clamp(1.2rem,2.5vw,1.8rem)" }}>
        {prendas.map((p) => (
          <a className="prenda" key={p.url} href={p.url}>
            <div className="foto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.foto} alt={p.nombre} />
            </div>
            <h3>{p.nombre}</h3>
            <p className="precio">
              <strong>{p.precio}</strong> {p.antes && <s>{p.antes}</s>}
            </p>
            <span className="comprar">Comprar</span>
          </a>
        ))}
      </div>

      <div className="tienda-pie">
        <p className="rotulo">Los envíos y el pago se hacen en la tienda</p>
        <a className="boton boton--linea" href="https://www.shonny.co/shop">
          Ver la tienda completa
        </a>
      </div>
    </section>
  );
}
