import type { Contenido } from "@shonny/datos/tipos";

export function Pie({ enlaces }: { enlaces: Contenido["enlaces"] }) {
  return (
    <footer>
      <div>
        <p className="rotulo">Escuchar</p>
        <ul>
          {enlaces.plataformas.map(([n, u]) => (
            <li key={u}>
              <a href={u}>{n}</a>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="rotulo">Seguir</p>
        <ul>
          {enlaces.redes.map(([n, u]) => (
            <li key={u}>
              <a href={u}>{n}</a>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="rotulo">Prensa y booking</p>
        <ul>
          {/* El EPK ya existía como PDF y está bien hecho: se sirve tal cual en
              vez de rehacerlo en HTML. Es lo que la industria espera recibir, y
              rehacerlo sería trabajo para empeorarlo. */}
          <li>
            <a href="/epk/EPK-Shonny.pdf">EPK (PDF)</a>
          </li>
          <li>
            {/* La dirección de verdad, la que ya usan. Antes decía
                contacto@shonny.co, que no existe: un correo inventado en el pie
                es una puerta cerrada con cartel de abierta. */}
            <a href="mailto:managershonny@gmail.com">managershonny@gmail.com</a>
          </li>
        </ul>
        <p className="rotulo" style={{ marginTop: "1.6rem" }}>
          © {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
