import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Paquete } from "@/lib/types";
import { subtituloPaquete, ticksPaquete } from "@/lib/paquetes";
import { CancelarCompraButton } from "../cancelar-compra-button";
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

  // Solo se puede tener un paquete activo a la vez: si ya tiene uno, no se
  // muestra el formulario de pago (enviarlo solo daria error).
  const { data: compraActiva } = await supabase
    .from("compras_paquete")
    .select("id, estado, paquete:paquetes(nombre)")
    .neq("estado", "cancelado")
    .maybeSingle<{ id: string; estado: string; paquete: { nombre: string } | null }>();

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
        <p className="tag">Paquete elegido</p>
        <h1 className="titular text-[2.2rem] text-grafito mt-2.5">{paquete.nombre}</h1>
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
          <span className="font-display text-[2.8rem] font-extrabold leading-none tracking-[-0.05em] text-grafito tabular-nums">
            S/ {paquete.precio.toLocaleString("es-PE")}
          </span>
          <span className="text-sm text-grafito/50">precio total del paquete</span>
        </div>

        <div className="mt-6">
          {compraActiva ? (
            <div className="rounded-xl bg-white border border-rojo/40 border-l-4 border-l-rojo px-4 py-3.5 text-sm text-grafito">
              <p className="font-medium">
                Ya tienes el paquete <strong>{compraActiva.paquete?.nombre ?? ""}</strong> activo, y
                solo se puede tener uno a la vez.{" "}
                {compraActiva.estado === "pendiente"
                  ? "Todavía no coordinaste el pago, así que puedes cancelarlo y elegir este."
                  : "Ya pagaste parte de ese paquete, así que no se puede cancelar solo. Escríbenos por WhatsApp si necesitas hacer un cambio."}
              </p>
              {compraActiva.estado === "pendiente" && (
                <CancelarCompraButton compraId={compraActiva.id} />
              )}
            </div>
          ) : (
            <CheckoutForm paqueteId={paquete.id} />
          )}
        </div>
      </div>
    </div>
  );
}
