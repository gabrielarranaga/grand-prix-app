import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Check, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Paquete } from "@/lib/types";
import { subtituloPaquete, ticksPaquete } from "@/lib/paquetes";
import { TitleAccent } from "@/components/title-accent";
import { CancelarCompraButton } from "./cancelar-compra-button";

export default async function PaquetesPage() {
  const supabase = await createClient();

  const { data: paquetes } = await supabase
    .from("paquetes")
    .select("*")
    .eq("activo", true)
    .order("orden")
    .returns<Paquete[]>();

  // Un alumno solo puede tener un paquete activo a la vez.
  const { data: compraActiva } = await supabase
    .from("compras_paquete")
    .select("id, estado, paquete:paquetes(nombre)")
    .neq("estado", "cancelado")
    .maybeSingle<{ id: string; estado: string; paquete: { nombre: string } | null }>();

  return (
    <div className="space-y-10">
      <div className="animate-in corte-asimetrico relative overflow-hidden h-56 sm:h-64 max-sm:landscape:h-40">
        <Image
          src="/flota-vino.jpg"
          alt="Instructor de Grand Prix junto al vehículo de instrucción"
          fill
          priority
          quality={90}
          className="object-cover object-[33%_25%]"
          sizes="(min-width: 1024px) 800px, 100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/95 via-ink/55 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mt-2 tracking-tight">
            Elige tu paquete
          </h1>
          <TitleAccent className="w-10 h-1 mt-2" />
          <p className="text-white/80 text-sm mt-2 max-w-sm">
            Practica al volante con nuestra flota, a tu ritmo.
          </p>
        </div>
      </div>

      {compraActiva && (
        <div className="animate-in rounded-xl bg-rojo/10 border border-rojo/20 text-rojo px-4 py-3 text-sm font-medium">
          <p>
            Ya tienes el paquete <strong>{compraActiva.paquete?.nombre ?? ""}</strong> activo. Solo
            se puede tener uno a la vez.{" "}
            {compraActiva.estado === "pendiente"
              ? "Todavía no coordinaste el pago, así que puedes cambiarlo."
              : "Ya pagaste parte de este paquete, así que no se puede cancelar solo. Escríbenos por WhatsApp si necesitas hacer un cambio."}
          </p>
          {compraActiva.estado === "pendiente" && (
            <CancelarCompraButton compraId={compraActiva.id} />
          )}
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
        {paquetes?.map((p, i) => (
          <div
            key={p.id}
            className={`animate-in card-lift group ${
              p.destacado
                ? "glass-rojo corte-asimetrico relative lg:-translate-y-2 text-white p-6 pt-8 flex flex-col h-full"
                : "glass corte-asimetrico-sm p-6 flex flex-col h-full"
            }`}
            style={{ "--delay": `${i * 70}ms` } as React.CSSProperties}
          >
            {p.destacado && (
              <span className="absolute -top-3 right-6 bg-white text-rojo text-[11px] font-bold uppercase tracking-[0.12em] px-3 py-1.5 rounded-full shadow-md">
                Recomendado
              </span>
            )}
            <h3 className="font-display text-xl font-bold tracking-tight">{p.nombre}</h3>
            <p className="font-display text-4xl font-bold mt-3 tracking-tight">
              S/ {p.precio.toLocaleString("es-PE")}
            </p>
            <p
              className={
                p.destacado
                  ? "text-sm text-white/70 mt-3 pb-3 border-b border-white/15"
                  : "text-sm text-grafito/55 mt-3 pb-3 border-b border-grafito/10"
              }
            >
              {subtituloPaquete(p)}
            </p>
            <ul
              className={
                p.destacado
                  ? "text-sm text-white/90 mt-4 space-y-3 flex-1"
                  : "text-sm text-grafito/70 mt-4 space-y-3 flex-1"
              }
            >
              {ticksPaquete(p).map((c) => (
                <li key={c} className="flex gap-2">
                  {p.destacado ? (
                    <CheckCircle2 className="h-4 w-4 text-white/70 shrink-0 mt-0.5" />
                  ) : (
                    <Check className="h-4 w-4 text-rojo shrink-0 mt-0.5" />
                  )}
                  {c}
                </li>
              ))}
            </ul>
            <Link
              href={`/alumno/paquetes/${p.id}`}
              className={
                p.destacado
                  ? "btn-press mt-7 inline-flex items-center justify-center gap-2 bg-white text-rojo font-semibold px-5 py-3 rounded-full shadow-lg text-center"
                  : "btn-press glow-rojo mt-7 inline-flex items-center justify-center gap-2 bg-rojo text-white font-semibold px-5 py-3 rounded-full text-center"
              }
            >
              Elegir este paquete
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
