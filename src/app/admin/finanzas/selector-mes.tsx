"use client";

import { useRouter } from "next/navigation";

export function SelectorMes({
  mes,
  opciones,
}: {
  mes: string;
  opciones: { valor: string; etiqueta: string }[];
}) {
  const router = useRouter();

  return (
    <label className="inline-flex items-center gap-2">
      <span className="sr-only">Mes</span>
      <select
        value={mes}
        onChange={(e) => router.push(`/admin/finanzas?mes=${e.target.value}`)}
        className="rounded-full border border-grafito/20 bg-white pl-4 pr-9 py-2 text-sm font-semibold text-grafito focus:outline-none focus:ring-2 focus:ring-rojo/30 focus:border-rojo"
      >
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.etiqueta}
          </option>
        ))}
      </select>
    </label>
  );
}
