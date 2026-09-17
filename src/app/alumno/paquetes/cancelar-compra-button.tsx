"use client";

import { useActionState } from "react";
import { cancelarMiCompra, type CancelarCompraState } from "./actions";

const initialState: CancelarCompraState = { error: null };

export function CancelarCompraButton({ compraId }: { compraId: string }) {
  const action = cancelarMiCompra.bind(null, compraId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm("¿Cancelar este paquete para elegir otro?")) e.preventDefault();
      }}
      className="mt-2"
    >
      <button
        type="submit"
        disabled={pending}
        className="text-sm font-semibold text-rojo hover:text-rojo-oscuro disabled:opacity-60 underline underline-offset-2"
      >
        {pending ? "Cancelando..." : "Cancelar y elegir otro paquete"}
      </button>
      {state.error && <p className="text-xs text-rojo mt-1">{state.error}</p>}
    </form>
  );
}
