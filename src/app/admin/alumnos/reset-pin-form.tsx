"use client";

import { useActionState, useState } from "react";
import { resetearPin, type ResetPinState } from "./actions";

const initialState: ResetPinState = { error: null, ok: false };

export function ResetPinForm({ alumnoId }: { alumnoId: string }) {
  const [abierto, setAbierto] = useState(false);
  const [state, formAction, pending] = useActionState(resetearPin.bind(null, alumnoId), initialState);

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="text-sm font-semibold text-grafito/70 hover:text-rojo"
      >
        Resetear PIN
      </button>
    );
  }

  if (state.ok) {
    return <span className="text-sm font-semibold text-green-500">PIN actualizado ✓</span>;
  }

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input
        type="password"
        name="pin"
        required
        inputMode="numeric"
        pattern="\d{6}"
        minLength={6}
        maxLength={6}
        placeholder="Nuevo PIN"
        className="w-28 rounded-lg border border-grafito/20 px-2.5 py-1.5 text-sm tracking-[0.2em] focus:outline-none focus:ring-2 focus:ring-rojo/30 focus:border-rojo"
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
        onClick={() => setAbierto(false)}
        className="text-sm text-grafito/50 hover:text-grafito"
      >
        Cancelar
      </button>
      {state.error && <p className="text-xs text-rojo w-full">{state.error}</p>}
    </form>
  );
}
