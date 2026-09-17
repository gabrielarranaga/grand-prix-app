import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Paquete } from "@/lib/types";
import { subtituloPaquete, ticksPaquete } from "@/lib/paquetes";
import { CheckoutForm } from "./checkout-form";

export default async function ElegirPaquetePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: paquete } = await supabase
    .from("paquetes")
    .select("*")
    .eq("id", id)
    .single<Paquete>();

  if (!paquete) {
    notFound();
  }

  return (
    <div className="max-w-2xl">
      <Link
        href="/alumno/paquetes"
        className="btn-press inline-flex items-center gap-1.5 text-sm text-grafito/60 hover:text-rojo mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a paquetes
      </Link>

      <div className="animate-in glass corte-asimetrico p-6 sm:p-8">
        <p className="text-rojo font-semibold text-xs uppercase tracking-[0.2em] mb-2">
          Paquete elegido
        </p>
        <h1 className="font-display text-2xl font-semibold text-grafito">{paquete.nombre}</h1>
        <p className="text-sm text-grafito/60 mt-1">{subtituloPaquete(paquete)}</p>

        <ul className="text-sm text-grafito/75 mt-5 space-y-2.5">
          {ticksPaquete(paquete).map((c) => (
            <li key={c} className="flex gap-2">
              <Check className="h-4 w-4 text-rojo shrink-0 mt-0.5" />
              {c}
            </li>
          ))}
        </ul>

        <div className="flex items-baseline gap-2 mt-6 pb-6 border-b border-grafito/10">
          <span className="font-display text-4xl font-semibold text-rojo">
            S/ {paquete.precio.toLocaleString("es-PE")}
          </span>
          <span className="text-sm text-grafito/50">pago único</span>
        </div>

        <div className="mt-6">
          <CheckoutForm paqueteId={paquete.id} />
        </div>
      </div>
    </div>
  );
}
