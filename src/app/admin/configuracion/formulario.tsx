"use client";

import { useActionState } from "react";
import { guardarConfiguracion, type ConfiguracionFormState } from "./actions";

const initialState: ConfiguracionFormState = { error: null };

export function ConfiguracionFormulario({
  puntoEncuentroTexto,
  puntoEncuentroMapsLink,
}: {
  puntoEncuentroTexto: string;
  puntoEncuentroMapsLink: string;
}) {
  const [state, formAction, pending] = useActionState(guardarConfiguracion, initialState);

  return (
    <form action={formAction} className="space-y-4 max-w-lg">
      <div>
        <label htmlFor="punto_encuentro_texto" className="block text-sm font-medium text-grafito mb-1.5">
          Punto de encuentro
        </label>
        <input
          id="punto_encuentro_texto"
          name="punto_encuentro_texto"
          type="text"
          defaultValue={puntoEncuentroTexto}
          placeholder="Ej: Av. Lima 554, San Miguel"
          className="w-full rounded-lg border border-grafito/20 px-3.5 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-rojo/30 focus:border-rojo"
        />
      </div>
      <div>
        <label
          htmlFor="punto_encuentro_maps_link"
          className="block text-sm font-medium text-grafito mb-1.5"
        >
          Link de Google Maps
        </label>
        <input
          id="punto_encuentro_maps_link"
          name="punto_encuentro_maps_link"
          type="url"
          defaultValue={puntoEncuentroMapsLink}
          placeholder="https://maps.app.goo.gl/..."
          className="w-full rounded-lg border border-grafito/20 px-3.5 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-rojo/30 focus:border-rojo"
        />
        <p className="text-xs text-grafito/50 mt-1">
          Va incluido en el recordatorio de 2 horas antes de cada clase.
        </p>
      </div>

      {state.error && <p className="text-sm text-rojo">{state.error}</p>}
      {state.guardado && !state.error && (
        <p className="text-sm text-green-600">Guardado.</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="btn-press glow-rojo rounded-full bg-rojo hover:bg-rojo-oscuro text-white font-semibold px-6 py-2.5 transition-colors disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Guardar"}
      </button>
    </form>
  );
}
