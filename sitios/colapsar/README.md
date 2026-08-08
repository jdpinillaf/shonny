# COLAPSAR — Shonny

Bocetos de landing para el lanzamiento de **Colapsar**, de Shonny.

Concepto: **museo de cosas que nunca pasaron**. La página pregunta qué esperaste
que nunca llegó, guarda tu respuesta y te lleva al disco.

```
npm run dev     # http://localhost:3000
npm run build
```

Una sola ruta, `/`: televisores en blanco y negro que cortan de canal y notas de
papel colgadas de un chinche. Hubo dos bocetos más —el río y el cuarto oscuro—
y se descartaron; viven en el historial de git.

---

# El museo (`/`)

## Los tres actos

Una sola pantalla, sin scroll. Es una máquina de estados en `src/components/Museo.tsx`.

1. **pregunta** — la pregunta se teclea, después se dibuja el input.
2. **colapso** — la respuesta se cuelga en la pared, se teclea "Ven, acompáñame a colapsar".
3. **disco** — entra la card de Spotify y la portada pasa de gris a color.

Para revisar un acto sin repetir el flujo: `?acto=colapso` o `?acto=disco`.

## Dirección de arte

Todo el museo está en blanco y negro de televisor. **Lo único a color es el
disco**: el museo es lo que no pasó, la canción es lo único que sí existe.

Las fotos no son un collage quieto, son canales: derivan lento y cada tanto
cortan a otra foto con un golpe de estática. Cada marco lleva su propio reloj,
por eso nunca cortan a la vez.

Las ranuras de las notas (`fondo/MuroNotas.tsx`) están calzadas en los huecos
que dejan los televisores (`fondo/Canales.tsx`). Al mover un marco hay que
mover una ranura, si no las notas caen encima de las caras.

Bajo la placa va el recuento, **"24 cosas que nunca pasaron"**, con la cifra en
serif y grande y el resto de la frase pequeño al lado: es lo que lo separa de un
dato de pie de página y hace que se mire. La luz que lo recorre es `.cifra` en
`globals.css`, un degradado que se mueve recortado contra el texto con
`background-clip`. El número no es copy: son las notas de `content/notas.ts` más
las respuestas de esa persona, y sube al enviar.

## El mural

El recuento es la única puerta a la colección entera. Al hundirlo se abre
`components/mural/Mural.tsx`: la rejilla completa, dos columnas en móvil y
cuatro desde `md`, y se cierra con la `×`, con `Escape` o tocando afuera.

**El alto está cortado a propósito** — `max-h-[46vh] md:max-h-[56vh]` — para que
se vean unas tres filas en móvil y tres o cuatro en escritorio y la siguiente
asome por abajo. Si cupiera todo, el mural dejaría de parecer que tiene fondo y
no habría nada que explorar.

Las respuestas de la persona van primero, lo último arriba del todo. Después la
colección barajada.

Cuatro cosas que se rompen fácil:

- **`overscroll-contain` en el contenedor con scroll no es opcional.** `body`
  tiene `overflow: hidden` y sin eso el scroll que llega al final se lo lleva la
  página por detrás.
- **`NotaAbierta` va dentro del árbol del mural, no al lado.** Los dos viven en
  `z-[35]`, y entre hermanos del mismo z manda el orden del DOM.
- **El `Escape` del mural se calla mientras hay una nota abierta**, si no un solo
  toque cerraría las dos cosas.
- La celda se queda vacía hasta que termina el vuelo de vuelta (`onExitComplete`),
  igual que en la pared. Con un solo estado, la nota se ve dos veces mientras
  vuelve.

El papel en sí vive en `fondo/Papel.tsx` y lo pintan tanto la pared como el
mural. Está aparte porque los dos lo ponen en sitios muy distintos —uno absoluto
y colgando de un chinche, el otro en una celda— y el fondo, la tinta y el pie son
justo lo que se desincroniza a la tercera vez que se toca el copy.

## Móvil es otra maqueta, no la misma recortada

Escritorio reparte las notas en los huecos que dejan los televisores. **En móvil
es al revés: las notas van encima de las fotos.** Dos montones, arriba y abajo,
y el centro libre. Con las 7 por defecto salen **tres arriba y cuatro abajo** —
cinco abajo se apiñan— y por eso el orden de la tabla no es el de la pantalla.

Son dos tablas ordenadas de mejor a peor, `PIEZAS_MOVIL` en `fondo/Canales.tsx`
y `PAPELES_MOVIL` en `fondo/MuroNotas.tsx`, en el mismo orden: la ranura *n* cae
sobre el marco *n*. Al mover una hay que mover la otra. No hace falta z-index —
la pared vive en z-10 y los canales en z-0, así que el papel ya queda delante.

Para tantear la densidad hay dos parámetros, solo de móvil:

```
?fotos=N     0 a 6   (por defecto 5)
?notas=N     0 a 8   (por defecto 7)
```

Los defaults son `FOTOS_MOVIL` y `NOTAS_MOVIL`, exportados de cada fichero.

Tres cosas que se rompen fácil:

- **Comprobar siempre a 320x700, no a 375x812.** Los porcentajes son del alto
  del viewport, pero el papel mide en px y encima crece cuando la pantalla es
  estrecha, porque el texto se envuelve más. En la pantalla baja el centro sube
  y el papel baja a la vez, así que es ahí donde una nota se come la placa.
- **En el acto del disco el collage de móvil se apaga** (`ATENUAR`, en
  `Canales.tsx`). El bloque del disco baja hasta el 86% y le cae justo encima al
  montón de abajo: sin eso, el "COLAPSAR / SHONNY" es ilegible sobre una pila de
  papeles. Además cuenta bien lo que pasa ahí: el museo se apaga y queda la
  canción.
- **El velo de `Museo.tsx`** llega a 0.92 de negro en el centro y no se apaga
  hasta los bordes, así que todo lo que se acerque al medio se ve mucho más
  oscuro de lo que sugieren los porcentajes. Se mira con los ojos.

En móvil ya no queda fondo limpio donde aterriza la nota recién escrita. Se
apoya en que se pinta la última: dentro de z-10 manda el orden del DOM y el
papel es opaco, así que se lee encima del collage en vez de sobre negro.

Las dos listas se montan siempre y el CSS esconde una, así que un móvil también
pide las fotos de escritorio. El `display:none` no frena a un `<img>` lazy. Es
el precio de tener dos maquetas a mano en vez de una responsive.

## Abrir una nota

Las notas se pueden leer de cerca: al hacerles click se despegan de la pared,
vuelan al centro y se enderezan (`fondo/NotaAbierta.tsx`). Se cierran con la
`×`, con `Escape` o tocando afuera, y se vuelven a pegar en su ranura con su
misma inclinación.

El vuelo es un FLIP a mano y no un `layoutId` de motion: la nota de la pared
cuelga de la animación CSS `colgar`, así que una animación de layout mediría el
bounding box ya inclinado y entraría con un salto. Como el ángulo de reposo sale
de la semilla del texto, se conoce de antemano y se anima a cero explícitamente.

Tres cosas que se rompen fácil si se tocan:

- **Ni sombra animada ni `backdrop-filter`.** La sombra de la nota es fija y el
  telón es negro plano. Interpolar un `box-shadow` con 90px de blur repinta la
  sombra entera en cada fotograma, y filtrar el viewport completo mientras algo
  grande se mueve encima es lo más caro que puede hacer esta pantalla. Las dos
  cosas juntas son lo que hacía que el vuelo se sintiera a tirones.

- **La columna del centro es `pointer-events-none`** (`Museo.tsx`). Ocupa la
  pantalla entera; sin eso se come todos los clicks de la pared. Los eventos los
  reactiva solo el bloque de 860px del contenido, donde no cae ninguna ranura.
- **El hueco de la pared sigue vacío durante el vuelo de vuelta.** Por eso
  `MuroNotas` lleva dos estados: uno monta la nota grande y el otro apaga la de
  la pared, y este último no se limpia hasta el `onExitComplete`. Con uno solo,
  la nota se ve dos veces mientras vuelve.

## Qué se cambia sin tocar componentes

`src/content/site.ts` — artista, canción, la pregunta, la invitación, los links
de pre-save, rutas de portada y audio.

`src/content/notas.ts` — las notas de la pared. Hoy están escritas por AI; en
producción serían las respuestas reales de la gente.

## El sonido

`public/audio/colapsar-40s.mp3` son 40 segundos del master, del 0:50 al 1:30,
con fade de entrada y de salida para que el loop no chasquee. Para regenerarlo
desde otro punto:

```bash
ffmpeg -y -ss 50 -t 40 -i Colapsar_MASTER.wav \
  -af "afade=t=in:st=0:d=0.25,afade=t=out:st=39.2:d=0.8,loudnorm=I=-16:TP=-1.5:LRA=11" \
  -ar 44100 -ac 2 -codec:a libmp3lame -b:a 160k public/audio/colapsar-40s.mp3
```

La duración manda desde `ADELANTO`, en `src/content/site.ts`: de ahí salen el
nombre del archivo, la barra de la card y su etiqueta. Estuvieron los tres
escritos a mano y se desincronizaron a la primera. Si cambias el `-t`, cambia
`ADELANTO`; el fade de salida va siempre en `duración - 0.8`.

La canción tiene que sonar apenas entran. Chrome y Safari **bloquean el audio
con sonido hasta que la persona haga algún gesto en la página** y eso no se
puede saltar: un `autoplay` a secas falla en silencio. Así que `useSonido`
intenta arrancar al montar y, si lo rechazan, deja armado el primer gesto que
llegue —click, tecla, dedo o rueda, en cualquier parte de la página— para
encenderlo. En la práctica suena antes de que lleguen a escribir nada.

El botón de abajo a la derecha es para apagarla. Ojo con volver a llamar
`encender()` desde otros lados (por ejemplo al enviar la respuesta): le
revive la canción a quien la haya apagado a propósito.

Si el mp3 no está, el control no se dibuja y no se rompe nada.

---

# Pendientes

- **El link de pre-save.** `site.presave.spotify` y `.apple` apuntan a `#`.
  Hay que crear la campaña en Feature.fm / Presave.io / Linkfire desde la cuenta
  del distribuidor: Spotify solo aprueba pre-save propio a organizaciones, no a
  personas, así que no se puede armar desde acá.
- **En móvil casi no se puede tocar una foto.** El collage pone los papeles
  encima de los televisores a propósito, así que de cada marco solo queda
  tocable el borde: entre un 14% y un 33% según el marco, y el quinto (`m5`,
  tapado por `p7`) se queda en un 2%. En escritorio se tocan enteros. Arreglarlo
  es mover coordenadas del collage de móvil, que está ajustado a mano.

## La pared es de la gente

Lo que alguien escribe se publica para todos, y puede venir con una foto. Antes
vivía solo en su `localStorage`; ahora eso sigue pasando —y es lo que hace que
vea lo suyo al instante— pero además se manda a `POST /api/piezas`.

Una **pieza** (`src/content/pieza.ts`) es la unidad de todo: un `id`, un texto
opcional y una foto opcional. Una nota es una pieza sin foto, una foto de la
colección es una pieza sin texto, y lo que sube alguien puede traer las dos. Por
eso hay un solo modal (`PiezaAbierta`) y lo abren la pared, el mural y los
televisores.

**El `id` es la identidad, nunca el texto.** Lo era hasta que la pared se abrió:
dos personas escriben lo mismo y abrir una nota apagaba a su gemela, y una pieza
de solo foto entraba con la clave en `undefined`.

El camino del envío:

```
POST /api/piezas   →  responde 200 SIEMPRE, y dentro de after():
                      sniff de bytes → sharp (quita EXIF, acota, valida)
                      → presupuesto → moderar → Blob → Redis → revalidateTag
```

Tres cosas que no se pueden tocar:

- **Responde 200 pase lo que pase.** Rechazada, cortada por el rate limit o con
  el modelo caído: siempre lo mismo. Un 4xx delata dónde está el límite, y quien
  vino a tantearlo lo encuentra en tres intentos. El rechazo silencioso es el
  diseño.
- **El trabajo va en `after()`.** La persona ya está viendo el colapso y puede
  cerrar la pestaña; una petición abortada se lleva la invocación por delante.
- **`moderar()` falla cerrado.** Cualquier error devuelve `false`. Nada sin
  moderar llega a la pared.

Para retirar algo: `DELETE /api/piezas/<id>` con `authorization: Bearer
$ADMIN_TOKEN`.

Variables que hacen falta (`vercel env pull .env.local`):
`BLOB_READ_WRITE_TOKEN`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`,
`VERCEL_OIDC_TOKEN` (el gateway), y a mano `ADMIN_TOKEN`,
`NEXT_PUBLIC_BLOB_HOST` y opcionalmente `MODELO_MODERACION`.

Sin ninguna de ellas la página sigue en pie: `leerPiezas()` cae a las semillas.
Eso no es cortesía, es obligatorio — la página se prerrenderiza en `next build`.

Y la lectura va envuelta en `unstable_cache`: sin eso la ruta entera se vuelve
dinámica y cada visita gasta un comando de Redis.

## Fotos

Las de semilla son **ocho** y los cinco televisores las van rotando, así que se
repiten: cada canal las baraja con su propia semilla y corta en su propio
momento, por eso no se lee como repetición. Las que sube la gente entran al
mismo pool.

**Cuántos marcos hay es constante de maqueta; cuántas fotos hay es dato.** Las
ranuras de los papeles están puestas a mano encima de los marcos, uno a uno: si
el número de marcos pasara a depender de cuántas fotos haya, el collage de móvil
se deshace.

Las de `public/fotos/` son derivadas a 1400px de originales de 4000×6000.
Para regenerarlas desde una carpeta nueva:

```bash
i=1; for f in "/ruta/a/fotos"/*.jpg; do
  sips -s format jpeg -s formatOptions 72 -Z 1400 "$f" --out "public/fotos/$(printf %02d $i).jpg"
  i=$((i+1))
done
```
