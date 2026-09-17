"use client";

import { useActionState } from "react";
import Link from "next/link";
import { iniciarSesion, type AuthState } from "../actions";

const initialState: AuthState = { error: null };
const NUMERO_WHATSAPP = "51990697634";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(iniciarSesion, initialState);

  return (
    <>
      <h1 className="font-display text-2xl font-semibold text-grafito mb-1">Inicia sesión</h1>
      <p className="text-sm text-grafito/60 mb-6">Alumnos, profesores y administrador.</p>

      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="identificador" className="block text-sm font-medium text-grafito mb-1.5">
            Celular <span className="text-grafito/40 font-normal">(o correo, si eres profesor o admin)</span>
          </label>
          <input
            id="identificador"
            name="identificador"
            type="tel"
            required
            inputMode="numeric"
            autoComplete="tel"
            placeholder="9XXXXXXXX"
            className="w-full rounded-lg border border-grafito/20 px-3.5 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-rojo/30 focus:border-rojo"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-grafito mb-1.5">
            PIN
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            inputMode="numeric"
            autoComplete="current-password"
            className="w-full rounded-lg border border-grafito/20 px-3.5 py-2.5 text-base tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-rojo/30 focus:border-rojo"
          />
        </div>

        {state.error && <p className="text-sm text-rojo">{state.error}</p>}

        <p className="text-right -mt-2">
          <a
            href={`https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent("Hola, olvidé mi PIN de Grand Prix. ¿Me ayudan a recuperarlo?")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-grafito/60 hover:text-rojo"
          >
            ¿Olvidaste tu PIN?
          </a>
        </p>

        <button
          type="submit"
          disabled={pending}
          className="w-full glow-rojo rounded-full bg-rojo hover:bg-rojo-oscuro text-white font-semibold py-3 transition-colors disabled:opacity-60"
        >
          {pending ? "Ingresando..." : "Ingresar"}
        </button>
      </form>

      <p className="text-sm text-grafito/60 mt-6 text-center">
        ¿Eres alumno y aún no tienes cuenta?{" "}
        <Link href="/registro" className="text-rojo font-semibold hover:text-rojo-oscuro">
          Regístrate
        </Link>
      </p>
    </>
  );
}
