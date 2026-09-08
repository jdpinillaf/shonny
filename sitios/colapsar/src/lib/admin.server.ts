import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { createHash, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redis } from "@/lib/redis.server";

/** La cookie que sostiene la sesión del panel. */
const GALLETA = "colapsar_admin";

/** Una semana. Lo suficiente para no volver a pegar el token cada domingo. */
const SESION = 60 * 60 * 24 * 7;

/** Intentos de entrada que se le permiten a una IP, y en cuánto tiempo. */
const INTENTOS = 10;
const VENTANA = "1 h" as const;

/**
 * Comparación en tiempo constante.
 *
 * `timingSafeEqual` exige que los dos búferes midan lo mismo o lanza, y la
 * longitud del token no es secreta, así que se atajan antes los distintos.
 */
function igual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** ¿Es este el token de administración? Sin token puesto, nadie lo es. */
export function esAdmin(dado: string): boolean {
  const esperado = process.env.ADMIN_TOKEN;
  return Boolean(esperado) && igual(dado, esperado as string);
}

/** ¿Existe siquiera la puerta? Sin `ADMIN_TOKEN` el panel no se monta. */
export function hayPuerta(): boolean {
  return Boolean(process.env.ADMIN_TOKEN);
}

/**
 * Lo que se guarda en la cookie: un derivado del token, nunca el token.
 *
 * La diferencia importa el día que la cookie se escape —una extensión, un
 * backup del navegador, una captura de pantalla—: el derivado abre el panel
 * hasta que se cambie el token, pero no sirve como `Bearer` contra la API ni
 * revela el secreto que también vive en las variables de Vercel.
 */
function sello(token: string): string {
  return createHash("sha256").update(`colapsar:admin:${token}`).digest("hex");
}

export async function haySesion(): Promise<boolean> {
  const esperado = process.env.ADMIN_TOKEN;
  if (!esperado) return false;
  const galleta = (await cookies()).get(GALLETA)?.value ?? "";
  return igual(galleta, sello(esperado));
}

/** Abre la sesión si el token es el bueno. Devuelve si entró. */
export async function abrirSesion(dado: string): Promise<boolean> {
  const esperado = process.env.ADMIN_TOKEN;
  if (!esperado || !esAdmin(dado)) return false;

  (await cookies()).set(GALLETA, sello(esperado), {
    httpOnly: true,
    // En local no hay HTTPS: con `secure` fijo, el panel no se podría probar.
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    // Acotada al panel: ni la portada ni la API la reciben, así que no viaja en
    // las peticiones que sí ve mucha gente.
    path: "/admin",
    maxAge: SESION,
  });

  return true;
}

export async function cerrarSesion(): Promise<void> {
  // Se vacía en vez de borrarse: `delete` tiene que casar el `path` con el que
  // se puso, y una cookie que sobrevive al "salir" es peor que fea.
  (await cookies()).set(GALLETA, "", { path: "/admin", maxAge: 0 });
}

let limitador: Ratelimit | null = null;

/**
 * ¿Puede esta IP probar otro token?
 *
 * El token es una cadena en una variable de entorno y el formulario está
 * abierto a internet: sin freno, esto es un campo de tiro. Diez por hora deja
 * sitio para equivocarse al escribirlo en el móvil y no para adivinarlo.
 */
export async function puedeIntentar(): Promise<boolean> {
  try {
    limitador ??= new Ratelimit({
      redis: redis(),
      limiter: Ratelimit.slidingWindow(INTENTOS, VENTANA),
      prefix: "ratelimit:admin",
    });
    const { success } = await limitador.limit(await ip());
    return success;
  } catch {
    // Sin Redis no hay forma de contar, y sin Redis tampoco hay piezas que
    // moderar. Se cierra: un panel sin freno es justo lo que no puede quedar.
    return false;
  }
}

async function ip(): Promise<string> {
  // `x-vercel-forwarded-for` es la que Vercel no deja sobrescribir a un proxy;
  // `x-forwarded-for` sí se puede falsear si hay algo delante.
  const h = await headers();
  return (
    h.get("x-vercel-forwarded-for") ??
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "anon"
  );
}
