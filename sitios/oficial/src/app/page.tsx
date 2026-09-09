import { leerContenido, fuentes, esFuturo } from "@/lib/contenido";
import { Cabecera } from "@/componentes/Cabecera";
import { Portada } from "@/componentes/Portada";
import { Destacado } from "@/componentes/Destacado";
import { Cinta } from "@/componentes/Cinta";
import { Musica } from "@/componentes/Musica";
import { Universo } from "@/componentes/Universo";
import { Tienda } from "@/componentes/Tienda";
import { EnVivo } from "@/componentes/EnVivo";
import { Paraiso } from "@/componentes/Paraiso";
import { Pie } from "@/componentes/Pie";
import { Movimiento } from "@/componentes/Movimiento";

/**
 * Una sola pantalla de código para una sola página.
 *
 * Todo se arma en el servidor: el contenido llega ya resuelto —de Spotify, de
 * Wix o del repo— y los componentes no saben de dónde vino. La única isla de
 * cliente es `Movimiento`, que no pinta nada y solo agrega comportamiento.
 *
 * `revalidate` de cinco minutos: es lo que tarda en verse un anuncio nuevo
 * después de que ella lo enciende en Wix. Menos que eso es gastar llamadas a la
 * API en visitas que no cambian nada.
 */
export const revalidate = 300;

export default async function Home() {
  const c = await leerContenido();
  const de = fuentes();

  return (
    <>
      <Cabecera enlaces={c.enlaces} />

      <main>
        <Portada artista={c.artista} anuncio={c.anuncio} paraiso={c.paraiso} />
        <Destacado anuncio={c.anuncio} futuro={esFuturo(c.anuncio.fecha)} />
        <Cinta frases={c.sensorial} />
        <Musica canciones={c.canciones} deSpotify={de.spotify} />
        <Universo laminas={c.universo} />
        <Tienda prendas={c.tienda} />
        <EnVivo eventos={c.eventos} paraiso={c.paraiso.url} />
        <Paraiso paraiso={c.paraiso} />
      </main>

      <Pie enlaces={c.enlaces} />
      <Movimiento />
    </>
  );
}
