"use client";

import { useActionState, useState } from "react";
import { Smartphone, CreditCard, Wallet } from "lucide-react";
import { elegirPaquete, type CompraFormState } from "../actions";

const initialState: CompraFormState = { error: null };

const METODOS = [
  { value: "yape", label: "Yape", icono: Smartphone },
  { value: "plin", label: "Plin", icono: Smartphone },
  { value: "tarjeta", label: "Tarjeta", icono: CreditCard },
  { value: "efectivo", label: "Efectivo en la oficina", icono: Wallet },
];

const MODALIDADES = [
  { value: "contado", label: "Al contado", detalle: "Pagas el 100% de una sola vez." },
  {
    value: "medio_medio",
    label: "En dos partes",
    detalle: "50% ahora y 50% a mitad del curso.",
  },
];

export function CheckoutForm({ paqueteId }: { paqueteId: string }) {
  const action = elegirPaquete.bind(null, paqueteId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const [metodo, setMetodo] = useState<string | null>(null);
  const [modalidad, setModalidad] = useState<string | null>(null);

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <p className="text-sm font-medium text-grafito mb-3">¿Cómo prefieres pagar?</p>
        <div className="grid grid-cols-2 gap-3">
          {METODOS.map(({ value, label, icono: Icono }) => (
            <label
              key={value}
              className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 cursor-pointer transition-colors ${
                metodo === value
                  ? "border-rojo bg-rojo/5 text-rojo"
                  : "border-grafito/20 text-grafito/70 hover:border-grafito/40"
              }`}
            >
              <input
                type="radio"
                name="metodo_pago"
                value={value}
                required
                checked={metodo === value}
                onChange={() => setMetodo(value)}
                className="sr-only"
              />
              <Icono className="h-5 w-5 shrink-0" />
              <span className="text-sm font-medium">{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-grafito mb-3">¿Al contado o en dos partes?</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {MODALIDADES.map(({ value, label, detalle }) => (
            <label
              key={value}
              className={`rounded-xl border px-4 py-3 cursor-pointer transition-colors ${
                modalidad === value
                  ? "border-rojo bg-rojo/5"
                  : "border-grafito/20 hover:border-grafito/40"
              }`}
            >
              <input
                type="radio"
                name="modalidad_pago"
                value={value}
                required
                checked={modalidad === value}
                onChange={() => setModalidad(value)}
                className="sr-only"
              />
              <span
                className={`text-sm font-semibold block ${
                  modalidad === value ? "text-rojo" : "text-grafito"
                }`}
              >
                {label}
              </span>
              <span className="text-xs text-grafito/55 mt-0.5 block">{detalle}</span>
            </label>
          ))}
        </div>
      </div>

      <p className="text-xs text-grafito/50 leading-relaxed">
        No se procesa ningún cobro desde la app. Al confirmar, te llevamos a WhatsApp con un
        mensaje ya armado para cerrar el pago directamente con nosotros.
      </p>

      {state.error && <p className="text-sm text-rojo">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full sm:w-auto glow-rojo rounded-full bg-rojo hover:bg-rojo-oscuro text-white font-semibold px-7 py-3 transition-colors disabled:opacity-60"
      >
        {pending ? "Abriendo WhatsApp..." : "Continuar por WhatsApp"}
      </button>
    </form>
  );
}
