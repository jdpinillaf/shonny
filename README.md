# shonny

Todo lo técnico de la artista **Shonny** en un solo sitio. Antes esto vivía partido:
la landing de un single en un repo suelto sin remoto, el sitio oficial en Wix, y los
datos en la cabeza de quien los tuviera a mano.

```
sitios/         lo desplegable
  colapsar/     landing del single "Colapsar" → colapsar.shonny.co
  oficial/      el home, si algún día sale de Wix
paquetes/
  escenografia/ el sistema visual: tokens, efectos, fuentes, piezas compartidas
  wix/          guiones contra las APIs de Wix (eventos, tienda, CMS)
datos/          la fuente de verdad: lanzamientos, eventos, enlaces
maquetas/       exploración de diseño en HTML plano, desechable a propósito
docs/           specs, decisiones, y el reparto de qué manda el código y qué el editor
```

## Empezar

```bash
npm install            # una sola vez, desde la raíz
npm run colapsar       # el museo en http://localhost:3000
npm run ver-maquetas   # las maquetas del home en http://localhost:8811
npm run maquetas       # recompila el CSS de las maquetas y se queda mirando
```

Las maquetas se sirven por HTTP en vez de abrirse con doble clic porque la página
de comparación las muestra dentro de iframes, y un navegador no deja que un
archivo `file://` cargue a otro.

Cada sitio necesita su `.env.local`, que **no** está en git. El de colapsar lleva
los tokens de Upstash Redis, Vercel Blob y el `ADMIN_TOKEN` del panel de moderación.

## Los dos mundos

El sitio oficial vive en **Wix** (www.shonny.co) y ahí hay una frontera que conviene
tener clara antes de tocar nada:

- **Se automatiza desde acá**: eventos, productos de la tienda, colecciones del CMS,
  datos del negocio. Eso son APIs, y `paquetes/wix` las maneja.
- **Solo se toca a mano en el editor de Wix**: el layout y los textos de las páginas.
  No hay API para eso. Las checklists de lo que hay que clickear viven en
  `docs/wix/manual/`.

`maquetas/` existe justo por esa frontera: se explora el diseño en HTML, se aprueba,
y después se reproduce a mano en el editor con la maqueta al lado.

## Convenciones

En `AGENTS.md`. La corta: todo en español, los comentarios explican por qué, y un
solo `package-lock.json` en la raíz.
