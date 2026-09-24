"use client";

import { useState, useTransition } from "react";
import { borrarMovimiento } from "./actions";
import { MovimientoForm } from "./movimiento-form";
import { soles, type CategoriaFinanciera, type MovimientoFinanciero } from "@/lib/finanzas";

export function MovimientoFila({
  movimiento,
  categoria,
  categorias,
  hoy,
}: {
  movimiento: MovimientoFinanciero;
  categoria: string;
  categorias: CategoriaFinanciera[];
  hoy: string;
}) {
  const [editando, setEditando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [pending, startTransition] = useTransition();

  const [, mes, dia] = movimiento.fecha.split("-");
  const esIngreso = movimiento.tipo === "ingreso";

  if (editando) {
    return (
      <li className="py-4">
        <MovimientoForm
          categorias={categorias}
          hoy={hoy}
          movimiento={movimiento}
          onListo={() => setEditando(false)}
        />
      </li>
    );
  }

  return (
    <li className={`py-3.5 flex items-start gap-4 ${pending ? "opacity-50" : ""}`}>
      <span className="w-11 shrink-0 text-xs font-semibold text-grafito/50 tabular-nums pt-0.5">
        {dia}/{mes}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-grafito">
          {categoria}
          {movimiento.compra_id && (
            <span className="ml-2 rounded-full bg-grafito/5 px-2 py-0.5 text-[11px] font-medium text-grafito/50">
              desde Pagos
            </span>
          )}
        </p>
        {movimiento.notas && <p className="text-xs text-grafito/55 mt-0.5 truncate">{movimiento.notas}</p>}
        <div className="flex gap-4 mt-1.5">
          {confirmando ? (
            <>
              <span className="text-xs text-grafito/60">¿Borrar este movimiento?</span>
              <button
                type="button"
                onClick={() => startTransition(() => borrarMovimiento(movimiento.id))}
                className="text-xs font-semibold text-rojo hover:text-rojo-oscuro"
              >
                Sí, borrar
              </button>
              <button
                type="button"
                onClick={() => setConfirmando(false)}
                className="text-xs font-semibold text-grafito/60 hover:text-grafito"
              >
                No
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setEditando(true)}
                className="text-xs font-semibold text-grafito/60 hover:text-rojo"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => setConfirmando(true)}
                className="text-xs font-semibold text-grafito/60 hover:text-rojo"
              >
                Borrar
              </button>
            </>
          )}
        </div>
      </div>
      <span
        className={`shrink-0 text-sm font-semibold tabular-nums ${esIngreso ? "text-grafito" : "text-rojo"}`}
      >
        {esIngreso ? "+" : "−"} {soles(movimiento.monto)}
      </span>
    </li>
  );
}
