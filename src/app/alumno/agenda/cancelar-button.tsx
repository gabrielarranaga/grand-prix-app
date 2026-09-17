"use client";

import { useActionState } from "react";
import { cancelarReserva, type ReservaFormState } from "./actions";

const initialState: ReservaFormState = { error: null };

export function CancelarButton({ reservaId }: { reservaId: string }) {
  const action = cancelarReserva.bind(null, reservaId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm("¿Cancelar esta clase?")) e.preventDefault();
      }}
      className="flex flex-col items-end gap-1"
    >
      <button
        type="submit"
        disabled={pending}
        className="text-sm font-medium text-rojo hover:text-rojo-oscuro disabled:opacity-60 whitespace-nowrap"
      >
        {pending ? "Cancelando..." : "Cancelar"}
      </button>
      {state.error && (
        <p className="text-xs text-rojo max-w-[200px] text-right">{state.error}</p>
      )}
    </form>
  );
}
