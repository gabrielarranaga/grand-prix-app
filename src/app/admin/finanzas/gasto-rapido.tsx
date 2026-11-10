"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { crearMovimiento, type FinanzasFormState } from "./actions";
import type { CategoriaFinanciera } from "@/lib/finanzas";

const initialState: FinanzasFormState = { error: null };

// Registrar un gasto en 3 toques desde el celular: categoria, monto,
// Guardar. La fecha es hoy; si hace falta otra fecha o una nota, esta el
// formulario completo mas abajo en Finanzas.
export function GastoRapido({ categorias, hoy }: { categorias: CategoriaFinanciera[]; hoy: string }) {
  const [state, formAction, pending] = useActionState(crearMovimiento, initialState);
  const [categoriaId, setCategoriaId] = useState<string | null>(null);
  const montoRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const egresos = categorias.filter((c) => c.tipo === "egreso" && c.activa);

  // Tras guardar se limpia el monto; la categoria se deselecciona al enviar.
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={(formData) => {
        setCategoriaId(null);
        formAction(formData);
      }}
      className="space-y-3"
    >
      <input type="hidden" name="tipo" value="egreso" />
      <input type="hidden" name="fecha" value={hoy} />
      <input type="hidden" name="categoria_id" value={categoriaId ?? ""} />

      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Tipo de gasto">
        {egresos.map((c) => (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={categoriaId === c.id}
            onClick={() => {
              setCategoriaId(c.id);
              montoRef.current?.focus();
            }}
            className={`btn-press rounded-full border px-4 py-2 text-sm font-semibold ${
              categoriaId === c.id
                ? "bg-grafito border-grafito text-white"
                : "border-grafito/20 bg-white text-grafito/75 hover:border-grafito/50"
            }`}
          >
            {c.nombre}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <label htmlFor="gasto-rapido-monto" className="sr-only">
          Monto en soles
        </label>
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-grafito/50 font-semibold">S/</span>
          <input
            ref={montoRef}
            id="gasto-rapido-monto"
            name="monto"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            required
            placeholder="0.00"
            className="w-full rounded-full border border-grafito/20 bg-white pl-10 pr-4 py-3 text-lg font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-rojo/30 focus:border-rojo"
          />
        </div>
        <button
          type="submit"
          disabled={pending || !categoriaId}
          className="btn-press glow-rojo rounded-full bg-rojo hover:bg-rojo-oscuro text-white font-semibold px-6 disabled:opacity-50"
        >
          {pending ? "..." : "Guardar"}
        </button>
      </div>

      {!categoriaId && !state.ok && <p className="text-xs text-grafito/50">Toca primero en qué gastaste.</p>}
      {state.error && <p className="text-sm text-rojo">{state.error}</p>}
      {state.ok && <p className="text-sm text-green-700 font-medium">Gasto guardado ✓</p>}
    </form>
  );
}
