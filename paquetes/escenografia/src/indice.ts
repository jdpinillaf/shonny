/**
 * La puerta del paquete. Lo que no esté acá no se usa desde un sitio.
 *
 * Regla del repo: nada entra a escenografía hasta que tenga un segundo
 * consumidor. Un componente usado en un solo sitio no es compartido, es una API
 * diseñada contra un único caso de uso — que es como salen las APIs incómodas.
 */

export { azar, entre, indice, corrido, dentro } from "./semilla";
