import Link from "next/link";
import { Fragment } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { FRANJAS_HORARIAS, diasDeLaSemana, formatearFechaCorta, hora12 } from "@/lib/horarios";
import { AdminSlot } from "./admin-slot";
import type { Profile } from "@/lib/types";

type Horario = {
  id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: string;
  profesor_id: string | null;
};

type ReservaAlumno = {
  horario_clase_id: string;
  alumno: { nombre: string } | null;
};

export default async function AdminHorariosPage({
  searchParams,
}: {
  searchParams: Promise<{ semana?: string }>;
}) {
  const { semana } = await searchParams;
  const offsetSemanas = Math.max(0, Number(semana ?? 0) || 0);
  const dias = diasDeLaSemana(offsetSemanas);

  const supabase = await createClient();

  const { data: profesores } = await supabase
    .from("profiles")
    .select("*")
    .eq("rol", "profesor")
    .order("nombre")
    .returns<Profile[]>();

  const { data: alumnos } = await supabase
    .from("profiles")
    .select("*")
    .eq("rol", "alumno")
    .order("nombre")
    .returns<Profile[]>();

  const { data: horariosData } = await supabase
    .from("horarios_clase")
    .select("id, fecha, hora_inicio, hora_fin, estado, profesor_id")
    .in("estado", ["reservado", "bloqueado"])
    .gte("fecha", dias[0].iso)
    .lte("fecha", dias[dias.length - 1].iso)
    .returns<Horario[]>();

  const horarios = horariosData ?? [];
  const porCelda = new Map<string, Horario>();
  for (const h of horarios) {
    porCelda.set(`${h.fecha}|${h.hora_inicio.slice(0, 5)}`, h);
  }

  const idsReservados = horarios.filter((h) => h.estado === "reservado").map((h) => h.id);
  const alumnoPorHorario = new Map<string, string>();
  if (idsReservados.length > 0) {
    const { data: reservas } = await supabase
      .from("reservas")
      .select("horario_clase_id, alumno:profiles(nombre)")
      .eq("estado", "confirmada")
      .in("horario_clase_id", idsReservados)
      .returns<ReservaAlumno[]>();

    for (const r of reservas ?? []) {
      if (r.alumno) alumnoPorHorario.set(r.horario_clase_id, r.alumno.nombre);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-grafito">Cronograma</h1>
        <p className="text-grafito/60 mt-1">
          El horario es siempre el mismo, de lunes a sábado. En un cupo disponible puedes
          bloquearlo (vacaciones, día que no atienden) o asignárselo directo a un alumno.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <Link
          href={`/admin/horarios?semana=${Math.max(0, offsetSemanas - 1)}`}
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
          href={`/admin/horarios?semana=${offsetSemanas + 1}`}
          className="btn-press glass rounded-full h-10 w-10 flex items-center justify-center"
        >
          <ChevronRight className="h-5 w-5" />
        </Link>
      </div>

      <div className="scroll-fino overflow-x-auto pb-2">
        <div
          className="min-w-[820px] grid gap-2"
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
                  <AdminSlot
                    key={h?.id ?? `${d.iso}-${f.inicio}`}
                    fecha={d.iso}
                    horaInicio={f.inicio}
                    horaFin={f.fin}
                    estado={(h?.estado as "reservado" | "bloqueado" | undefined) ?? "disponible"}
                    horarioId={h?.id}
                    alumnoNombre={h ? alumnoPorHorario.get(h.id) : undefined}
                    profesorId={h?.profesor_id}
                    profesores={profesores ?? []}
                    alumnos={alumnos ?? []}
                  />
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
