"use client";

import { useActionState, useRef, useState } from "react";
import { hora12 } from "@/lib/horarios";
import {
  bloquearFranja,
  desbloquearFranja,
  asignarProfesorHorario,
  asignarClaseAlumno,
  type BloqueoFormState,
} from "./actions";
import type { Profile } from "@/lib/types";

const initialState: BloqueoFormState = { error: null };

export function AdminSlot({
  fecha,
  horaInicio,
  horaFin,
  estado,
  horarioId,
  alumnoNombre,
  profesorId,
  profesores,
  alumnos,
}: {
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: "disponible" | "reservado" | "bloqueado";
  horarioId?: string;
  alumnoNombre?: string | null;
  profesorId?: string | null;
  profesores: Profile[];
  alumnos: Profile[];
}) {
  const bloquearAction = bloquearFranja.bind(null, fecha, horaInicio, horaFin);
  const [bloquearState, bloquearFormAction, bloqueando] = useActionState(
    bloquearAction,
    initialState,
  );

  const asignarAction = asignarClaseAlumno.bind(null, fecha, horaInicio, horaFin);
  const [asignarState, asignarFormAction, asignando] = useActionState(
    asignarAction,
    initialState,
  );

  const horaLabel = `${hora12(horaInicio)}–${hora12(horaFin)}`;

  if (estado === "reservado") {
    return (
      <div className="rounded-xl border border-rojo/20 bg-rojo/5 px-3 py-2.5 text-left">
        <p className="text-xs font-semibold text-grafito leading-tight">{horaLabel}</p>
        <p className="text-[11px] text-grafito/70 mt-1 truncate">{alumnoNombre ?? "Alumno"}</p>
        <form action={asignarProfesorHorario} className="mt-1.5">
          <input type="hidden" name="id" value={horarioId} />
          <select
            name="profesor_id"
            defaultValue={profesorId ?? ""}
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
            className="w-full text-[10px] rounded-md border border-grafito/15 bg-white px-1 py-1"
          >
            <option value="">Sin asignar</option>
            {profesores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </form>
      </div>
    );
  }

  if (estado === "bloqueado") {
    return (
      <div className="rounded-xl border border-dashed border-grafito/15 bg-grafito/[0.03] px-3 py-2.5 text-left">
        <p className="text-xs font-semibold text-grafito/40 leading-tight">{horaLabel}</p>
        <p className="text-[10px] font-medium text-grafito/35 mt-1 uppercase tracking-wide">
          Bloqueado
        </p>
        <form action={desbloquearFranja} className="mt-1.5">
          <input type="hidden" name="id" value={horarioId} />
          <button
            type="submit"
            className="text-[10px] font-semibold text-rojo hover:text-rojo-oscuro"
          >
            Abrir de nuevo
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl text-grafito px-3 py-2.5 text-left space-y-1.5">
      <p className="text-xs font-semibold leading-tight">{horaLabel}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-grafito/50">
        Disponible
      </p>

      <BuscadorAlumno
        alumnos={alumnos}
        asignando={asignando}
        formAction={asignarFormAction}
        error={asignarState.error}
      />

      <form action={bloquearFormAction}>
        <button
          type="submit"
          disabled={bloqueando}
          className="btn-press text-[10px] font-semibold text-grafito/50 hover:text-rojo disabled:opacity-60"
        >
          {bloqueando ? "Bloqueando..." : "Bloquear"}
        </button>
        {bloquearState.error && (
          <p className="text-[10px] text-rojo mt-1 normal-case">{bloquearState.error}</p>
        )}
      </form>
    </div>
  );
}

// Buscador de alumno con texto: un <select> normal se vuelve incomodo de
// usar apenas hay muchos alumnos. Escribe unas letras del nombre, elige de
// la lista filtrada y reserva ese cupo al instante.
function BuscadorAlumno({
  alumnos,
  asignando,
  formAction,
  error,
}: {
  alumnos: Profile[];
  asignando: boolean;
  formAction: (formData: FormData) => void;
  error: string | null;
}) {
  const [texto, setTexto] = useState("");
  const [abierto, setAbierto] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const idRef = useRef<HTMLInputElement>(null);

  const filtrados =
    texto.trim() === ""
      ? alumnos
      : alumnos.filter((a) => a.nombre.toLowerCase().includes(texto.toLowerCase()));

  function elegir(a: Profile) {
    setTexto(a.nombre);
    setAbierto(false);
    if (idRef.current) idRef.current.value = a.id;
    formRef.current?.requestSubmit();
  }

  return (
    <form ref={formRef} action={formAction} className="relative">
      <input type="hidden" name="alumno_id" ref={idRef} />
      <input
        type="text"
        value={texto}
        disabled={asignando}
        onChange={(e) => {
          setTexto(e.target.value);
          setAbierto(true);
        }}
        onFocus={() => setAbierto(true)}
        onBlur={() => setTimeout(() => setAbierto(false), 150)}
        placeholder={asignando ? "Asignando..." : "Asignar alumno..."}
        className="w-full text-[10px] rounded-md border border-grafito/15 bg-white px-1.5 py-1 disabled:opacity-60"
      />
      {abierto && !asignando && (
        <div className="absolute z-10 mt-1 w-full max-h-32 overflow-y-auto rounded-md border border-grafito/15 bg-white shadow-lg">
          {filtrados.length === 0 ? (
            <p className="text-[10px] text-grafito/40 px-2 py-1.5">Sin resultados</p>
          ) : (
            filtrados.map((a) => (
              <button
                key={a.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => elegir(a)}
                className="block w-full text-left text-[10px] px-2 py-1.5 hover:bg-rojo/5"
              >
                {a.nombre}
              </button>
            ))
          )}
        </div>
      )}
      {error && <p className="text-[10px] text-rojo mt-1 normal-case">{error}</p>}
    </form>
  );
}
