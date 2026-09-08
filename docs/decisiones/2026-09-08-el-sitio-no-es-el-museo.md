# El sitio no es el museo

**8 sep 2026**

## Qué pasó

Las tres primeras maquetas del home (museo permanente, cartelera, señal) se
construyeron en el lenguaje visual de *Colapsar*: blanco y negro de televisor sobre
fondo casi negro, estructura de museo, notas de papel colgadas. Se eligió ese camino
antes de que apareciera el documento de ADN de marca.

El ADN lo prohíbe en dos renglones textuales, en la página de LÍMITES:

> Nada demasiado oscuro, gótico
> Nada deprimente, mood de la Sad Girl

Y describe lo contrario en el universo sensorial: atardecer, bruma de la mañana,
rayos de sol entre la vegetación, fruta recién cortada, seda y gasa, el romper de las
olas, voces celestiales femeninas. Los referentes son Sade, Kali Uchis, FKA Twigs,
Silvana Estrada. La comunidad se llama *las aves del paraíso*, y hay una foto de ella
con una flor de ave del paraíso que es la marca hecha imagen.

Las tres maquetas eran buenas piezas en el idioma equivocado.

## La decisión

**Un lanzamiento es una estación; el sitio es el lugar.**

- El museo blanco y negro se queda donde ya está y donde funciona:
  `colapsar.shonny.co`, la sala de un single. Es una exposición temporal y puede ser
  todo lo melancólica que la canción pida, porque la canción es sobre eso.
- El sitio de la artista toma el idioma del ADN: rosa polvo, arcilla, naranja de la
  flor, tinta marrón, y un solo registro nocturno —violeta con sangre— reservado para
  El Paraíso y el en vivo.

Eso también resuelve un problema que las tres primeras tenían y que no era de color:
**abrían con el nombre del single en tamaño gigante**. Un sitio así hay que rehacerlo
en cada lanzamiento. En la maqueta 04 el nombre grande es el de ella y el lanzamiento
entra como una línea que se cambia sin tocar el diseño.

## Consecuencias

- `paquetes/escenografia/estilos/tema.css` pasa a ser, de hecho, **el tema de
  Colapsar**: blanco y negro de televisor. Conviene renombrarlo a `colapsar.css` el
  día que se toque, para que nadie lo importe pensando que es "el tema de la marca".
- `paquetes/escenografia/estilos/paraiso.css` es el tema de la artista.
- Los dos definían `--color-terracota` con valores distintos. Se renombró el del
  paraíso a `--color-arcilla`: dos temas en el mismo CSS con un token del mismo
  nombre significa que gana el último import, y eso es un bug que aparece meses
  después y en una sola página.
- Las tres primeras maquetas **se conservan** en `maquetas/`, marcadas como fuera del
  ADN. Sirven de registro: la próxima vez que aparezca la tentación de vestir el
  sitio con la ropa de un single, ahí está lo que pasa.
- La estructura también cambió, no solo el color: el ADN pide mostrarla como artista
  más allá de la música (danza, audiovisual) y construir comunidad. Por eso la
  maqueta 04 tiene una sala de universo audiovisual y El Paraíso cierra el sitio en
  vez de vivir en el pie de página.
