import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { notas } from "@/content/notas";
import type { Pieza } from "@/content/pieza";
import { haySesion, hayPuerta } from "@/lib/admin.server";
import { leerPiezasSinCache } from "@/lib/piezas.server";
import { entrar, retirar, salir } from "./acciones";

export const metadata: Metadata = {
  title: "Panel — Colapsar",
  // El panel está detrás de un token, pero que no salga en Google es gratis.
  robots: { index: false, follow: false },
};

const FECHA = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeStyle: "short",
  // Fija: el servidor corre en UTC y la moderación se hace desde Colombia. Sin
  // esto, algo escrito a las 8 de la noche aparece fechado al día siguiente.
  timeZone: "America/Bogota",
});

/**
 * El panel de moderación.
 *
 * Existe porque el filtro de AI se equivoca y hasta ahora la única forma de
 * quitar algo de la pared era un `curl` con el token pegado a mano. Esto es lo
 * mismo, con el dedo, desde el móvil.
 *
 * Todo el trabajo pasa en el servidor: no hay ni un componente de cliente:
 * la lista se pinta con lo que hay en Redis y los tres botones son formularios.
 * Un panel que se ve tres veces al mes no necesita hidratarse.
 */
export default async function Panel({ searchParams }: PageProps<"/admin">) {
  // Sin `ADMIN_TOKEN` puesto, la ruta no existe. Es la misma respuesta que da la
  // API: quien la busque no puede distinguir "no configurado" de "no está".
  if (!hayPuerta()) notFound();

  const { mal, borrar } = await searchParams;

  if (!(await haySesion())) {
    return (
      <Marco>
        <Entrada mal={typeof mal === "string" ? mal : undefined} />
      </Marco>
    );
  }

  const piezas = await leerPiezasSinCache();
  const aConfirmar = typeof borrar === "string" ? borrar : undefined;

  return (
    <Marco>
      <header className="mb-8 flex items-baseline justify-between gap-4 border-b border-humo/25 pb-4">
        <div>
          <h1 className="font-serif text-2xl text-tiza">Lo que ha dejado la gente</h1>
          <p className="mt-1 text-xs text-humo">
            {piezas.length === 0
              ? "nada todavía"
              : `${piezas.length} ${piezas.length === 1 ? "pieza" : "piezas"}`}
            {" · "}
            {notas.length} semillas fijas en el repo, esas no se tocan desde acá
          </p>
        </div>

        <form action={salir}>
          <button
            type="submit"
            className="cursor-pointer text-xs text-humo underline underline-offset-4 hover:text-tiza"
          >
            salir
          </button>
        </form>
      </header>

      {piezas.length === 0 ? (
        <p className="text-sm text-humo">
          La pared está solo con sus semillas. Cuando alguien escriba algo y pase
          la moderación, aparece acá.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {piezas.map((pieza) => (
            <Fila
              key={pieza.id}
              pieza={pieza}
              confirmando={aConfirmar === pieza.id}
            />
          ))}
        </ul>
      )}
    </Marco>
  );
}

/**
 * El contenedor con scroll propio.
 *
 * `body` lleva `overflow: hidden` para que el museo no se mueva, y eso también
 * ataría al panel a una sola pantalla. Un `fixed` con su propio scroll se salta
 * la regla sin tener que tocarla para todos.
 */
function Marco({ children }: { children: React.ReactNode }) {
  return (
    <main className="fixed inset-0 overflow-y-auto overscroll-contain bg-noche">
      <div className="mx-auto w-full max-w-2xl px-5 py-10">{children}</div>
    </main>
  );
}

function Entrada({ mal }: { mal?: string }) {
  return (
    <form action={entrar} className="mx-auto mt-[20vh] max-w-sm">
      <h1 className="font-serif text-2xl text-tiza">Panel</h1>
      <p className="mt-1 mb-6 text-xs text-humo">Museo de lo que nunca pasó</p>

      <label htmlFor="token" className="block text-xs text-humo">
        token
      </label>
      <input
        id="token"
        name="token"
        type="password"
        autoComplete="current-password"
        autoFocus
        className="mt-2 w-full rounded-sm border border-humo/35 bg-transparent px-3 py-2 font-mono text-sm text-tiza outline-none focus:border-tiza/70"
      />

      <button
        type="submit"
        className="mt-4 w-full cursor-pointer rounded-sm border border-humo/35 px-3 py-2 text-sm text-tiza hover:border-tiza/70"
      >
        entrar
      </button>

      {mal && (
        <p className="mt-4 text-xs text-terracota">
          {mal === "espera"
            ? "Demasiados intentos. Prueba dentro de un rato."
            : "Ese no es."}
        </p>
      )}
    </form>
  );
}

function Fila({ pieza, confirmando }: { pieza: Pieza; confirmando: boolean }) {
  return (
    <li className="rounded-sm border border-humo/25 p-4">
      <div className="flex items-baseline justify-between gap-4 text-[11px] text-humo">
        <span>{FECHA.format(new Date(pieza.creado))}</span>
        <span className="font-mono">{pieza.id.slice(0, 8)}</span>
      </div>

      {pieza.texto && (
        <p className="mt-2 text-sm whitespace-pre-wrap text-tiza">{pieza.texto}</p>
      )}

      {pieza.foto && (
        // A pelo y no con `next/image`: son las mismas fotos que ya optimiza la
        // portada, y pasarlas otra vez por el optimizador para verlas tres veces
        // al mes es gastar transformaciones en nada.
        <img
          src={pieza.foto.url}
          alt=""
          width={pieza.foto.w}
          height={pieza.foto.h}
          className="mt-3 max-h-64 w-auto rounded-sm border border-humo/25"
        />
      )}

      <div className="mt-3 flex items-center gap-4 text-xs">
        {confirmando ? (
          <>
            <span className="text-humo">¿Seguro? No hay vuelta atrás.</span>
            <form action={retirar}>
              <input type="hidden" name="id" value={pieza.id} />
              <button
                type="submit"
                className="cursor-pointer text-terracota underline underline-offset-4"
              >
                sí, borrar
              </button>
            </form>
            <a href="/admin" className="text-humo underline underline-offset-4">
              no
            </a>
          </>
        ) : (
          // Un enlace y no un botón: la confirmación es otra pantalla, no un
          // `confirm()`. Así un dedo torpe en el móvil no borra nada de golpe.
          <a
            href={`/admin?borrar=${pieza.id}`}
            className="text-humo underline underline-offset-4 hover:text-terracota"
          >
            borrar
          </a>
        )}
      </div>
    </li>
  );
}
