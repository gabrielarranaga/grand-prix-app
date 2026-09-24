"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  crearMovimiento,
  editarMovimiento,
  type FinanzasFormState,
} from "./actions";
import type { CategoriaFinanciera, MovimientoFinanciero, TipoMovimiento } from "@/lib/finanzas";

const initialState: FinanzasFormState = { error: null };

const INPUT =
  "w-full rounded-lg border border-grafito/20 bg-white px-3.5 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-rojo/30 focus:border-rojo";

export function MovimientoForm({
  categorias,
  hoy,
  movimiento,
  onListo,
}: {
  categorias: CategoriaFinanciera[];
  hoy: string;
  movimiento?: MovimientoFinanciero;
  onListo?: () => void;
}) {
  const accion = movimiento ? editarMovimiento.bind(null, movimiento.id) : crearMovimiento;
  const [state, formAction, pending] = useActionState(accion, initialState);
  const [tipo, setTipo] = useState<TipoMovimiento>(movimiento?.tipo ?? "ingreso");
  const formRef = useRef<HTMLFormElement>(null);

  // Tras guardar: el formulario de alta se limpia para cargar el siguiente
  // (conserva ingreso/egreso, lo usual es cargar varios del mismo tipo
  // seguidos); el de edicion se cierra.
  useEffect(() => {
    if (!state.ok) return;
    if (movimiento) {
      onListo?.();
    } else {
      formRef.current?.reset();
    }
  }, [state, movimiento, onListo]);

  // Una categoria archivada solo aparece si es la que ya tiene este movimiento.
  const opciones = categorias.filter(
    (c) => c.tipo === tipo && (c.activa || c.id === movimiento?.categoria_id),
  );

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="grid grid-cols-2 gap-2 rounded-full bg-grafito/5 p-1" role="radiogroup">
        {(["ingreso", "egreso"] as const).map((t) => (
          <label
            key={t}
            className={`btn-press cursor-pointer rounded-full py-2 text-center text-sm font-semibold transition-colors ${
              tipo === t ? "bg-white text-grafito shadow-sm" : "text-grafito/50 hover:text-grafito"
            }`}
          >
            <input
              type="radio"
              name="tipo"
              value={t}
              checked={tipo === t}
              onChange={() => setTipo(t)}
              className="sr-only"
            />
            {t === "ingreso" ? "Ingreso" : "Egreso"}
          </label>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor={`categoria-${movimiento?.id ?? "nuevo"}`} className="block text-sm font-medium text-grafito mb-1.5">
            Categoría
          </label>
          <select
            key={tipo}
            id={`categoria-${movimiento?.id ?? "nuevo"}`}
            name="categoria_id"
            required
            defaultValue={movimiento?.tipo === tipo ? movimiento.categoria_id : ""}
            className={INPUT}
          >
            <option value="" disabled>
              Elige una…
            </option>
            {opciones.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`monto-${movimiento?.id ?? "nuevo"}`} className="block text-sm font-medium text-grafito mb-1.5">
            Monto (S/)
          </label>
          <input
            id={`monto-${movimiento?.id ?? "nuevo"}`}
            name="monto"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            required
            defaultValue={movimiento?.monto}
            placeholder="0.00"
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor={`fecha-${movimiento?.id ?? "nuevo"}`} className="block text-sm font-medium text-grafito mb-1.5">
            Fecha
          </label>
          <input
            id={`fecha-${movimiento?.id ?? "nuevo"}`}
            name="fecha"
            type="date"
            required
            defaultValue={movimiento?.fecha ?? hoy}
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor={`notas-${movimiento?.id ?? "nuevo"}`} className="block text-sm font-medium text-grafito mb-1.5">
            Nota <span className="text-grafito/40 font-normal">(opcional)</span>
          </label>
          <input
            id={`notas-${movimiento?.id ?? "nuevo"}`}
            name="notas"
            type="text"
            maxLength={200}
            defaultValue={movimiento?.notas ?? ""}
            placeholder="Ej: Grifo Primax, tanque lleno"
            className={INPUT}
          />
        </div>
      </div>

      {state.error && <p className="text-sm text-rojo">{state.error}</p>}
      {state.ok && !movimiento && <p className="text-sm text-green-600">Guardado ✓</p>}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="btn-press glow-rojo rounded-full bg-rojo hover:bg-rojo-oscuro text-white font-semibold px-6 py-2.5 transition-colors disabled:opacity-60"
        >
          {pending ? "Guardando..." : movimiento ? "Guardar cambios" : "Registrar"}
        </button>
        {movimiento && (
          <button
            type="button"
            onClick={onListo}
            className="text-sm font-semibold text-grafito/60 hover:text-grafito"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
