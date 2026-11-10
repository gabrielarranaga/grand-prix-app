"use client";

import { useActionState, useRef, useState } from "react";
import { hora12 } from "@/lib/horarios";
import {
  bloquearFranja,
  desbloquearFranja,
  asignarProfesorHorario,
  asignarClaseAlumno,
  cancelarClasePorEmergencia,
  type BloqueoFormState,
} from "./actions";
import type { Profile } from "@/lib/types";

const initialState: BloqueoFormState = { error: null };

// Un cupo de una franja (la hora ya la muestra la tarjeta de la franja):
// una clase reservada, un bloqueo, o los cupos libres que quedan.
export function AdminSlot({
  fecha,
  horaInicio,
  horaFin,
  estado,
  horarioId,
  alumno,
  libres = 1,
  profesorId,
  profesores,
  alumnos,
  pasado = false,
}: {
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: "disponible" | "reservado" | "bloqueado";
  horarioId?: string;
  alumno?: { nombre: string; telefono: string | null; reservaId?: string } | null;
  libres?: number;
  profesorId?: string | null;
  profesores: Profile[];
  alumnos: Profile[];
  pasado?: boolean;
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

  const etiquetaLibres = libres === 1 ? "1 cupo libre" : `${libres} cupos libres`;

  const cancelarAction = cancelarClasePorEmergencia.bind(null, alumno?.reservaId ?? "");
  const [cancelarState, cancelarFormAction, cancelando] = useActionState(cancelarAction, initialState);
  const [abrirCancelar, setAbrirCancelar] = useState(false);
  const avisoWhatsapp =
    alumno?.telefono &&
    `https://wa.me/51${alumno.telefono}?text=${encodeURIComponent(
      `Hola ${alumno.nombre.split(" ")[0]}, te escribimos de Grand Prix. Tuvimos que cancelar tu clase del ${fecha.split("-").reverse().join("/")} a las ${hora12(horaInicio)} por una emergencia. Esa clase NO se te descuenta. ¿Qué otro día y hora te acomoda? También puedes reservarla en la app.`,
    )}`;

  // Un cupo disponible que ya paso no se puede asignar ni bloquear.
  if (estado === "disponible" && pasado) {
    return (
      <div className="rounded-xl border border-grafito/[0.08] bg-sand/70 px-3 py-2.5 text-left">
        <p className="font-mono text-[11px] font-bold text-grafito/50 uppercase tracking-[0.08em]">
          {etiquetaLibres} · ya pasó
        </p>
      </div>
    );
  }

  if (estado === "reservado") {
    return (
      <div className="rounded-xl bg-grafito text-white px-3 py-2.5 text-left">
        <p className="text-sm font-semibold leading-tight truncate">{alumno?.nombre ?? "Alumno"}</p>
        {alumno?.telefono && (
          <a
            href={`https://wa.me/51${alumno.telefono}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-white/70 hover:text-white underline"
          >
            WhatsApp {alumno.telefono}
          </a>
        )}
        <form action={asignarProfesorHorario} className="mt-2">
          <input type="hidden" name="id" value={horarioId} />
          <label className="sr-only" htmlFor={`profesor-${horarioId}`}>
            Instructor
          </label>
          <select
            id={`profesor-${horarioId}`}
            name="profesor_id"
            defaultValue={profesorId ?? ""}
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
            className="w-full text-xs rounded-md border border-white/20 bg-white text-grafito px-1.5 py-1.5"
          >
            <option value="">Sin instructor</option>
            {profesores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </form>
        {alumno?.reservaId && !pasado && (
          <div className="mt-2.5 border-t border-white/15 pt-2">
            {!abrirCancelar ? (
              <button
                type="button"
                onClick={() => setAbrirCancelar(true)}
                className="text-xs font-semibold text-white/75 hover:text-white underline"
              >
                Cancelar por emergencia
              </button>
            ) : (
              <form action={cancelarFormAction} className="space-y-1.5">
                <label className="sr-only" htmlFor={`motivo-${horarioId}`}>
                  Motivo
                </label>
                <select
                  id={`motivo-${horarioId}`}
                  name="motivo"
                  required
                  defaultValue=""
                  className="w-full text-xs rounded-md border border-white/20 bg-white text-grafito px-1.5 py-1.5"
                >
                  <option value="" disabled>
                    ¿Quién tuvo la emergencia?
                  </option>
                  <option value="alumno">El alumno</option>
                  <option value="instructor">El instructor</option>
                  <option value="otro">Otro motivo</option>
                </select>
                <p className="text-[11px] text-white/65 leading-snug">
                  Se libera el cupo y la clase no se le descuenta al alumno.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={cancelando}
                    className="rounded-full bg-rojo text-white text-xs font-semibold px-3 py-1.5 disabled:opacity-60"
                  >
                    {cancelando ? "Cancelando..." : "Cancelar clase"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAbrirCancelar(false)}
                    className="text-xs text-white/70 underline"
                  >
                    No
                  </button>
                </div>
                {avisoWhatsapp && (
                  <a
                    href={avisoWhatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-xs text-white/80 underline"
                  >
                    Avisarle por WhatsApp primero
                  </a>
                )}
                {cancelarState.error && <p className="text-xs text-red-300">{cancelarState.error}</p>}
              </form>
            )}
          </div>
        )}
      </div>
    );
  }

  if (estado === "bloqueado") {
    return (
      <div className="rounded-xl border border-dashed border-grafito/25 bg-sand/70 px-3 py-2.5 text-left">
        <p className="font-mono text-[11px] font-bold text-grafito/50 uppercase tracking-[0.1em]">
          Bloqueado
        </p>
        <form action={desbloquearFranja} className="mt-1.5">
          <input type="hidden" name="id" value={horarioId} />
          <button
            type="submit"
            className="text-xs font-semibold text-rojo hover:text-rojo-oscuro"
          >
            Abrir de nuevo
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-grafito/15 bg-white text-grafito px-3 py-2.5 text-left space-y-1.5">
      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-rojo">
        {etiquetaLibres}
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
          className="btn-press text-xs font-semibold text-grafito/70 hover:text-rojo disabled:opacity-60"
        >
          {bloqueando ? "Bloqueando..." : "Bloquear franja"}
        </button>
        {bloquearState.error && (
          <p className="text-xs text-rojo mt-1 normal-case">{bloquearState.error}</p>
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
        className="w-full text-xs rounded-md border border-grafito/20 bg-white px-2 py-1.5 disabled:opacity-60"
      />
      {abierto && !asignando && (
        <div className="absolute z-10 mt-1 w-full max-h-40 overflow-y-auto rounded-md border border-grafito/15 bg-white shadow-lg">
          {filtrados.length === 0 ? (
            <p className="text-xs text-grafito/50 px-2 py-1.5">Sin resultados</p>
          ) : (
            filtrados.map((a) => (
              <button
                key={a.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => elegir(a)}
                className="block w-full text-left text-xs px-2 py-2 hover:bg-rojo/5"
              >
                {a.nombre}
              </button>
            ))
          )}
        </div>
      )}
      {error && <p className="text-xs text-rojo mt-1 normal-case">{error}</p>}
    </form>
  );
}
