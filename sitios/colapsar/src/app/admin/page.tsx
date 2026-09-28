import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PIEZAS_TEXTO } from "@/content/coleccion";
import type { Pieza } from "@/content/pieza";
import { site } from "@/content/site";
import { haySesion, hayPuerta } from "@/lib/admin.server";
import { leerPiezasSinCache } from "@/lib/piezas.server";
import { cupo, hayInstagram, publicadas, type Publicada } from "@/lib/story/instagram.server";
import { anadir, entrar, publicar, retirar, salir } from "./acciones";
import { Descargar } from "./Descargar";

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
 * Todo el trabajo pasa en el servidor: la lista se pinta con lo que hay en
 * Redis y los botones son formularios. La única excepción es `Descargar`, que
 * necesita el navegador para enseñar que el PNG se está haciendo.
 */
export default async function Panel({ searchParams }: PageProps<"/admin">) {
  // Sin `ADMIN_TOKEN` puesto, la ruta no existe. Es la misma respuesta que da la
  // API: quien la busque no puede distinguir "no configurado" de "no está".
  if (!hayPuerta()) notFound();

  const { mal, borrar, ig, nueva } = await searchParams;

  if (!(await haySesion())) {
    return (
      <Marco>
        <Entrada mal={typeof mal === "string" ? mal : undefined} />
      </Marco>
    );
  }

  const piezas = await leerPiezasSinCache();
  const aConfirmar = typeof borrar === "string" ? borrar : undefined;

  // Sin cuenta configurada el panel es exactamente el de antes: ni botón, ni
  // cupo, ni una sola llamada a Meta.
  const conIg = hayInstagram();
  const [yaSalieron, hoy] = conIg
    ? await Promise.all([publicadas(piezas.map((p) => p.id)), cupo()])
    : [new Map<string, Publicada>(), null];

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
            {PIEZAS_TEXTO.length} semillas fijas en el repo, esas no se tocan desde acá
            {hoy && ` · ${hoy.usadas} de ${hoy.total} stories hoy`}
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

      {/* Lo que dijo Meta en el último intento. Sin esto, publicar y que falle
          es un botón que no hace nada. */}
      {typeof ig === "string" && (
        <p
          className={`mb-6 rounded-sm border px-3 py-2 text-xs ${
            ig === "ok" ? "border-humo/35 text-humo" : "border-terracota/50 text-terracota"
          }`}
        >
          {ig === "ok" ? "Publicada. La story ya está en la cuenta." : ig}
        </p>
      )}

      <Anadir />

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
              conIg={conIg}
              publicada={yaSalieron.get(pieza.id)}
              nueva={nueva === pieza.id}
            />
          ))}
        </ul>
      )}

      {/* Las semillas no se borran ni se editan desde acá —viven en el repo—,
          pero se exportan igual que el resto: son la mayor parte de la pared. */}
      <details className="mt-10 border-t border-humo/25 pt-6">
        <summary className="cursor-pointer text-xs text-humo hover:text-tiza">
          semillas ({PIEZAS_TEXTO.length}) — solo exportar
        </summary>
        <ul className="mt-4 flex flex-col gap-3">
          {PIEZAS_TEXTO.map((pieza) => (
            <li key={pieza.id} className="flex gap-4 rounded-sm border border-humo/25 p-4">
              <Miniatura id={pieza.id} />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="font-mono text-[11px] text-humo">{pieza.id}</span>
                <p className="mt-2 text-sm whitespace-pre-wrap text-tiza">{pieza.texto}</p>
                <div className="mt-auto flex flex-wrap gap-4 pt-3 text-xs">
                  <Exportar id={pieza.id} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </details>
    </Marco>
  );
}

/**
 * Colgar una confesión a mano. Entra directa, sin filtro: ver `anadirPieza`.
 */
function Anadir() {
  return (
    <form action={anadir} className="mb-8 flex flex-col gap-2">
      <label htmlFor="texto" className="text-xs text-humo">
        añadir a la pared
      </label>
      <textarea
        id="texto"
        name="texto"
        required
        rows={3}
        maxLength={site.maxRespuesta}
        placeholder={site.marcador}
        className="w-full resize-y rounded-sm border border-humo/35 bg-transparent px-3 py-2 text-sm text-tiza outline-none focus:border-tiza/70"
      />
      <div className="flex items-baseline justify-between text-[11px] text-humo">
        <span>hasta {site.maxRespuesta} caracteres · entra sin pasar por el filtro</span>
        <button
          type="submit"
          className="cursor-pointer rounded-sm border border-humo/35 px-3 py-1.5 text-xs text-tiza hover:border-tiza/70"
        >
          colgar
        </button>
      </div>
    </form>
  );
}

/**
 * El papel tal cual sale al exportarlo. `lazy` porque cada uno es un render de
 * Satori en el servidor: con la lista larga no se piden todos de golpe.
 */
function Miniatura({ id }: { id: string }) {
  return (
    <a
      href={`/api/story/${id}?formato=papel`}
      target="_blank"
      rel="noreferrer"
      className="w-28 shrink-0 self-start"
    >
      <img src={`/api/story/${id}?formato=papel`} alt="" loading="lazy" className="w-full" />
    </a>
  );
}

/** Los tres enlaces de exportar. `?descargar` hace que la ruta mande el archivo con nombre. */
function Exportar({ id }: { id: string }) {
  return (
    <>
      <Descargar href={`/api/story/${id}?formato=papel&descargar`}>PNG papel</Descargar>
      <Descargar href={`/api/story/${id}?formato=png&descargar`}>PNG story</Descargar>
      <a href={`/api/story/${id}`} target="_blank" rel="noreferrer" className="text-humo/70 underline underline-offset-4 hover:text-tiza">
        ver story
      </a>
    </>
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

function Fila({
  pieza,
  confirmando,
  conIg,
  publicada,
  nueva,
}: {
  pieza: Pieza;
  confirmando: boolean;
  conIg: boolean;
  publicada?: Publicada;
  nueva: boolean;
}) {
  return (
    <li
      className={`flex gap-4 rounded-sm border p-4 ${nueva ? "border-tiza/60" : "border-humo/25"}`}
    >
      {pieza.texto && <Miniatura id={pieza.id} />}
      <div className="min-w-0 flex-1">
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

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
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
            <>
              <a
                href={`/admin?borrar=${pieza.id}`}
                className="text-humo underline underline-offset-4 hover:text-terracota"
              >
                borrar
              </a>

              {/* Sin texto no hay story: la ruta devuelve 404 para las piezas de
                  solo foto, así que el botón tampoco se ofrece. */}
              {conIg &&
                pieza.texto &&
                (publicada ? (
                  <span className="text-humo">
                    story del {FECHA.format(new Date(publicada.cuando))}
                  </span>
                ) : (
                  <form action={publicar}>
                    <input type="hidden" name="id" value={pieza.id} />
                    <button type="submit" className="cursor-pointer text-humo underline underline-offset-4 hover:text-tiza">
                      publicar story
                    </button>
                  </form>
                ))}

              {pieza.texto && <Exportar id={pieza.id} />}
            </>
          )}
        </div>
      </div>
    </li>
  );
}
