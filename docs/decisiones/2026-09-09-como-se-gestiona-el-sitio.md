# Cómo se gestiona el sitio

**9 sep 2026**

## El problema

El sitio de Wix se desactualizó solo. El home destacaba un single de hace meses,
cuatro páginas seguían con el texto de plantilla y el pie decía © 2025. Nadie hizo
nada mal: **el sitio pedía trabajo manual y el trabajo manual no ocurre.**

Cualquier arquitectura que elijamos tiene que responder a eso antes que a nada.

## La decisión

**Que casi no haya que gestionarlo.** Tres niveles, por orden de cuánto trabajo le
cuestan a ella:

### 1. Lo que se actualiza solo — la música

El sitio lee su perfil de **Spotify** por API. Ella sube una canción a Spotify,
cosa que hace igual, y la sección de música se actualiza sin que nadie escriba un
título ni corrija un año.

Es exactamente el problema que tiene hoy: la discografía del sitio nunca va a
volver a estar vieja, porque no la mantiene nadie.

### 2. Lo que ella decide — Wix como panel

Wix tiene CMS con API de lectura headless: es un camino oficial de Wix, con
plantillas de Next incluidas. Se crean tres colecciones y ella entra a Wix —que ya
sabe usar y ya paga— a cambiar:

- **Anuncio**: qué se destaca arriba, con fecha, texto, imagen y un interruptor.
- **Fechas**: con Wix Events, que ya tiene instalado.
- **Textos y fotos**: el lema, la bio, las imágenes del universo.

*Por qué Wix y no Sanity o Notion:* son mejores herramientas y son **una
herramienta más**. Wix ya está pago, ya lo sabe usar y ya es donde vive la tienda.
El costo de aprender un CMS nuevo lo paga ella, no nosotros.

### 3. Lo que no se toca — la tienda

Tienda, checkout, reservas y miembros **se quedan en Wix**. Su checkout necesita su
propio dominio; reconstruirlo sería tirar plata y duplicar la fuente de verdad de
los precios.

## El reparto de dominio

| Dominio | Dónde | Qué |
|---|---|---|
| `shonny.co` y `www` | Vercel | El sitio |
| `tienda.shonny.co` | Wix | Tienda, checkout, reservas, miembros |
| `colapsar.shonny.co` | Vercel | La sala del single |

## El anuncio

Una sola entrada en el CMS enciende cuatro cosas: la barra de arriba, la franja de
lo nuevo con el reproductor, el botón de la portada y la pieza para stories que ya
existe construida en Colapsar.

Si la fecha del anuncio es futura, la misma entrada muestra cuenta regresiva y
pre-save en vez de reproductor. Un campo, cuatro lugares, cero código.

## Lo que cuesta

- **Vercel Pro, 20 USD/mes.** El plan Hobby prohíbe uso comercial y un sitio que
  vende merch lo es.
- **Wix**: el que ya paga. No sube.
- **Spotify API**: gratis. Hace falta crear una app en su dashboard de
  desarrollador para tener las credenciales.

## Los riesgos

1. **Si se cae la suscripción de Wix, el sitio se queda sin fuente de contenido.**
   Se mitiga cacheando la última respuesta buena y sirviéndola si la API falla,
   pero conviene saberlo antes y no después.
2. **La API de Spotify tiene límites de llamadas.** Se resuelve con revalidación
   cada hora, no en cada visita.
3. **Dos sistemas vivos.** Wix y Vercel tienen que estar los dos arriba. A cambio,
   ninguno hace el trabajo del otro.

## Cómo se construye

Todo el contenido pasa por **una sola capa** (`src/lib/contenido.ts`) que decide
de dónde sale cada cosa:

```
¿hay credenciales de Spotify? → la discografía sale de Spotify
¿hay API key de Wix?          → el anuncio, las fechas y los textos salen de Wix
en cualquier otro caso        → sale de datos/ versionado en el repo
```

Eso permite construir y desplegar **hoy**, sin esperar credenciales, y que el sitio
se encienda solo cuando lleguen. También significa que si un día ambas APIs fallan,
el sitio no se cae: muestra lo último que quedó escrito en el repo.
