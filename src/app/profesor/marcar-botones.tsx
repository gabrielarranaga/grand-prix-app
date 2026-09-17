"use client";

import { useActionState } from "react";
import { marcarClase, type MarcarFormState } from "./actions";

const initialState: MarcarFormState = { error: null };

export function MarcarBotones({
  reservaId,
  horarioId,
}: {
  reservaId: string;
  horarioId: string;
}) {
  const [stateOk, actionOk, pendingOk] = useActionState(
    marcarClase.bind(null, reservaId, horarioId, "completada"),
    initialState,
  );
  const [stateNo, actionNo, pendingNo] = useActionState(
    marcarClase.bind(null, reservaId, horarioId, "no_show"),
    initialState,
  );
  const [stateMio, actionMio, pendingMio] = useActionState(
    marcarClase.bind(null, reservaId, horarioId, "profesor_no_asistio"),
    initialState,
  );

  const pending = pendingOk || pendingNo || pendingMio;

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap justify-end gap-2">
        <form action={actionOk}>
          <button
            type="submit"
            disabled={pending}
            className="text-sm font-semibold text-green-500 hover:text-green-600 disabled:opacity-60 whitespace-nowrap"
          >
            {pendingOk ? "Guardando..." : "Completada"}
          </button>
        </form>
        <span className="text-grafito/20">·</span>
        <form action={actionNo}>
          <button
            type="submit"
            disabled={pending}
            className="text-sm font-medium text-rojo hover:text-rojo-oscuro disabled:opacity-60 whitespace-nowrap"
          >
            {pendingNo ? "Guardando..." : "No asistió (alumno)"}
          </button>
        </form>
        <span className="text-grafito/20">·</span>
        <form
          action={actionMio}
          onSubmit={(e) => {
            if (!confirm("¿No pudiste dar esta clase? Se le libera el cupo al alumno de inmediato."))
              e.preventDefault();
          }}
        >
          <button
            type="submit"
            disabled={pending}
            className="text-sm font-medium text-grafito/60 hover:text-grafito disabled:opacity-60 whitespace-nowrap"
          >
            {pendingMio ? "Guardando..." : "No pude asistir (yo)"}
          </button>
        </form>
      </div>
      {(stateOk.error || stateNo.error || stateMio.error) && (
        <p className="text-xs text-rojo max-w-[240px] text-right">
          {stateOk.error ?? stateNo.error ?? stateMio.error}
        </p>
      )}
    </div>
  );
}
