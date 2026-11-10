"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registrarAlumno, type AuthState } from "../actions";
import { ORIGENES_ALUMNO } from "@/lib/origenes";

const initialState: AuthState = { error: null };

export default function RegistroPage() {
  const [state, formAction, pending] = useActionState(registrarAlumno, initialState);

  return (
    <>
      <p className="tag">Alumnos nuevos</p>
      <h1 className="titular text-[1.9rem] text-grafito mt-2.5">
        Crea tu <em>cuenta</em>
      </h1>
      <p className="text-sm text-grafito/65 mt-2 mb-6">
        Para reservar tus clases de manejo en Grand Prix.
      </p>

      <form action={formAction} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-grafito mb-1.5">
              Nombre
            </label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              required
              autoComplete="given-name"
              className="w-full rounded-[10px] border-[1.5px] border-grafito/20 px-3.5 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-rojo/30 focus:border-rojo"
            />
          </div>
          <div>
            <label htmlFor="apellido" className="block text-sm font-medium text-grafito mb-1.5">
              Apellido
            </label>
            <input
              id="apellido"
              name="apellido"
              type="text"
              required
              autoComplete="family-name"
              className="w-full rounded-[10px] border-[1.5px] border-grafito/20 px-3.5 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-rojo/30 focus:border-rojo"
            />
          </div>
        </div>
        <div>
          <label htmlFor="telefono" className="block text-sm font-medium text-grafito mb-1.5">
            Celular
          </label>
          <input
            id="telefono"
            name="telefono"
            type="tel"
            required
            inputMode="numeric"
            pattern="\d{9}"
            minLength={9}
            maxLength={9}
            autoComplete="tel"
            placeholder="9XXXXXXXX"
            className="w-full rounded-[10px] border-[1.5px] border-grafito/20 px-3.5 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-rojo/30 focus:border-rojo"
          />
          <p className="text-xs text-grafito/50 mt-1">9 dígitos, como en WhatsApp.</p>
        </div>
        <div>
          <label htmlFor="pin" className="block text-sm font-medium text-grafito mb-1.5">
            Crea un PIN
          </label>
          <input
            id="pin"
            name="pin"
            type="password"
            required
            inputMode="numeric"
            pattern="\d{6}"
            minLength={6}
            maxLength={6}
            autoComplete="new-password"
            className="w-full rounded-[10px] border-[1.5px] border-grafito/20 px-3.5 py-2.5 text-base tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-rojo/30 focus:border-rojo"
          />
          <p className="text-xs text-grafito/50 mt-1">6 números. Lo usarás para entrar, junto con tu celular.</p>
        </div>

        <div>
          <label htmlFor="origen" className="block text-sm font-medium text-grafito mb-1.5">
            ¿Cómo nos conociste?
          </label>
          <select
            id="origen"
            name="origen"
            required
            defaultValue=""
            className="w-full rounded-[10px] border-[1.5px] border-grafito/20 bg-white px-3.5 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-rojo/30 focus:border-rojo"
          >
            <option value="" disabled>
              Elige una opción
            </option>
            {ORIGENES_ALUMNO.map((o) => (
              <option key={o.valor} value={o.valor}>
                {o.etiqueta}
              </option>
            ))}
          </select>
        </div>

        {state.error && <p className="text-sm text-rojo">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="btn-press w-full glow-rojo rounded-[10px] bg-rojo hover:bg-rojo-oscuro text-white font-bold h-[52px] disabled:opacity-60"
        >
          {pending ? "Creando cuenta..." : "Crear cuenta"}
        </button>

        <p className="text-xs text-grafito/50 text-center">
          Al crear tu cuenta aceptas nuestra{" "}
          <Link href="/privacidad" className="text-grafito/70 font-medium hover:text-rojo underline">
            Política de Privacidad
          </Link>
          .
        </p>
      </form>

      <p className="text-sm text-grafito/60 mt-6 text-center">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-rojo font-semibold hover:text-rojo-oscuro">
          Inicia sesión
        </Link>
      </p>
    </>
  );
}
