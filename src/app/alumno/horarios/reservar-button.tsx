"use client";

import { useActionState, useState } from "react";
import { hora12 } from "@/lib/horarios";
import { reservarClase, type ReservaFormState } from "./actions";

const initialState: ReservaFormState = { error: null };

// Una franja del dia elegido. Tocarla no reserva al instante: primero pide
// confirmar ("¿Reservas el martes 10:00 a.m.?"), para que nadie gaste una
// clase de su paquete por un toque sin querer.
export function SlotChip({
  fecha,
  etiquetaDia,
  nombreDia,
  horaInicio,
  horaFin,
  libres,
  esMia,
  pasado,
  puedeReservar,
}: {
  fecha: string;
  etiquetaDia: string;
  nombreDia: string;
  horaInicio: string;
  horaFin: string;
  libres: number;
  esMia: boolean;
  pasado: boolean;
  puedeReservar: boolean;
}) {
  const action = reservarClase.bind(null, fecha, horaInicio, horaFin);
  const [state, formAction, pending] = useActionState(action, initialState);
  const [confirmando, setConfirmando] = useState(false);

  const horaLabel = `${hora12(horaInicio)} – ${hora12(horaFin)}`;

  if (esMia) {
    return (
      <div className="rounded-xl bg-grafito text-white px-4 py-3.5">
        <p className="text-[15px] font-semibold">{horaLabel}</p>
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-white/70 mt-1">
          Tu clase ✓
        </p>
      </div>
    );
  }

  if (pasado || libres <= 0) {
    return (
      <div className="rounded-xl border border-grafito/[0.08] bg-sand/70 px-4 py-3.5">
        <p className="text-[15px] font-semibold text-grafito/45">{horaLabel}</p>
        <p className="font-mono text-[11px] font-bold text-grafito/45 mt-1 uppercase tracking-[0.1em]">
          {pasado ? "Ya pasó" : "Ocupado"}
        </p>
      </div>
    );
  }

  if (!puedeReservar) {
    return (
      <div className="rounded-xl border border-grafito/10 bg-white px-4 py-3.5">
        <p className="text-[15px] font-semibold text-grafito/60">{horaLabel}</p>
        <p className="font-mono text-[11px] font-bold text-grafito/45 mt-1 uppercase tracking-[0.1em]">
          Libre
        </p>
      </div>
    );
  }

  if (confirmando) {
    return (
      <form action={formAction} className="rounded-xl border-2 border-rojo bg-white px-4 py-3.5">
        <p className="text-sm text-grafito">
          ¿Reservas el <strong>{nombreDia} {etiquetaDia}</strong>, de{" "}
          <strong>{horaLabel}</strong>?
        </p>
        {state.error && <p className="text-sm font-medium text-rojo mt-2">{state.error}</p>}
        <div className="flex gap-2 mt-3">
          <button
            type="submit"
            disabled={pending}
            className="btn-press flex-1 rounded-full bg-rojo hover:bg-rojo-oscuro text-white font-semibold py-2.5 text-sm disabled:opacity-60"
          >
            {pending ? "Reservando..." : "Sí, reservar"}
          </button>
          <button
            type="button"
            onClick={() => setConfirmando(false)}
            disabled={pending}
            className="btn-press rounded-full border border-grafito/20 px-4 text-sm font-semibold text-grafito/70"
          >
            No
          </button>
        </div>
      </form>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirmando(true)}
      className="btn-press slot-chip glass rounded-xl text-grafito px-4 py-3.5 text-left group"
    >
      <p className="text-[15px] font-semibold">{horaLabel}</p>
      <p className="font-mono text-[11px] font-bold mt-1 uppercase tracking-[0.08em] text-rojo group-hover:text-white">
        Disponible · Reservar
      </p>
    </button>
  );
}
