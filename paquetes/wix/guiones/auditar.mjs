/**
 * Qué está publicado hoy en www.shonny.co, sin abrir el navegador.
 *
 * Existe porque el estado del sitio era algo que se descubría a mano cada varios
 * meses, y siempre tarde: la primera auditoría (8 sep 2026) encontró el home
 * destacando un single viejo, cuatro páginas con el texto de plantilla de Wix
 * ("Esta es tu página de Servicios… Haz doble clic") indexadas en Google, y el
 * pie diciendo © 2025.
 *
 * No necesita credenciales: mira lo mismo que ve cualquiera. Por eso se puede
 * correr siempre, y por eso no puede ver lo que está despublicado.
 *
 *   node guiones/auditar.mjs
 *   node guiones/auditar.mjs --json
 */

const SITIO = "https://www.shonny.co";

/**
 * Los rastros del texto que Wix deja en una página recién creada. Si alguno
 * aparece, esa página está publicada sin terminar. Se buscan varios porque Wix
 * cambia la plantilla según el tipo de página y con uno solo se escapan.
 */
const PLANTILLA = [
  "Esta es tu página de Servicios",
  "Haz doble clic en la caja de texto",
  'Haz clic en "Editar texto"',
  "I'm a paragraph. Click here to add your own text",
  "Esta es tu página para escribir acerca de ti",
];

/** Lo que Wix pinta cuando una sección está vacía. No es un error: es un vacío. */
const VACIOS = [
  ["No hay eventos en este momento", "sin eventos"],
  ["Nada que reservar ahora", "sin servicios que reservar"],
  ["Aún no hay productos", "sin productos"],
];

async function traer(url) {
  const r = await fetch(url, {
    headers: { "user-agent": "auditoria-shonny (interno)" },
    signal: AbortSignal.timeout(20000),
  });
  return { estado: r.status, cuerpo: r.ok ? await r.text() : "" };
}

/**
 * Wix escribe los acentos como entidades con nombre: "MI &Uacute;LTIMO SINGLE",
 * "&copy; 2025". La primera versión de este guion no las decodificaba y daba
 * todo por bueno — no encontraba el pie viejo ni el texto de plantilla de
 * /comunidad, porque las frases que buscaba llevaban tilde. Un guion de
 * auditoría que falla hacia "todo bien" es peor que no tenerlo.
 */
const ENTIDADES = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", copy: "©",
  aacute: "á", eacute: "é", iacute: "í", oacute: "ó", uacute: "ú",
  Aacute: "Á", Eacute: "É", Iacute: "Í", Oacute: "Ó", Uacute: "Ú",
  ntilde: "ñ", Ntilde: "Ñ", uuml: "ü", Uuml: "Ü",
  iquest: "¿", iexcl: "¡", hellip: "…", mdash: "—", ndash: "–",
  laquo: "«", raquo: "»", deg: "°",
};

function desescapar(s) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-zA-Z]+);/g, (todo, n) => ENTIDADES[n] ?? todo);
}

/**
 * El texto visible. Wix sirve el contenido en el HTML (no es una SPA vacía), así
 * que alcanza con quitar script y style y desnudar las etiquetas. Es tosco a
 * propósito: no queremos un parser, queremos saber si una frase está o no.
 */
function texto(html) {
  return desescapar(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

async function paginas() {
  const { cuerpo } = await traer(`${SITIO}/pages-sitemap.xml`);
  return [...cuerpo.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => m[1])
    .sort();
}

async function revisar(url) {
  const { estado, cuerpo } = await traer(url);
  if (estado !== 200) return { url, estado, notas: [`responde ${estado}`] };

  const t = texto(cuerpo);
  const notas = [];

  const plantilla = PLANTILLA.filter((f) => t.includes(f));
  if (plantilla.length) notas.push("TEXTO DE PLANTILLA SIN EDITAR");

  for (const [frase, nota] of VACIOS) if (t.includes(frase)) notas.push(nota);

  // El año del pie se devuelve, no se anota. El pie es el mismo en las once
  // páginas: anotarlo en cada una llena la salida de una sola noticia repetida y
  // entierra las que sí son de esa página.
  const anio = t.match(/©\s*(\d{4})/);

  return { url, estado, palabras: t.split(" ").length, notas, anio: anio?.[1] };
}

/**
 * Qué single destaca el home. No se puede preguntar por API —es texto del editor—
 * así que se busca en el hero: Wix pone el titular en un <h1>/<h2> y el nombre
 * del single va en mayúsculas.
 */
async function destacado() {
  const { cuerpo } = await traer(SITIO);
  const t = texto(cuerpo);
  const m = t.match(/ESCUCHA\s+([A-ZÁÉÍÓÚÑ0-9' ]{2,30}?)\s+MI [ÚU]LTIMO SINGLE/i);
  const enlaza = cuerpo.includes("colapsar.shonny.co");
  return { single: m ? m[1].trim() : "(no encontrado)", enlazaLanding: enlaza };
}

const urls = await paginas();
const filas = [];
for (const u of urls) filas.push(await revisar(u));
const hero = await destacado();

if (process.argv.includes("--json")) {
  console.log(JSON.stringify({ fecha: new Date().toISOString(), hero, filas }, null, 2));
} else {
  console.log(`\n  www.shonny.co · ${new Date().toISOString().slice(0, 10)}\n`);
  console.log(`  single destacado en el home: ${hero.single}`);
  console.log(`  el home enlaza a la landing:  ${hero.enlazaLanding ? "sí" : "NO"}`);
  const anios = [...new Set(filas.map((f) => f.anio).filter(Boolean))];
  const viejos = anios.filter((a) => Number(a) < new Date().getFullYear());
  if (viejos.length) console.log(`  pie del sitio:               © ${viejos.join(", ")} (atrasado)`);
  console.log();
  for (const f of filas) {
    const ruta = decodeURIComponent(f.url.replace(SITIO, "")) || "/";
    const marca = f.notas.length ? "!" : " ";
    console.log(`  ${marca} ${ruta.padEnd(28)} ${f.notas.join(" · ") || "ok"}`);
  }
  const mal = filas.filter((f) => f.notas.length).length;
  console.log(`\n  ${filas.length} páginas · ${mal} con algo que arreglar\n`);
}
