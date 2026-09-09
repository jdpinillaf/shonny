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
          <li>
            <a href="mailto:contacto@shonny.co">Contacto</a>
          </li>
        </ul>
        <p className="rotulo" style={{ marginTop: "1.6rem" }}>
          © {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
