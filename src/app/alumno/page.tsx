import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { instanteLima, ahora } from "@/lib/fecha";
import { hora12 } from "@/lib/horarios";
import { PageHeader } from "@/components/page-header";

type Compra = {
  id: string;
  estado: string;
  modalidad_pago: string | null;
  paquete: { nombre: string } | null;
};

type Avance = { incluidas: number; permitidas: number; usadas: number };

type Proxima = {
  horario: { fecha: string; hora_inicio: string; hora_fin: string } | null;
};

function formatearFecha(fecha: string) {
  return new Date(fecha + "T00:00:00").toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

// El inicio responde una sola pregunta: "¿que me toca hacer ahora?". Cada
// paso del camino (paquete → pago → clases) se marca hecho o pendiente, y
// el boton grande lleva directo al siguiente paso.
export default async function InicioPage() {
  const profile = await requireProfile("alumno");
  const supabase = await createClient();

  const [{ data: compra }, { data: avanceData }, { data: reservas }] = await Promise.all([
    supabase
      .from("compras_paquete")
      .select("id, estado, modalidad_pago, paquete:paquetes(nombre)")
      .neq("estado", "cancelado")
      .maybeSingle<Compra>(),
    supabase.rpc("mi_avance"),
    supabase
      .from("reservas")
      .select("horario:horarios_clase(fecha, hora_inicio, hora_fin)")
      .eq("estado", "confirmada")
      .returns<Proxima[]>(),
  ]);

  const avance = ((avanceData ?? []) as Avance[])[0] ?? { incluidas: 0, permitidas: 0, usadas: 0 };
  const instante = ahora();
  const proxima = (reservas ?? [])
    .map((r) => r.horario)
    .filter((h): h is NonNullable<Proxima["horario"]> => !!h && instanteLima(h.fecha, h.hora_inicio).getTime() > instante)
    .sort((a, b) => (a.fecha + a.hora_inicio).localeCompare(b.fecha + b.hora_inicio))[0];

  const pagoHecho = compra?.estado === "parcial" || compra?.estado === "pagado";
  const faltaSegundoPago =
    compra?.estado === "parcial" && avance.usadas >= avance.permitidas && avance.usadas < avance.incluidas;

  // Siguiente paso: un solo boton, el que corresponde.
  let siguiente: { texto: string; href: string; detalle: string };
  if (!compra) {
    siguiente = { texto: "Elegir mi paquete", href: "/alumno/paquetes", detalle: "Empieza eligiendo cuántas horas de práctica quieres." };
  } else if (!pagoHecho || faltaSegundoPago) {
    siguiente = {
      texto: faltaSegundoPago ? "Pagar el 50% restante" : "Pagar mi paquete",
      href: "/alumno/pago",
      detalle: faltaSegundoPago
        ? "Ya vas a mitad de curso. Completa tu pago para seguir reservando."
        : "Coordina tu pago por WhatsApp. Apenas lo validemos, se desbloquean tus horarios.",
    };
  } else if (avance.usadas < avance.incluidas) {
    siguiente = { texto: "Reservar una clase", href: "/alumno/horarios", detalle: "Elige el día y la hora que te acomode." };
  } else {
    siguiente = { texto: "Ver mi agenda", href: "/alumno/agenda", detalle: "Ya tienes todas tus clases reservadas." };
  }

  const pasos = [
    { titulo: "Paquete", hecho: !!compra, detalle: compra?.paquete?.nombre ?? "Por elegir" },
    {
      titulo: "Pago",
      hecho: compra?.estado === "pagado",
      detalle:
        compra?.estado === "pagado"
          ? "Completo"
          : compra?.estado === "parcial"
            ? "50% pagado"
            : "Por pagar",
    },
    {
      titulo: "Clases",
      hecho: avance.incluidas > 0 && avance.usadas >= avance.incluidas,
      detalle: avance.incluidas > 0 ? `${avance.usadas} de ${avance.incluidas} reservadas` : "—",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        etiqueta={`Hola, ${profile.nombre.split(" ")[0]}`}
        titulo={
          <>
            Tu camino al <em>brevete</em>
          </>
        }
      />

      {proxima && (
        <div className="animate-in rounded-2xl bg-ink text-white p-5 sm:p-6">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-white/55">Tu próxima clase</p>
          <p className="font-display text-[1.6rem] font-extrabold leading-tight tracking-[-0.03em] mt-2 first-letter:uppercase">
            {formatearFecha(proxima.fecha)}
          </p>
          <p className="text-white/75 mt-1">
            {hora12(proxima.hora_inicio.slice(0, 5))} – {hora12(proxima.hora_fin.slice(0, 5))}
          </p>
        </div>
      )}

      <ol className="animate-in grid grid-cols-3 gap-2">
        {pasos.map((p) => (
          <li
            key={p.titulo}
            className={`rounded-xl border px-3 py-3 ${p.hecho ? "border-grafito/10 bg-white" : "border-grafito/15 bg-sand/50"}`}
          >
            <p className="flex items-center gap-1.5 text-sm font-semibold text-grafito">
              {p.hecho && <Check className="h-4 w-4 text-green-700" strokeWidth={3} />}
              {p.titulo}
            </p>
            <p className="text-xs text-grafito/60 mt-1 leading-snug">{p.detalle}</p>
          </li>
        ))}
      </ol>

      <div className="animate-in glass corte-asimetrico p-6">
        <p className="text-sm text-grafito/65">{siguiente.detalle}</p>
        <Link
          href={siguiente.href}
          className="btn-press glow-rojo mt-4 flex items-center justify-center gap-2 rounded-full bg-rojo hover:bg-rojo-oscuro text-white font-semibold py-3.5"
        >
          {siguiente.texto}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="animate-in corte-asimetrico relative overflow-hidden h-48 sm:h-64">
        <Image
          src="/inicio-hero.webp"
          alt="Auto de Grand Prix recorriendo la Costa Verde al atardecer"
          fill
          quality={85}
          className="object-cover object-[50%_62%]"
          sizes="(min-width: 1024px) 800px, 100vw"
        />
      </div>
      <p className="text-xs text-grafito/50 text-center">
        31 años enseñando a manejar en San Miguel · 4.8★ en Google
      </p>
    </div>
  );
}
