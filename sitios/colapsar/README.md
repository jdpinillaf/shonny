# COLAPSAR — Shonny

Bocetos de landing para el lanzamiento de **Colapsar**, de Shonny.

Concepto: **museo de cosas que nunca pasaron**. La página pregunta qué esperaste
que nunca llegó, guarda tu respuesta y te lleva al disco.

```
npm run dev     # http://localhost:3000
npm run build
```

**Son dos landings, no una.** Comparten fotos, audio, portada, textos y toda la
card de Spotify — cambiar la canción o el link de pre-save actualiza las dos.

| Ruta | Landing | Qué es |
|---|---|---|
| `/` | **#1 · El museo** | Televisores en blanco y negro que cortan de canal, notas de papel colgadas de un chinche |
| `/rio` | **#2 · El río** | Una gota cae, de las ondas se forma la pregunta y todo flota bajo el agua, en azul |

---

# Landing #1 — el museo (`/`)

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

## Qué se cambia sin tocar componentes

`src/content/site.ts` — artista, canción, la pregunta, la invitación, los links
de pre-save, rutas de portada y audio.

`src/content/notas.ts` — las notas de la pared. Hoy están escritas por AI; en
producción serían las respuestas reales de la gente.

## El sonido

`public/audio/colapsar-15s.mp3` son 15 segundos del master, del 0:50 al 1:05,
con fade de entrada y de salida para que el loop no chasquee. Para regenerarlo
desde otro punto:

```bash
ffmpeg -y -ss 50 -t 15 -i Colapsar_MASTER.wav \
  -af "afade=t=in:st=0:d=0.25,afade=t=out:st=14.2:d=0.8,loudnorm=I=-16:TP=-1.5:LRA=11" \
  -ar 44100 -ac 2 -codec:a libmp3lame -b:a 160k public/audio/colapsar-15s.mp3
```

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

# Landing #2 — el río (`/rio`)

Una gota cae sobre el agua. De esas ondas se forma la pregunta, después sale el
input, y adentro del agua flotan las fotos y las notas. El mouse hace dos cosas
a la vez: mueve las cartas y agita la superficie. Mismo blanco y negro que la
#1, con azul.

Misma máquina de estados (`rio/Escena.tsx`), mismos atajos `?acto=`, mismo
acto final: `<Disco />` sin tocar, para que las dos compitan en igualdad.

## Cómo está hecha el agua

**Simulación en WebGL2** (`rio/agua/`), ping-pong entre dos FBO con la ecuación
de onda de siempre: `siguiente = (izq+der+arr+aba)/2 - anterior`, amortiguada.
El canal R guarda la altura de ahora y el G la del paso pasado.

Del gradiente de altura sale la normal, y de la normal salen dos cosas: el
desplazamiento con que se muestrea el lecho —eso es la refracción, lo que
retuerce las fotos— y el brillo de las cáusticas.

**El lecho** (`rio/agua/lecho.ts`) es un canvas de 2048² armado **una sola vez**
con las fotos en gris, cada pieza con los bordes difuminados. Se sube como
textura y el movimiento sale gratis paneando las UV en el shader. Redibujarlo
por frame serían megas de subida a la GPU sesenta veces por segundo.

Tres cosas que no son obvias y conviene no deshacer:

- **La lluvia de fondo** (`Agua.tsx`). Con la amortiguación en 0.984 las ondas
  de la gota mueren en segundos: si nadie mueve el mouse, el agua queda como un
  vidrio. Unas gotitas al azar cada ~500ms la mantienen viva.
- **Las cáusticas van ENCIMA de las notas** (`Causticas.tsx`). El shader
  refracta las fotos, pero las notas son DOM y el agua no las toca. Sin esa luz
  pasándoles por arriba se ven pegadas sobre el río en vez de hundidas.
- **Los bordes difuminados de cada pieza del lecho.** Dibujadas derechas, las
  fotos dejan rectángulos con esquinas duras y el fondo se lee como un collage
  con filtro azul encima.

**Plan B**: si el navegador no da WebGL2 con render a float, entra
`RioSinAgua.tsx` — mismo lecho en azul y desenfocado con un par de anillos de
onda. El guion no cambia en nada.

## Probarla

WebGL no se puede revisar con `/browse`: corre headless sin GPU y siempre cae
al plan B (útil para verificar justamente eso). Para ver el agua hay que usar
Chrome de verdad o puppeteer headed.

---

# Pendientes (las dos landings)

- **El link de pre-save.** `site.presave.spotify` y `.apple` apuntan a `#`.
  Hay que crear la campaña en Feature.fm / Presave.io / Linkfire desde la cuenta
  del distribuidor: Spotify solo aprueba pre-save propio a organizaciones, no a
  personas, así que no se puede armar desde acá.
- **Las respuestas no se guardan en ningún servidor.** Viven en `localStorage`,
  o sea que cada persona ve la pared con lo suyo y nada más. Que la pared sea
  compartida es backend (almacenamiento + moderación) y es la fase siguiente.

## Fotos

Las de `public/fotos/` son derivadas a 1400px de originales de 4000×6000.
Para regenerarlas desde una carpeta nueva:

```bash
i=1; for f in "/ruta/a/fotos"/*.jpg; do
  sips -s format jpeg -s formatOptions 72 -Z 1400 "$f" --out "public/fotos/$(printf %02d $i).jpg"
  i=$((i+1))
done
```
