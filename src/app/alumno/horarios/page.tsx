import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { FRANJAS_HORARIAS, hora12, diasDeLaSemana, formatearFechaCorta } from "@/lib/horarios";
import { tieneAccesoAHorarios } from "@/lib/acceso";
import { AccesoBloqueado } from "@/components/acceso-bloqueado";
import { TitleAccent } from "@/components/title-accent";
import { SlotChip } from "./reservar-button";

type Horario = {
  id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: string;
};

export default async function HorariosPage({
  searchParams,
}: {
  searchParams: Promise<{ reservado?: string; semana?: string }>;
}) {
  const acceso = await tieneAccesoAHorarios();
  if (!acceso) {
    return <AccesoBloqueado seccion="El cronograma de horarios" />;
  }

  const { reservado, semana } = await searchParams;
  const offsetSemanas = Math.max(0, Number(semana ?? 0) || 0);

  const dias = diasDeLaSemana(offsetSemanas);

  const supabase = await createClient();
  const { data } = await supabase
    .from("horarios_clase")
    .select("id, fecha, hora_inicio, hora_fin, estado")
    .in("estado", ["reservado", "bloqueado"])
    .gte("fecha", dias[0].iso)
    .lte("fecha", dias[dias.length - 1].iso)
    .returns<Horario[]>();

  const porCelda = new Map<string, Horario>();
  for (const h of data ?? []) {
    porCelda.set(`${h.fecha}|${h.hora_inicio.slice(0, 5)}`, h);
  }

  const { data: comprasActivas } = await supabase
    .from("compras_paquete")
    .select("paquete:paquetes(num_clases)")
    .in("estado", ["parcial", "pagado"])
    .returns<{ paquete: { num_clases: number } | null }[]>();

  const clasesIncluidas = (comprasActivas ?? []).reduce(
    (total, c) => total + (c.paquete?.num_clases ?? 0),
    0,
  );

  const { count: clasesUsadas } = await supabase
    .from("reservas")
    .select("id", { count: "exact", head: true })
    .in("estado", ["confirmada", "completada", "no_show"]);

  const clasesRestantes = clasesIncluidas - (clasesUsadas ?? 0);

  return (
    <>
      <div className="animate-in corte-asimetrico relative overflow-hidden h-36 sm:h-44 max-sm:landscape:h-24">
        <Image
          src="/experiencia-manejo.jpg"
          alt="Practicando al volante con Grand Prix"
          fill
          priority
          quality={90}
          className="object-cover object-[50%_50%]"
          sizes="(min-width: 1024px) 800px, 100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/45 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Cronograma de clases
          </h1>
          <TitleAccent className="w-10 h-1 mt-2" />
          <p className="text-white/80 text-sm mt-1.5">Elige un cupo disponible en la semana.</p>
        </div>
      </div>

      {reservado === "1" && (
        <div className="animate-in mt-6 rounded-xl bg-rojo/10 border border-rojo/20 text-rojo px-4 py-3 text-sm font-medium">
          ¡Tu clase quedó reservada! La vas a ver en tu agenda.
        </div>
      )}

      <p className="mt-4 text-sm text-grafito/60">
        Te quedan <span className="font-semibold text-grafito">{Math.max(0, clasesRestantes)}</span> de{" "}
        {clasesIncluidas} clases de tu paquete.
      </p>

      <div className="mt-6 flex items-center justify-between">
        <Link
          href={`/alumno/horarios?semana=${Math.max(0, offsetSemanas - 1)}`}
          aria-disabled={offsetSemanas === 0}
          className={`btn-press glass rounded-full h-10 w-10 flex items-center justify-center ${
            offsetSemanas === 0 ? "opacity-30 pointer-events-none" : ""
          }`}
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <p className="text-sm font-semibold text-grafito">
          {formatearFechaCorta(dias[0].fecha)} – {formatearFechaCorta(dias[dias.length - 1].fecha)}
        </p>
        <Link
          href={`/alumno/horarios?semana=${offsetSemanas + 1}`}
          className="btn-press glass rounded-full h-10 w-10 flex items-center justify-center"
        >
          <ChevronRight className="h-5 w-5" />
        </Link>
      </div>

      <p className="mt-6 text-xs text-grafito/40 sm:hidden">Desliza para ver todos los días →</p>

      <div className="relative mt-2 sm:mt-6">
        <div className="scroll-fino overflow-x-auto pb-2 -mx-5 px-5">
          <div
            className="min-w-[760px] grid gap-2"
            style={{ gridTemplateColumns: "92px repeat(6, 1fr)" }}
          >
            <div />
            {dias.map((d) => (
              <div key={d.iso} className="text-center">
                <p className="text-[10px] font-semibold text-grafito/50 uppercase tracking-wide">
                  {d.label}
                </p>
                <p className="text-xs font-bold text-grafito">{formatearFechaCorta(d.fecha)}</p>
              </div>
            ))}

            {FRANJAS_HORARIAS.map((f) => (
              <Fragment key={f.inicio}>
                <div className="flex items-center text-[11px] text-grafito/50 font-medium leading-tight">
                  {hora12(f.inicio)}
                </div>
                {dias.map((d) => {
                  const h = porCelda.get(`${d.iso}|${f.inicio}`);
                  return (
                    <SlotChip
                      key={h?.id ?? `${d.iso}-${f.inicio}`}
                      fecha={d.iso}
                      horaInicio={f.inicio}
                      horaFin={f.fin}
                      estado={(h?.estado as "reservado" | "bloqueado" | undefined) ?? "disponible"}
                    />
                  );
                })}
              </Fragment>
            ))}
          </div>
        </div>
        <div
          aria-hidden="true"
          className="sm:hidden pointer-events-none absolute top-0 right-0 bottom-2 w-10 bg-gradient-to-l from-[#faf9f8] to-transparent"
        />
      </div>
    </>
  );
}
