# Cada pieza, una story de Instagram

Diseño validado — 28 de agosto de 2026.

## Qué se construye

Una imagen 1080×1920 por pieza del museo, generada en el servidor, con dos
consumidores:

1. **El visitante.** Un botón *Compartir* en la pieza abierta pide la imagen y
   la pasa a la hoja del sistema, desde donde Instagram la recoge.
2. **Tú, desde `/admin`.** Un botón *publicar story* por pieza, que la sube a
   @shonny con la API de Meta.

El diseño de la imagen vive en un solo sitio y los dos caminos comen de él.

## La composición: la pared entera

La nota protagonista en foco, en su papel y con su chinche, ligeramente
inclinada. Alrededor, siete papeles más de la colección, apagados: papel al 34 %
y tinta a media opacidad. Encima, una penumbra radial que apaga los bordes y deja legible solo
el centro. Abajo, una regla fina y la dirección: `COLAPSAR.SHONNY.CO`.

Elegida entre cinco por una razón concreta: **la colección se ve sin contarla**.
Es la única de las cinco que se entiende sin leerla, y la que da motivos para
entrar a la página. El precio, aceptado: la frase pesa menos que en las otras,
porque compite con siete papeles de fondo.

**Las siete del fondo no son aleatorias.** Salen de `barajar()` sembrado con el
id de la protagonista, quitándola a ella. La misma pieza da siempre exactamente
la misma pared: no hay dos stories distintas de la misma frase, y la ruta no
depende de `Math.random`, que daría una imagen distinta en cada fallo de caché.

### Lo que se descartó, y por qué

- **El papel colgado solo** — bonita, pero no enseña que hay colección.
- **La frase a sangre en serif** — la más legible en un feed, pierde el museo.
- **Papel + card del disco** — convierte mejor, pero mete la venta donde va la
  confesión.
- **Cédula de museo** — la más conceptual y la única en claro; demasiado fría.
- **La cifra "y 26 más"** debajo — se quitó a petición, y con ella se fue la
  única razón por la que la imagen tenía que caducar. Ver *Caché*.

## Arquitectura

```
/api/story/[id]  ──┬── fetch() desde PiezaAbierta ── navigator.share()
   (JPEG 1080×1920)│
                   └── image_url en POST /media ── Instagram
```

Un solo generador. Meta va a buscar la imagen a la misma URL pública que usa el
navegador del visitante: no hay que subir nada a Blob ni duplicar el diseño.

### Archivos

| Archivo | Qué es |
|---|---|
| `src/app/api/story/[id]/route.tsx` | La ruta. Busca la pieza, dibuja, devuelve JPEG. |
| `src/lib/story/composicion.tsx` | El JSX de la composición. |
| `src/lib/story/fuentes.ts` + dos `.ttf` | Carga de fuentes para Satori. |
| `src/components/fondo/PiezaAbierta.tsx` | Se le añade la fila del pie con el botón. |
| `src/app/admin/acciones.ts` | Server action `publicar`. |
| `src/app/admin/page.tsx` | Botón por pieza, estado y cupo. |
| `src/lib/story/instagram.server.ts` | Las dos llamadas a Meta y el token. |

`composicion.tsx` va en `lib/` y no en `components/` a propósito: no es un
componente de React DOM y nadie debe poder montarlo en la página. Se llamó
`pared.tsx` mientras dibujaba una pared.

## El generador

1. **Valida el id.** `ES_ID` solo casa uuid, y las semillas son `s01` / `f01`:
   el visitante puede abrir una semilla, así que la validación acepta las dos
   formas. Nada que no case llega a tocar Redis.
2. **Busca la pieza** en `unir(PIEZAS_SEMILLA, await leerPiezas())`. Si no está,
   404.
3. **Dibuja** con `ImageResponse`.
4. **Convierte** el PNG a JPEG con `sharp` — calidad 86, sRGB. Ronda los 300 KB,
   muy por debajo de los 8 MB que admite Meta.

### Ni una gaussiana: la medida que cambió el diseño

**El desenfoque del fondo se cayó.** Con él, la ruta tardaba **14 segundos en
producción, en caliente y de forma constante**. Medido por partes: `sharp` eran
18 ms y todo lo demás Satori. El `filter: blur(3px)` de las siete notas costaba
800 ms de los 1900 de local, y da igual repartirlo en siete filtros pequeños que
envolverlas en uno solo —se probaron los dos— porque el coste va con el área.
La sombra difusa de 90 px del papel y el degradado de la penumbra a pantalla
completa eran otros 500.

Lo que las sustituye:

- **La sombra difusa pasó a ser una sombra dura.**
- La penumbra se movió a `sharp` (un SVG rasterizado una vez por instancia,
  20 ms en vez de 500) y **después se quitó del todo** al desaparecer la pared.
- La profundidad del fondo pasó a ser contraste en vez de desenfoque, y luego
  dejó de hacer falta: no hay fondo.

Y **el lienzo se rasteriza a 3/4** (810×1440) y lo sube `sharp` con lanczos: son
15 ms a cambio de casi la mitad del render, y la salida sigue siendo 1080×1920
exactos, que es lo que pide Meta. La composición se sigue escribiendo en píxeles
de 1080 dentro de un `transform: scale()`, así que no hay dos juegos de medidas.

**Resultado: de 14 s a ~2 s** en producción, y luego caché. Con la pared fuera,
el render local bajó además de 535 ms a **168**.

Un detalle que salió de esto: **la línea sobre la dirección tuvo que pasar a
2 px.** A 1 px no sobrevivía al rasterizado a 3/4 y desaparecía entera.

### Límites de Satori que obligan a cambios

Verificados contra las docs de `vercel/satori`, no de memoria:

- **Soportado y usado**: `filter: blur()`, `radial-gradient` en `backgroundImage`,
  `boxShadow`, `transform: rotate()`, `position: absolute`, `opacity`.
- **No hay pseudo-elementos.** La penumbra y el grano eran `::before` / `::after`
  en el boceto: pasan a ser `<div>` de verdad. El grano probablemente se cae
  — es una teselación de 3 px que a 1080 no aporta.
- **No hay `grid`.** `display` es `flex` por defecto y es lo único que hay.
- **Sin `inset`**: `top` / `left` / `right` / `bottom` uno a uno.
- **Fuentes en TTF/OTF/WOFF, nunca woff2.** `next/font` no se las presta a
  `ImageResponse`. Dos archivos dentro del repo, leídos con
  `readFile(new URL('./fuentes/…', import.meta.url))`: Instrument Serif 400 y
  Courier Prime 400. **Esto es lo primero que hay que verificar al implementar**
  — si el trazado de archivos de Next no los recoge en el bundle de la función,
  la ruta revienta en producción y funciona en local.

### El texto

**El tamaño de letra está calcado del modal en un móvil**, medido en la página y
no estimado: en un viewport de 390 el papel de la pieza abierta mide 335 con 28
de margen a cada lado —279 útiles— y la nota va a 17 px. Eso es el 6,1 % del
ancho útil, y el pie el 3,05 %. En la story el papel deja 484 útiles, así que
salen 30 y 15. Va escrito como proporción y no como número suelto, para que
tocar `ANCHO_PAPEL` no vuelva a descuadrarlo.

`site.maxRespuesta` son 140 caracteres, así que el peor caso está acotado y cabe
con margen de sobra. **Un solo tamaño de letra; el papel crece hacia abajo.** El generador recorta a 140 igualmente, por si una semilla se pasa.

**Piezas con foto.** El tipo `Pieza` admite foto y existen las `f01…` de la
colección, aunque el formulario ya no la pide. Si la pieza trae foto, va dentro
del papel en gris, como en `PiezaAbierta`. No es camino crítico.

### Caché

`Cache-Control: public, s-maxage=31536000, immutable`. La imagen de una pieza no
cambia nunca — quitar la cifra viva es justo lo que lo permite. Un render por
pieza en toda su vida.

La única invalidación que queda: **al retirar una pieza en `/admin`, la acción
purga su ruta**, o su story se sigue sirviendo del CDN después de borrada. La
ruta devuelve 404 en origen, pero el CDN no se entera solo.

## El botón del visitante

Una fila en el pie de `PiezaAbierta`: firma a la izquierda, *Compartir* a la
derecha. Es el único sitio que sirve a la pared y al mural a la vez, y no toca
el vuelo de la nota.

### El problema real: el gesto de Safari

En Safari de iOS, `navigator.share()` tiene que llamarse **dentro del gesto**.
Un `await fetch(...)` antes lo caduca y Safari tira `NotAllowedError`: la hoja no
abre y la persona no entiende por qué. Y aquí hay que traer 300 KB antes de
compartir. Tres capas, de barata a segura:

1. **`pointerdown` arranca la descarga**, no el `click`. Son 100-300 ms de
   ventaja gratis, con el dedo todavía abajo.
2. **El `click` comparte con lo que haya.** Si el blob llegó, `navigator.share`
   sale en el mismo gesto.
3. **Si Safari lo rechaza igual**, el botón pasa a *Guardar imagen* y enseña la
   story en pantalla para mantener pulsado y guardar. Nadie se queda sin salida.

### Detección

`navigator.canShare({ files: [file] })`, **no** `navigator.share`. Safari de
escritorio tiene `share` pero no acepta archivos: comprobar solo `share` manda a
media escritorio a una hoja que falla. Sin soporte de archivos, el botón descarga
el JPEG.

### Estados y analítica

*Compartir* → *Preparando…* → hoja del sistema. Si la ruta falla,
*No se pudo — descargar*. Sin spinner: el pie mide 8,5 px y una rueda ahí es
ruido.

`evento("story pedida")` al pulsar, `evento("story compartida")` solo cuando
`navigator.share` resuelve. La diferencia entre los dos es la gente que abrió la
hoja y se echó atrás, que es lo que de verdad hay que saber de esta función.

**Coste aceptado:** cada pulsación son ~300 KB por datos móviles. Por eso la
descarga arranca en `pointerdown` y no al abrir la pieza: prefetchear al abrir
se los gastaría en todo el que solo mira.

## Publicar desde `/admin`

Junto a *borrar*, un *publicar story*. Otro formulario, otra server action, **con
su propia comprobación de sesión** — un action es un POST público contra la ruta
y el render no es el guardia.

### Las dos llamadas

```
POST graph.instagram.com/v25.0/<IG_USER_ID>/media
     media_type=STORIES
     image_url=https://colapsar.shonny.co/api/story/<id>
  → { id: creation_id }

POST graph.instagram.com/v25.0/<IG_USER_ID>/media_publish
     creation_id=<creation_id>
```

`graph.instagram.com` y no `graph.facebook.com` porque la app usa **Instagram
Login**. La URL de la imagen se construye desde `VERCEL_PROJECT_PRODUCTION_URL`,
igual que el `metadataBase` de `layout.tsx`: **tiene que ser producción**. Un
preview de Vercel está detrás de protección y Meta recibe un 401.

### El token

Vive 60 días. Va en Redis (`ig:token` + su fecha de caducidad). Cada publicación
mira cuánto le queda; por debajo de 10 días lo refresca con `ig_refresh_token` y
reescribe los dos valores.

**La trampa: si caduca del todo, no hay refresco posible.** Hay que volver a
autorizar la app a mano. Con una publicación cada pocos días no pasa, pero si la
cuenta se abandona tres meses, el botón muere y toca rehacer el OAuth.

### Estado y cupo

`ig:publicada:<id>` en Redis, con fecha e id del media. Sirve para que el botón
diga *publicada ayer* en vez de ofrecerse otra vez, y para que un doble toque en
el móvil no saque dos stories iguales. En la cabecera del panel, el cupo real
desde `content_publishing_limit`: *3 de 50 hoy*.

### Errores, visibles

Las acciones del panel hoy redirigen a `/admin` a secas. La nueva redirige con
`?ig=ok` o `?ig=<motivo>` y el panel lo pinta. Sin esto, un fallo de Meta es un
botón que no hace nada.

### Variables de entorno

| Nombre | Para qué |
|---|---|
| `IG_USER_ID` | La cuenta. **Sin esto el panel es el de antes**: ni botón, ni cupo, ni una sola llamada a Meta. |
| `IG_TOKEN_INICIAL` | Siembra el primer token. A partir de ahí manda Redis. |

### El trámite con Meta

App de tipo Business, producto Instagram, Instagram Login, permisos
`instagram_business_basic` e `instagram_business_content_publish`.

**Publicar en tu propia cuenta, con la app en modo desarrollo y @shonny con rol
en ella, no necesita revisión de Meta.** La revisión es para publicar en cuentas
de terceros. Hay que confirmarlo al montar la app; si se sostiene, esto está
en pie en una tarde en vez de en dos semanas.

## Lo que no se hace

- **Sticker de enlace.** Las docs de Meta, literal: *"the publishing of
  interactive stickers like polls, links, or locations is not available"*. Y
  desde el navegador tampoco se le puede adjuntar uno a lo que comparte el
  visitante — el flujo `instagram-stories://` con `contentURL` solo funciona
  desde apps nativas con App ID de Facebook. La dirección llegó a ir escrita en
  los píxeles y **se quitó después**: la imagen ya no dice de dónde salió, y el
  único camino de vuelta es el sticker de enlace que se le pone a mano en la app
  al publicar.
- **Formato 4:5 de feed.** Solo story 9:16. Es un parámetro de la misma
  plantilla el día que se quiera, no otra plantilla.
- **Cron ni cola.** Se publica a dedo, pieza a pieza.
- **Compartir desde la pantalla final.** El botón vive en la pieza abierta, que
  cubre pared y mural.

## Riesgos, al cerrar

1. ~~**El trazado de las fuentes en el bundle de la función.**~~ **Resuelto.**
   Turbopack se lleva el `.ttf` a `.next/server/assets/` y lo lista en el
   `.nft.json` de la ruta. Comprobado en el build y en producción.
2. ~~**El coste del render.**~~ **Resuelto, a costa del desenfoque.** Ver arriba.
3. **El modo desarrollo de la app de Meta**, que decide si la mitad de `/admin`
   tarda una tarde o dos semanas. **Sin resolver: es lo único que queda.**
4. **`NotAllowedError` en Safari real.** Las tres capas están diseñadas para
   ello, pero solo un iPhone de verdad lo confirma. El resto del botón sí está
   verificado en la página publicada.

## Verificación

No hay framework de test en el repo y no se monta uno para esto. Abrir
`/api/story/<id>` en el navegador es el bucle de desarrollo entero. Lista a mano:

- confesión de una línea y confesión de 140 caracteres
- una semilla (`s01`) y una pieza de la gente
- pieza retirada → 404, y la ruta purgada del CDN
- iPhone real: hoja de compartir e Instagram en la lista
- escritorio: descarga del JPEG
- publicar desde `/admin` y ver la story en la cuenta
- doble toque en el botón de publicar → una sola story

Lo que sale puro y aislado por si luego se quiere cubrir: `recortar(texto, tope)`
y la validación del id, que es la única puerta entre la URL y Redis.
