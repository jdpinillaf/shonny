/**
 * Los tres shaders del río.
 *
 * El vértice no usa buffers: arma un triángulo que tapa la pantalla a partir de
 * gl_VertexID. Menos estado que mantener y una llamada de dibujo por pase.
 */
export const VERTICE = /* glsl */ `#version 300 es
out vec2 vUv;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

/**
 * Paso de simulación. Ecuación de onda discreta de toda la vida:
 *
 *   siguiente = (izq + der + arr + aba) / 2 - anterior
 *
 * El canal R guarda la altura de ahora y el G la del paso pasado, así una sola
 * textura lleva los dos estados que la ecuación necesita. La amortiguación es
 * lo que decide si el río se calma en tres segundos o queda hirviendo: por
 * encima de 0.99 nunca se aquieta.
 */
export const SIMULACION = /* glsl */ `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 color;

uniform sampler2D uEstado;
uniform vec2 uTexel;
uniform float uAmortiguacion;
uniform vec3 uGota;      // xy = centro en UV, z = fuerza (0 = sin gota)
uniform float uRadio;

void main() {
  if (vUv.x > 1.0 || vUv.y > 1.0) { color = vec4(0.0); return; }

  float h  = texture(uEstado, vUv).r;
  float hp = texture(uEstado, vUv).g;

  float izq = texture(uEstado, vUv - vec2(uTexel.x, 0.0)).r;
  float der = texture(uEstado, vUv + vec2(uTexel.x, 0.0)).r;
  float arr = texture(uEstado, vUv - vec2(0.0, uTexel.y)).r;
  float aba = texture(uEstado, vUv + vec2(0.0, uTexel.y)).r;

  float sig = (izq + der + arr + aba) * 0.5 - hp;
  sig *= uAmortiguacion;

  if (uGota.z != 0.0) {
    float d = distance(vUv, uGota.xy);
    sig += uGota.z * smoothstep(uRadio, 0.0, d);
  }

  color = vec4(sig, h, 0.0, 1.0);
}`;

/**
 * Pase de imagen. De la altura sale la normal, de la normal salen dos cosas:
 * el desplazamiento con que se muestrea el lecho —eso es la refracción, lo que
 * hace que las fotos se retuerzan bajo el agua— y el brillo especular de las
 * cáusticas.
 *
 * uCubrir corrige que el lecho es cuadrado y la pantalla no: sin eso las caras
 * salen estiradas en horizontal.
 */
export const IMAGEN = /* glsl */ `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 color;

uniform sampler2D uEstado;
uniform sampler2D uLecho;
uniform vec2 uTexel;
uniform vec2 uCubrir;
uniform vec2 uDeriva;
uniform float uRelieve;
uniform float uRefraccion;
uniform float uZoom;
uniform float uHondura;

const vec3 HONDO = vec3(0.020, 0.035, 0.055);
const vec3 TINTE = vec3(0.56, 0.79, 1.00);

void main() {
  float hx = texture(uEstado, vUv + vec2(uTexel.x, 0.0)).r
           - texture(uEstado, vUv - vec2(uTexel.x, 0.0)).r;
  float hy = texture(uEstado, vUv + vec2(0.0, uTexel.y)).r
           - texture(uEstado, vUv - vec2(0.0, uTexel.y)).r;

  vec3 n = normalize(vec3(-hx * uRelieve, -hy * uRelieve, 1.0));

  vec2 uv = (vUv - 0.5) * uCubrir * uZoom + 0.5 + uDeriva;
  uv += n.xy * uRefraccion;

  // textureLod con sesgo: el agua tiene cuerpo, y algo hundido se ve borroso.
  // Muestrear nítido delata que esto es una textura pegada detrás del vidrio.
  vec3 crudo = textureLod(uLecho, clamp(uv, 0.001, 0.999), uHondura).rgb;

  // Ya viene en gris del lecho, pero lo forzamos por si acaso y lo teñimos.
  float luma = dot(crudo, vec3(0.299, 0.587, 0.114));
  vec3 col = mix(HONDO, vec3(luma) * TINTE, 0.88);

  // Cáusticas: solo donde la superficie está inclinada hacia la luz.
  float esp = pow(max(dot(n, normalize(vec3(0.32, 0.46, 0.83))), 0.0), 46.0);
  col += esp * vec3(0.50, 0.74, 0.94);

  // Las crestas aclaran un pelo, los valles hunden. Da volumen al oleaje.
  float h = texture(uEstado, vUv).r;
  col += h * 0.16 * TINTE;

  float vineta = smoothstep(0.92, 0.18, distance(vUv, vec2(0.5)));
  col *= mix(0.16, 1.0, vineta);

  color = vec4(col, 1.0);
}`;
