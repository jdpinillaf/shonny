"use client";

import { useEffect, useImperativeHandle, useRef, type Ref } from "react";
import { crearObjetivo, crearPrograma, crearTexturaLecho, type Objetivo } from "./gl";
import { construirLecho } from "./lecho";
import { IMAGEN, SIMULACION, VERTICE } from "./shaders";

export type AguaApi = {
  /** x,y en 0..1 con origen arriba a la izquierda, como el DOM. */
  salpicar: (x: number, y: number, fuerza: number) => void;
};

type Props = {
  ref?: Ref<AguaApi>;
  /** Se llama si el navegador no da WebGL2 con render a float. */
  onSinAgua?: () => void;
  quieto?: boolean;
};

const MAX_PASOS = 4;

export function Agua({ ref, onSinAgua, quieto = false }: Props) {
  const lienzo = useRef<HTMLCanvasElement>(null);
  const cola = useRef<{ x: number; y: number; f: number }[]>([]);

  useImperativeHandle(ref, () => ({
    salpicar: (x, y, f) => {
      // Máximo un puñado en vuelo: si el puntero corre, encolar cien gotas solo
      // gasta pasos de simulación que nadie llega a ver.
      if (cola.current.length > 8) return;
      cola.current.push({ x, y: 1 - y, f });
    },
  }));

  useEffect(() => {
    const cv = lienzo.current;
    if (!cv) return;

    const gl = cv.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "high-performance",
    });

    // Render a textura de coma flotante. Con 8 bits la altura se escalona y la
    // normal sale a saltos: la refracción se ve como facetas de vidrio roto.
    if (!gl || !gl.getExtension("EXT_color_buffer_float")) {
      onSinAgua?.();
      return;
    }

    const progSim = crearPrograma(gl, VERTICE, SIMULACION);
    const progImg = crearPrograma(gl, VERTICE, IMAGEN);
    if (!progSim || !progImg) {
      onSinAgua?.();
      return;
    }

    const movil = window.innerWidth < 768;
    const LADO = movil ? 256 : 512;

    let a = crearObjetivo(gl, LADO, gl.RGBA16F, gl.HALF_FLOAT);
    let b = crearObjetivo(gl, LADO, gl.RGBA16F, gl.HALF_FLOAT);
    if (!a || !b) {
      onSinAgua?.();
      return;
    }

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const uSim = {
      estado: gl.getUniformLocation(progSim, "uEstado"),
      texel: gl.getUniformLocation(progSim, "uTexel"),
      amort: gl.getUniformLocation(progSim, "uAmortiguacion"),
      gota: gl.getUniformLocation(progSim, "uGota"),
      radio: gl.getUniformLocation(progSim, "uRadio"),
    };
    const uImg = {
      estado: gl.getUniformLocation(progImg, "uEstado"),
      lecho: gl.getUniformLocation(progImg, "uLecho"),
      texel: gl.getUniformLocation(progImg, "uTexel"),
      cubrir: gl.getUniformLocation(progImg, "uCubrir"),
      deriva: gl.getUniformLocation(progImg, "uDeriva"),
      relieve: gl.getUniformLocation(progImg, "uRelieve"),
      refraccion: gl.getUniformLocation(progImg, "uRefraccion"),
      zoom: gl.getUniformLocation(progImg, "uZoom"),
      hondura: gl.getUniformLocation(progImg, "uHondura"),
    };

    let texLecho: WebGLTexture | null = null;
    let vivo = true;

    construirLecho().then((cnv) => {
      if (!vivo || !cnv) return;
      texLecho = crearTexturaLecho(gl, cnv);
    });

    const medir = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, movil ? 1.5 : 2);
      cv.width = Math.round(window.innerWidth * dpr);
      cv.height = Math.round(window.innerHeight * dpr);
    };
    medir();
    window.addEventListener("resize", medir);

    const paso = (gota: { x: number; y: number; f: number } | null) => {
      const origen = a as Objetivo;
      const destino = b as Objetivo;

      gl.bindFramebuffer(gl.FRAMEBUFFER, destino.fbo);
      gl.viewport(0, 0, LADO, LADO);
      gl.useProgram(progSim);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, origen.tex);
      gl.uniform1i(uSim.estado, 0);
      gl.uniform2f(uSim.texel, 1 / LADO, 1 / LADO);
      gl.uniform1f(uSim.amort, quieto ? 0.955 : 0.984);
      gl.uniform1f(uSim.radio, gota && gota.f > 0.4 ? 0.055 : 0.022);
      if (gota) gl.uniform3f(uSim.gota, gota.x, gota.y, gota.f);
      else gl.uniform3f(uSim.gota, 0, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      // El destino pasa a ser el origen del próximo paso.
      const tmp = a;
      a = b;
      b = tmp;
    };

    let raf = 0;
    let proximaLluvia = 0;

    const dibujar = (t: number) => {
      if (!vivo) return;

      // Un río no se queda quieto. Con la amortiguación en 0.984 las ondas de
      // la gota mueren en unos segundos y, si nadie mueve el mouse, el agua
      // queda como un vidrio. Estas gotitas mantienen la superficie viva.
      if (!quieto && t > proximaLluvia) {
        cola.current.push({
          x: Math.random(),
          y: Math.random(),
          f: 0.045 + Math.random() * 0.05,
        });
        proximaLluvia = t + 340 + Math.random() * 620;
      }

      const pasos = Math.max(1, Math.min(cola.current.length, MAX_PASOS));
      for (let i = 0; i < pasos; i++) paso(cola.current.shift() ?? null);

      if (texLecho) {
        const w = cv.width;
        const h = cv.height;
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, w, h);
        gl.useProgram(progImg);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, (a as Objetivo).tex);
        gl.uniform1i(uImg.estado, 0);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, texLecho);
        gl.uniform1i(uImg.lecho, 1);

        gl.uniform2f(uImg.texel, 1 / LADO, 1 / LADO);
        // Textura cuadrada sobre pantalla que no lo es: se recorta el lado largo.
        gl.uniform2f(uImg.cubrir, w > h ? 1 : w / h, w > h ? h / w : 1);
        gl.uniform2f(
          uImg.deriva,
          Math.sin(t * 0.000045) * 0.035,
          Math.cos(t * 0.000037) * 0.035,
        );
        gl.uniform1f(uImg.relieve, 74);
        gl.uniform1f(uImg.refraccion, 0.1);
        gl.uniform1f(uImg.zoom, 0.82);
        gl.uniform1f(uImg.hondura, 1.2);

        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }

      raf = requestAnimationFrame(dibujar);
    };
    raf = requestAnimationFrame(dibujar);

    const alCambiarVisibilidad = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && vivo) raf = requestAnimationFrame(dibujar);
    };
    document.addEventListener("visibilitychange", alCambiarVisibilidad);

    return () => {
      vivo = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", medir);
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
    };
  }, [onSinAgua, quieto]);

  return (
    <canvas
      ref={lienzo}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
    />
  );
}
