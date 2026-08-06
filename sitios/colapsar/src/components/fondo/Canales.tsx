"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { site } from "@/content/site";
import { entre, indice } from "@/lib/semilla";
import { cuadrosDeEstatica } from "./estatica";

/**
 * Los marcos. Coordenadas en % del viewport.
 *
 * El centro queda libre (ahí van la pregunta, el input y la card) y la franja
 * de arriba al centro también: es donde aterriza la nota que escribe la
 * persona, y es el único momento de la página en que algo tiene que leerse
 * sobre fondo limpio.
 */
type Marco = { id: string; x: string; y: string; w: string; h: string; movil: boolean };

const MARCOS: Marco[] = [
  { id: "a", x: "2%", y: "6%", w: "20vw", h: "30vh", movil: true },
  { id: "b", x: "13%", y: "56%", w: "17vw", h: "27vh", movil: false },
  { id: "c", x: "76%", y: "10%", w: "21vw", h: "32vh", movil: true },
  { id: "d", x: "80%", y: "58%", w: "18vw", h: "28vh", movil: false },
  { id: "f", x: "52%", y: "78%", w: "16vw", h: "24vh", movil: false },
];

const DURACION_CORTE = 150; // ms de estática al cambiar de canal

function Estatica({ activa }: { activa: boolean }) {
  const cuadros = useMemo(() => cuadrosDeEstatica(), []);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!activa || cuadros.length === 0) return;
    let raf = 0;
    const loop = () => {
      setTick((t) => t + 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [activa, cuadros.length]);

  if (!activa || cuadros.length === 0) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-20"
      style={{
        backgroundImage: `url(${cuadros[tick % cuadros.length]})`,
        backgroundSize: "180px 180px",
        opacity: 0.72,
      }}
    />
  );
}

function Canal({ marco, quieto }: { marco: Marco; quieto: boolean }) {
  const total = site.fotos.length;
  const [foto, setFoto] = useState(() => indice(marco.id, total));
  const [cortando, setCortando] = useState(false);

  // Cada marco lleva su propio reloj. Si compartieran uno, todos cortarían a la
  // vez y dejaría de parecer un cuarto con varios televisores prendidos.
  useEffect(() => {
    if (quieto) return;
    let corte: ReturnType<typeof setTimeout>;
    let siguiente: ReturnType<typeof setTimeout>;

    const programar = (ms: number) => {
      siguiente = setTimeout(() => {
        setCortando(true);
        corte = setTimeout(() => {
          setFoto((f) => (f + 1 + Math.floor(Math.random() * (total - 1))) % total);
          setCortando(false);
          programar(5600 + Math.random() * 6200);
        }, DURACION_CORTE);
      }, ms);
    };

    // La base por marco es fija para que nunca corten dos a la vez; el sumando
    // al azar evita que todas las visitas vean el mismo corte en el mismo
    // segundo (y que una captura de pantalla siempre agarre la misma estática).
    programar(entre(marco.id, 1800, 8200, 3) + Math.random() * 2600);
    return () => {
      clearTimeout(corte);
      clearTimeout(siguiente);
    };
  }, [marco.id, total, quieto]);

  return (
    <div
      className="scanlines absolute overflow-hidden"
      style={{
        left: marco.x,
        top: marco.y,
        width: marco.w,
        height: marco.h,
        minWidth: 128,
        minHeight: 168,
        boxShadow: "0 0 0 1px rgba(242,240,234,0.07), 0 30px 90px rgba(0,0,0,0.6)",
      }}
    >
      <div
        className="canal-img absolute inset-0"
        style={
          {
            "--dx": `${entre(marco.id, -22, 22, 1).toFixed(1)}px`,
            "--dy": `${entre(marco.id, -26, 26, 2).toFixed(1)}px`,
            "--dur": `${entre(marco.id, 24, 34, 4).toFixed(1)}s`,
            "--retardo": `-${entre(marco.id, 0, 20, 5).toFixed(1)}s`,
            // El roll horizontal del corte: la imagen se desplaza y se estira un
            // pelo, como cuando la señal pierde sincronía vertical.
            translate: cortando ? `${entre(marco.id, -14, 14, 6).toFixed(0)}px 0` : "0 0",
            scale: cortando ? "1.04 1.09" : "1 1",
            transition: cortando ? "none" : "translate 220ms ease-out, scale 220ms ease-out",
          } as React.CSSProperties
        }
      >
        <Image
          src={site.fotos[foto]}
          alt=""
          fill
          sizes="24vw"
          className="object-cover"
          style={{ filter: "grayscale(1) contrast(1.16) brightness(0.74)" }}
          priority={marco.id === "a" || marco.id === "c"}
        />
      </div>

      <Estatica activa={cortando} />

      {/* Viñeta: hunde los bordes para que el marco no se vea recortado con tijera. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-30"
        style={{
          background:
            "radial-gradient(120% 100% at 50% 45%, rgba(11,13,12,0) 40%, rgba(11,13,12,0.72) 100%)",
        }}
      />
    </div>
  );
}

export function Canales({ quieto }: { quieto: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
      {MARCOS.map((m) => (
        <div key={m.id} className={m.movil ? "" : "hidden md:block"}>
          <Canal marco={m} quieto={quieto} />
        </div>
      ))}
    </div>
  );
}
