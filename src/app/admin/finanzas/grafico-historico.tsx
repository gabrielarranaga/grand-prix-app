"use client";

import { useEffect, useRef, useState } from "react";

export type PuntoHistorico = {
  mes: string;
  etiqueta: string; // "Sep 26"
  etiquetaLarga: string; // "Septiembre 2026"
  ingresos: number;
  egresos: number;
};

// Paleta validada (CVD, contraste y luminancia) contra el fondo claro de la
// app: azul para ingresos, el rojo de marca para egresos.
const SERIES = [
  { clave: "ingresos", nombre: "Ingresos", color: "#256abf" },
  { clave: "egresos", nombre: "Egresos", color: "#c1291f" },
] as const;

const ALTO = 240;
const MARGEN = { arriba: 16, derecha: 16, abajo: 28, izquierda: 52 };

const solesCorto = (n: number) =>
  n >= 1000 ? `S/ ${(n / 1000).toLocaleString("es-PE", { maximumFractionDigits: 1 })}k` : `S/ ${n}`;

const solesLargo = (n: number) =>
  n.toLocaleString("es-PE", { style: "currency", currency: "PEN", minimumFractionDigits: 2 });

// Escala "redonda" para el eje Y: 4 divisiones en numeros faciles de leer.
function escalaY(maximo: number) {
  if (maximo <= 0) return { tope: 1000, paso: 250 };
  const bruto = maximo / 4;
  const potencia = 10 ** Math.floor(Math.log10(bruto));
  const paso = [1, 2, 2.5, 5, 10].map((f) => f * potencia).find((p) => p >= bruto) ?? bruto;
  return { tope: paso * 4, paso };
}

export function GraficoHistorico({ puntos }: { puntos: PuntoHistorico[] }) {
  const contenedor = useRef<HTMLDivElement>(null);
  const [ancho, setAncho] = useState(640);
  const [activo, setActivo] = useState<number | null>(null);

  useEffect(() => {
    const el = contenedor.current;
    if (!el) return;
    const obs = new ResizeObserver(([entrada]) => setAncho(entrada.contentRect.width));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const maximo = Math.max(0, ...puntos.flatMap((p) => [p.ingresos, p.egresos]));
  const { tope, paso } = escalaY(maximo);
  const anchoPlot = Math.max(1, ancho - MARGEN.izquierda - MARGEN.derecha);
  const altoPlot = ALTO - MARGEN.arriba - MARGEN.abajo;
  const x = (i: number) =>
    MARGEN.izquierda + (puntos.length === 1 ? anchoPlot / 2 : (i / (puntos.length - 1)) * anchoPlot);
  const y = (v: number) => MARGEN.arriba + altoPlot - (v / tope) * altoPlot;
  const ticks = Array.from({ length: 5 }, (_, i) => i * paso);
  // En celular no entran las 12 etiquetas del eje X: se muestra una si, una no.
  const cadaCuanto = ancho < 480 ? 2 : 1;

  const punto = activo !== null ? puntos[activo] : null;

  return (
    <div>
      <div className="flex gap-5 mb-3" aria-hidden>
        {SERIES.map((s) => (
          <span key={s.clave} className="inline-flex items-center gap-2 text-xs font-medium text-grafito/70">
            <span className="h-0.5 w-4 rounded-full" style={{ background: s.color }} />
            {s.nombre}
          </span>
        ))}
      </div>

      <div ref={contenedor} className="relative">
        <svg
          width={ancho}
          height={ALTO}
          role="img"
          aria-label="Ingresos y egresos de los últimos 12 meses"
          className="block overflow-visible"
          onMouseLeave={() => setActivo(null)}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={MARGEN.izquierda}
                x2={ancho - MARGEN.derecha}
                y1={y(t)}
                y2={y(t)}
                stroke="currentColor"
                className="text-grafito/10"
                strokeDasharray={t === 0 ? undefined : "2 4"}
              />
              <text
                x={MARGEN.izquierda - 8}
                y={y(t)}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-grafito/45 text-[11px] tabular-nums"
              >
                {solesCorto(t)}
              </text>
            </g>
          ))}

          {puntos.map((p, i) =>
            i % cadaCuanto === (puntos.length - 1) % cadaCuanto ? (
              <text
                key={p.mes}
                x={x(i)}
                y={ALTO - 8}
                textAnchor="middle"
                className={`text-[11px] ${activo === i ? "fill-grafito font-semibold" : "fill-grafito/45"}`}
              >
                {p.etiqueta}
              </text>
            ) : null,
          )}

          {activo !== null && (
            <line
              x1={x(activo)}
              x2={x(activo)}
              y1={MARGEN.arriba}
              y2={MARGEN.arriba + altoPlot}
              stroke="currentColor"
              className="text-grafito/25"
            />
          )}

          {SERIES.map((s) => (
            <g key={s.clave}>
              <polyline
                points={puntos.map((p, i) => `${x(i)},${y(p[s.clave])}`).join(" ")}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {puntos.map((p, i) =>
                activo === i || (activo === null && i === puntos.length - 1) ? (
                  <circle
                    key={p.mes}
                    cx={x(i)}
                    cy={y(p[s.clave])}
                    r={4.5}
                    fill={s.color}
                    stroke="#faf9f8"
                    strokeWidth={2}
                  />
                ) : null,
              )}
            </g>
          ))}

          {/* Zonas de hover mas anchas que el punto, una por mes. */}
          {puntos.map((p, i) => {
            const mitad = puntos.length === 1 ? anchoPlot / 2 : anchoPlot / (puntos.length - 1) / 2;
            return (
              <rect
                key={p.mes}
                x={x(i) - mitad}
                y={MARGEN.arriba}
                width={mitad * 2}
                height={altoPlot}
                fill="transparent"
                onMouseEnter={() => setActivo(i)}
                onTouchStart={() => setActivo(i)}
              />
            );
          })}
        </svg>

        {punto && activo !== null && (
          <div
            className="pointer-events-none absolute top-0 z-10 rounded-xl border border-grafito/10 bg-white px-3 py-2.5 shadow-lg"
            style={{
              left: Math.min(Math.max(x(activo) + 12, 0), ancho - 170),
              width: 158,
            }}
          >
            <p className="text-xs font-semibold text-grafito mb-1.5">{punto.etiquetaLarga}</p>
            {SERIES.map((s) => (
              <p key={s.clave} className="flex items-center justify-between gap-3 text-xs text-grafito/70">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                  {s.nombre}
                </span>
                <span className="font-semibold text-grafito tabular-nums">{solesLargo(punto[s.clave])}</span>
              </p>
            ))}
            <p className="flex items-center justify-between gap-3 text-xs text-grafito/70 mt-1 pt-1 border-t border-grafito/10">
              <span>Utilidad</span>
              <span className="font-semibold text-grafito tabular-nums">
                {solesLargo(punto.ingresos - punto.egresos)}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Vista en tabla para lectores de pantalla. */}
      <table className="sr-only">
        <caption>Ingresos y egresos por mes</caption>
        <thead>
          <tr>
            <th>Mes</th>
            <th>Ingresos</th>
            <th>Egresos</th>
          </tr>
        </thead>
        <tbody>
          {puntos.map((p) => (
            <tr key={p.mes}>
              <td>{p.etiquetaLarga}</td>
              <td>{solesLargo(p.ingresos)}</td>
              <td>{solesLargo(p.egresos)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
