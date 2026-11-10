import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  CUPOS_POR_FRANJA,
  FRANJAS_HORARIAS,
  diasDeLaSemana,
  formatearFechaCorta,
  hora12,
  cupoPasado,
  offsetSemanaDe,
} from "@/lib/horarios";
import { fechaLima } from "@/lib/fecha";
import { PageHeader } from "@/components/page-header";
import { AdminSlot } from "./admin-slot";
import type { Profile } from "@/lib/types";

type Horario = {
  id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: string;
  cupo: number;
  profesor_id: string | null;
};

type ReservaAlumno = {
  id: string;
  horario_clase_id: string;
  alumno: { nombre: string; telefono: string | null } | null;
};

export default async function AdminHorariosPage({
  searchParams,
}: {
  searchParams: Promise<{ semana?: string; dia?: string }>;
}) {
  const { semana, dia } = await searchParams;
  const offsetSemanas =
    semana === undefined && dia ? offsetSemanaDe(dia) : Math.max(0, Number(semana ?? 0) || 0);
  const dias = diasDeLaSemana(offsetSemanas);
  const hoy = fechaLima(0);
  const diaElegido =
    dias.find((d) => d.iso === dia) ?? dias.find((d) => d.iso >= hoy) ?? dias[0];

  const supabase = await createClient();

  const [{ data: profesores }, { data: alumnos }, { data: horariosData }] = await Promise.all([
    supabase.from("profiles").select("*").eq("rol", "profesor").order("nombre").returns<Profile[]>(),
    supabase.from("profiles").select("*").eq("rol", "alumno").order("nombre").returns<Profile[]>(),
    supabase
      .from("horarios_clase")
      .select("id, fecha, hora_inicio, hora_fin, estado, cupo, profesor_id")
      .in("estado", ["reservado", "bloqueado"])
      .gte("fecha", dias[0].iso)
      .lte("fecha", dias[dias.length - 1].iso)
      .order("cupo")
      .returns<Horario[]>(),
  ]);

  const horarios = horariosData ?? [];
  const porFranja = new Map<string, Horario[]>();
  for (const h of horarios) {
    const clave = `${h.fecha}|${h.hora_inicio.slice(0, 5)}`;
    porFranja.set(clave, [...(porFranja.get(clave) ?? []), h]);
  }

  const idsReservados = horarios.filter((h) => h.estado === "reservado").map((h) => h.id);
  const alumnoPorHorario = new Map<string, { nombre: string; telefono: string | null; reservaId: string }>();
  if (idsReservados.length > 0) {
    const { data: reservas } = await supabase
      .from("reservas")
      .select("id, horario_clase_id, alumno:profiles(nombre, telefono)")
      .eq("estado", "confirmada")
      .in("horario_clase_id", idsReservados)
      .returns<ReservaAlumno[]>();

    for (const r of reservas ?? []) {
      if (r.alumno) alumnoPorHorario.set(r.horario_clase_id, { ...r.alumno, reservaId: r.id });
    }
  }

  const clasesDelDia = (iso: string) =>
    horarios.filter((h) => h.fecha === iso && h.estado === "reservado").length;

  const enlace = (s: number, d?: string) => `/admin/horarios?semana=${s}${d ? `&dia=${d}` : ""}`;

  return (
    <div className="space-y-6">
      <PageHeader
        etiqueta="Agenda"
        titulo={
          <>
            <em>Cronograma</em> semanal
          </>
        }
        bajada={`De lunes a sábado, ${CUPOS_POR_FRANJA} clases a la vez por franja (una por auto). En un cupo libre puedes asignar un alumno o bloquear la franja.`}
      />

      <div className="flex items-center justify-between">
        <Link
          href={enlace(Math.max(0, offsetSemanas - 1))}
          aria-disabled={offsetSemanas === 0}
          aria-label="Semana anterior"
          className={`btn-press glass rounded-[10px] h-11 w-11 flex items-center justify-center hover:border-grafito ${
            offsetSemanas === 0 ? "opacity-30 pointer-events-none" : ""
          }`}
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <p className="text-sm font-semibold text-grafito">
          {formatearFechaCorta(dias[0].fecha)} – {formatearFechaCorta(dias[dias.length - 1].fecha)}
        </p>
        <Link
          href={enlace(offsetSemanas + 1)}
          aria-label="Semana siguiente"
          className="btn-press glass rounded-[10px] h-11 w-11 flex items-center justify-center hover:border-grafito"
        >
          <ChevronRight className="h-5 w-5" />
        </Link>
      </div>

      <nav className="grid grid-cols-6 gap-1.5" aria-label="Días de la semana">
        {dias.map((d) => {
          const activo = d.iso === diaElegido.iso;
          const clases = clasesDelDia(d.iso);
          return (
            <Link
              key={d.iso}
              href={enlace(offsetSemanas, d.iso)}
              aria-current={activo ? "date" : undefined}
              className={`btn-press rounded-xl border px-1 py-2.5 text-center ${
                activo
                  ? "bg-grafito border-grafito text-white"
                  : "border-grafito/15 bg-white text-grafito hover:border-grafito/40"
              }`}
            >
              <span
                className={`block font-mono text-[10px] font-bold uppercase tracking-[0.12em] ${
                  activo ? "text-white/70" : "text-rojo"
                }`}
              >
                {d.label}
              </span>
              <span className="block text-[15px] font-bold leading-tight mt-0.5">{d.fecha.getUTCDate()}</span>
              <span className={`block text-[10.5px] mt-0.5 ${activo ? "text-white/60" : "text-grafito/45"}`}>
                {clases === 1 ? "1 clase" : `${clases} clases`}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3">
        {FRANJAS_HORARIAS.map((f) => {
          const filas = porFranja.get(`${diaElegido.iso}|${f.inicio}`) ?? [];
          const libres = CUPOS_POR_FRANJA - filas.length;
          const pasado = cupoPasado(diaElegido.iso, f.inicio);
          return (
            <section key={f.inicio} className="glass rounded-2xl p-4">
              <h2 className="text-sm font-bold text-grafito mb-3">
                {hora12(f.inicio)} – {hora12(f.fin)}
              </h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {filas.map((h) => (
                  <AdminSlot
                    key={h.id}
                    fecha={diaElegido.iso}
                    horaInicio={f.inicio}
                    horaFin={f.fin}
                    estado={h.estado as "reservado" | "bloqueado"}
                    horarioId={h.id}
                    alumno={alumnoPorHorario.get(h.id) ?? null}
                    profesorId={h.profesor_id}
                    profesores={profesores ?? []}
                    alumnos={alumnos ?? []}
                    pasado={pasado}
                  />
                ))}
                {libres > 0 && (
                  <AdminSlot
                    fecha={diaElegido.iso}
                    horaInicio={f.inicio}
                    horaFin={f.fin}
                    estado="disponible"
                    libres={libres}
                    profesores={profesores ?? []}
                    alumnos={alumnos ?? []}
                    pasado={pasado}
                  />
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
