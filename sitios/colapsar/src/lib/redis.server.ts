import "server-only";
import { Redis } from "@upstash/redis";

let cliente: Redis | null = null;

/**
 * El cliente de Redis, uno solo para todo el servidor.
 *
 * Perezoso a propósito. Construirlo en el ámbito del módulo se ejecutaría
 * durante `next build`, y la landing entera dejaría de compilar por una
 * variable que todavía no está puesta.
 *
 * Y a mano en vez de con `Redis.fromEnv()`: cuando Upstash se provisiona desde
 * el marketplace de Vercel, las variables llegan como `KV_REST_API_*`, y
 * `fromEnv()` solo busca `UPSTASH_REDIS_REST_*`. Se aceptan las dos, que es lo
 * que hace que funcione igual si algún día se cambia el marketplace por una
 * cuenta propia de Upstash.
 *
 * Vive en su propio módulo y no dentro de `piezas.server.ts` porque el panel
 * necesita el mismo cliente para frenar los intentos de entrada, y no tiene por
 * qué importar la lista de piezas para conseguirlo.
 */
export function redis(): Redis {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error("sin credenciales de Redis");
  return (cliente ??= new Redis({ url, token }));
}
