# COLAPSAR — Shonny

Boceto de landing para el lanzamiento de **Colapsar**, de Shonny.

Concepto: **museo de cosas que nunca pasaron**. La página pregunta qué esperaste
que nunca llegó, cuelga tu respuesta en la pared y te lleva al disco.

```
npm run dev     # http://localhost:3000
npm run build
```

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

## Pendientes

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
