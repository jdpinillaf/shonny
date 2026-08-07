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

Bajo la placa va el recuento, **"1.200 cosas que nunca pasaron"**, con la cifra
en serif y grande y el resto de la frase pequeño al lado: es lo que lo separa de
un dato de pie de página y hace que se mire. La luz que lo recorre es `.cifra` en
`globals.css`, un degradado que se mueve recortado contra el texto con
`background-clip`. El número sale de `site.coleccion` y **está puesto a mano**:
las respuestas viven en el `localStorage` de cada persona y no hay nada que las
sume. Cuando exista el backend, ese es el sitio donde enchufarlo.

## Móvil es otra maqueta, no la misma recortada

Escritorio reparte las notas en los huecos que dejan los televisores. **En móvil
es al revés: las notas van encima de las fotos.** Dos montones, arriba y abajo,
y el centro libre.

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

# Pendientes

- **El link de pre-save.** `site.presave.spotify` y `.apple` apuntan a `#`.
  Hay que crear la campaña en Feature.fm / Presave.io / Linkfire desde la cuenta
  del distribuidor: Spotify solo aprueba pre-save propio a organizaciones, no a
  personas, así que no se puede armar desde acá.
- **Las respuestas no se guardan en ningún servidor.** Viven en `localStorage`,
  o sea que cada persona ve la pared con lo suyo y nada más. Que la pared sea
  compartida es backend (almacenamiento + moderación) y es la fase siguiente.

## Fotos

Son **ocho** y los cinco televisores las van rotando, así que se repiten: cada
canal las baraja con su propia semilla y corta en su propio momento, por eso no
se lee como repetición.

Las de `public/fotos/` son derivadas a 1400px de originales de 4000×6000.
Para regenerarlas desde una carpeta nueva:

```bash
i=1; for f in "/ruta/a/fotos"/*.jpg; do
  sips -s format jpeg -s formatOptions 72 -Z 1400 "$f" --out "public/fotos/$(printf %02d $i).jpg"
  i=$((i+1))
done
```
