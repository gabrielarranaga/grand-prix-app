"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registrarAlumno, type AuthState } from "../actions";

const initialState: AuthState = { error: null };

export default function RegistroPage() {
  const [state, formAction, pending] = useActionState(registrarAlumno, initialState);

  return (
    <>
      <h1 className="font-display text-2xl font-semibold text-grafito mb-1">Crea tu cuenta</h1>
      <p className="text-sm text-grafito/60 mb-6">
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
              className="w-full rounded-lg border border-grafito/20 px-3.5 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-rojo/30 focus:border-rojo"
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
              className="w-full rounded-lg border border-grafito/20 px-3.5 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-rojo/30 focus:border-rojo"
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
            className="w-full rounded-lg border border-grafito/20 px-3.5 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-rojo/30 focus:border-rojo"
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
            className="w-full rounded-lg border border-grafito/20 px-3.5 py-2.5 text-base tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-rojo/30 focus:border-rojo"
          />
          <p className="text-xs text-grafito/50 mt-1">6 números. Lo usarás para entrar, junto con tu celular.</p>
        </div>

        {state.error && <p className="text-sm text-rojo">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full glow-rojo rounded-full bg-rojo hover:bg-rojo-oscuro text-white font-semibold py-3 transition-colors disabled:opacity-60"
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
