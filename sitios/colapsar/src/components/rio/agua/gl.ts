/** Andamio mínimo de WebGL2 para la simulación de agua. */

export type Objetivo = { fbo: WebGLFramebuffer; tex: WebGLTexture };

function compilar(gl: WebGL2RenderingContext, tipo: number, fuente: string) {
  const sh = gl.createShader(tipo);
  if (!sh) return null;
  gl.shaderSource(sh, fuente);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.error("shader:", gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

export function crearPrograma(gl: WebGL2RenderingContext, vs: string, fs: string) {
  const v = compilar(gl, gl.VERTEX_SHADER, vs);
  const f = compilar(gl, gl.FRAGMENT_SHADER, fs);
  if (!v || !f) return null;

  const p = gl.createProgram();
  if (!p) return null;
  gl.attachShader(p, v);
  gl.attachShader(p, f);
  gl.linkProgram(p);
  gl.deleteShader(v);
  gl.deleteShader(f);

  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    console.error("programa:", gl.getProgramInfoLog(p));
    return null;
  }
  return p;
}

/**
 * Textura de altura del oleaje. NEAREST a propósito: el paso de simulación lee
 * los cuatro vecinos exactos, y con interpolación lineal el esquema se difumina
 * solo y las ondas se apagan antes de propagarse.
 */
export function crearObjetivo(
  gl: WebGL2RenderingContext,
  lado: number,
  interno: number,
  tipo: number,
): Objetivo | null {
  const tex = gl.createTexture();
  if (!tex) return null;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, interno, lado, lado, 0, gl.RGBA, tipo, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const fbo = gl.createFramebuffer();
  if (!fbo) return null;
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);

  const listo = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  if (!listo) return null;

  return { fbo, tex };
}

/** Textura del lecho: acá sí queremos LINEAR, se muestrea con UV desplazadas. */
export function crearTexturaLecho(gl: WebGL2RenderingContext, origen: HTMLCanvasElement) {
  const tex = gl.createTexture();
  if (!tex) return null;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, origen);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.generateMipmap(gl.TEXTURE_2D);
  return tex;
}
