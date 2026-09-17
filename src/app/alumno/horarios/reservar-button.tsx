"use client";

import { useActionState } from "react";
import { hora12 } from "@/lib/horarios";
import { reservarClase, type ReservaFormState } from "./actions";

const initialState: ReservaFormState = { error: null };

export function SlotChip({
  fecha,
  horaInicio,
  horaFin,
  estado,
}: {
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: "disponible" | "reservado" | "bloqueado";
}) {
  const action = reservarClase.bind(null, fecha, horaInicio, horaFin);
  const [state, formAction, pending] = useActionState(action, initialState);

  if (estado !== "disponible") {
    return (
      <div className="rounded-xl border border-grafito/10 bg-grafito/[0.03] px-3 py-2.5 text-left">
        <p className="text-xs font-semibold text-grafito/40 leading-tight">
          {hora12(horaInicio.slice(0, 5))}–{hora12(horaFin.slice(0, 5))}
        </p>
        <p className="text-[10px] font-medium text-grafito/35 mt-1 uppercase tracking-wide">
          {estado === "bloqueado" ? "No disponible" : "Ocupado"}
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="contents">
      <button
        type="submit"
        disabled={pending}
        className="btn-press slot-chip glass rounded-xl text-grafito px-3 py-2.5 text-left disabled:opacity-60 group"
      >
        <p className="text-xs font-semibold leading-tight">
          {hora12(horaInicio.slice(0, 5))}–{hora12(horaFin.slice(0, 5))}
        </p>
        <p className="text-[10px] font-semibold mt-1 uppercase tracking-wide text-grafito/50 group-hover:text-crema">
          {pending ? "Reservando..." : "Disponible · Reservar"}
        </p>
        {state.error && (
          <p className="text-[11px] font-medium text-rojo group-hover:text-crema mt-1 normal-case">
            {state.error}
          </p>
        )}
      </button>
    </form>
  );
}
