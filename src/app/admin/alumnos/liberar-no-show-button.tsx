"use client";

import { useActionState } from "react";
import { liberarNoShow, type LiberarNoShowState } from "./actions";

const initialState: LiberarNoShowState = { error: null, ok: false };

export function LiberarNoShowButton({ reservaId }: { reservaId: string }) {
  const action = liberarNoShow.bind(null, reservaId);
  const [state, formAction, pending] = useActionState(action, initialState);

  if (state.ok) {
    return <span className="text-xs font-semibold text-green-500">Cupo liberado ✓</span>;
  }

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm("¿Perdonar esta inasistencia y liberarle el cupo?")) e.preventDefault();
      }}
    >
      <button
        type="submit"
        disabled={pending}
        className="text-xs font-semibold text-rojo hover:text-rojo-oscuro disabled:opacity-60"
      >
        {pending ? "Liberando..." : "Perdonar y liberar cupo"}
      </button>
      {state.error && <p className="text-[11px] text-rojo mt-0.5">{state.error}</p>}
    </form>
  );
}
