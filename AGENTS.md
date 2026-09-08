# Convenciones

Este repo guarda todo lo técnico de Shonny: los lanzamientos, el sitio, las piezas
de redes, los datos. Las reglas de abajo no son estilo: cada una está escrita porque
algo se rompió o se perdió por no tenerla.

## El idioma es español

Nombres de archivo, funciones, variables, constantes, comentarios y commits. Inglés
solo donde lo impone un tercero (`useState`, `fetch`, los campos de la API de Wix).

No es una pose: la persona que lee esto en seis meses piensa en español, y traducir
mentalmente `notes` ↔ `notas` mientras se busca un bug cuesta atención que hace
falta en otro lado.

## Los comentarios explican por qué, no qué

Cada archivo abre con un bloque que dice **por qué existe**. Los comentarios
registran decisiones descartadas, mediciones reales y trampas encontradas:

```ts
// Era un `motion.div` para un solo cambio de opacidad. El `initial` de motion se
// serializa como estilo inline en el HTML del servidor, así que la página llegaba
// entera con `opacity: 0`. Ahora es CSS: de 535 ms a 168.
```

Un comentario que repite lo que dice el código sobra. Uno que dice qué se probó
antes y por qué no funcionó vale por una tarde.

## Commits

Frase declarativa en español, sin prefijo. El sujeto es lo que cambió, contado como
si se lo contaras a alguien:

> `La canción ya no se promete: suena en la página`

El cuerpo es largo cuando hace falta: qué alternativas se descartaron, qué se midió,
qué queda pendiente.

## Un solo `package-lock.json`, en la raíz

Es npm workspaces. Un segundo lock dentro de un sitio hace que npm instale dos
veces y que el build se lleve **dos copias de React**: `Invalid hook call` y errores
de hidratación con una causa que no se parece al síntoma.

## Tailwind v4 entre paquetes

- `@import "tailwindcss"` lo pone **cada sitio**, nunca el paquete compartido, o el
  preflight entra dos veces.
- Cada sitio necesita `@source` apuntando a `@shonny/escenografia`. Tailwind no
  escanea `node_modules`: sin esa línea, las clases que solo se usan dentro del
  paquete **desaparecen en producción y funcionan en dev**. Es el fallo más difícil
  de atribuir de todo el repo.
- Los paquetes envían TypeScript crudo → `transpilePackages` en el `next.config.ts`
  de cada sitio.

## Nada sube a `escenografia` hasta que tenga un segundo consumidor

Un componente usado en un solo sitio no es un componente compartido: es una API
diseñada contra un único caso de uso, que es como se diseñan las APIs incómodas.
Cuando un segundo sitio lo pida, se mueve.

## Los guiones que escriben en Wix son simulacro por defecto

`--aplicar` es obligatorio para que un guion escriba. La llave de Wix es de **dueño
de la cuenta**: puede vaciar la tienda y borrar eventos con sus ventas dentro.
Ningún guion borra nada, nunca, ni siquiera con `--aplicar`: avisa y para.

## TypeScript

`strict`, alias `@/*` → `./src/*` dentro de cada sitio. Sin ESLint ni Prettier, sin
framework de test. Si algún día entra uno, entra con su propia decisión escrita en
`docs/decisiones/`.
