"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import {
  cambiarEstadoCategoria,
  crearCategoria,
  renombrarCategoria,
  type FinanzasFormState,
} from "../actions";
import type { CategoriaFinanciera, TipoMovimiento } from "@/lib/finanzas";

const initialState: FinanzasFormState = { error: null };

const INPUT =
  "flex-1 min-w-0 rounded-lg border border-grafito/20 bg-white px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-rojo/30 focus:border-rojo";

export function NuevaCategoriaForm({ tipo }: { tipo: TipoMovimiento }) {
  const [state, formAction, pending] = useActionState(crearCategoria, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction}>
      <input type="hidden" name="tipo" value={tipo} />
      <div className="flex gap-2">
        <input
          name="nombre"
          required
          maxLength={40}
          aria-label={`Nueva categoría de ${tipo}`}
          placeholder={tipo === "ingreso" ? "Nueva categoría de ingreso" : "Nueva categoría de egreso"}
          className={INPUT}
        />
        <button
          type="submit"
          disabled={pending}
          className="btn-press shrink-0 rounded-full bg-rojo hover:bg-rojo-oscuro text-white text-sm font-semibold px-4 transition-colors disabled:opacity-60"
        >
          {pending ? "..." : "Agregar"}
        </button>
      </div>
      {state.error && <p className="text-xs text-rojo mt-1.5">{state.error}</p>}
    </form>
  );
}

export function CategoriaFila({ categoria }: { categoria: CategoriaFinanciera }) {
  const [editando, setEditando] = useState(false);
  // Se cierra la edicion dentro de la misma accion (no en un efecto) para
  // no provocar un render extra.
  const [state, formAction, pending] = useActionState(
    async (prev: FinanzasFormState, formData: FormData) => {
      const resultado = await renombrarCategoria(categoria.id, prev, formData);
      if (resultado.ok) setEditando(false);
      return resultado;
    },
    initialState,
  );
  const [cambiando, startTransition] = useTransition();

  if (editando) {
    return (
      <li className="py-3">
        <form action={formAction} className="flex gap-2">
          <input
            name="nombre"
            required
            maxLength={40}
            defaultValue={categoria.nombre}
            aria-label="Nombre de la categoría"
            autoFocus
            className={INPUT}
          />
          <button
            type="submit"
            disabled={pending}
            className="text-sm font-semibold text-rojo hover:text-rojo-oscuro disabled:opacity-60"
          >
            {pending ? "..." : "Guardar"}
          </button>
          <button
            type="button"
            onClick={() => setEditando(false)}
            className="text-sm text-grafito/50 hover:text-grafito"
          >
            Cancelar
          </button>
        </form>
        {state.error && <p className="text-xs text-rojo mt-1.5">{state.error}</p>}
      </li>
    );
  }

  return (
    <li className={`py-3 flex items-center gap-3 ${cambiando ? "opacity-50" : ""}`}>
      <span className={`flex-1 text-sm ${categoria.activa ? "text-grafito" : "text-grafito/40 line-through"}`}>
        {categoria.nombre}
      </span>
      {categoria.activa && (
        <button
          type="button"
          onClick={() => setEditando(true)}
          className="text-xs font-semibold text-grafito/60 hover:text-rojo"
        >
          Renombrar
        </button>
      )}
      <button
        type="button"
        onClick={() => startTransition(() => cambiarEstadoCategoria(categoria.id, !categoria.activa))}
        className="text-xs font-semibold text-grafito/60 hover:text-rojo"
      >
        {categoria.activa ? "Archivar" : "Reactivar"}
      </button>
    </li>
  );
}
