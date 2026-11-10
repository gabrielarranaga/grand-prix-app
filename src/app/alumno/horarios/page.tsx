import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  CUPOS_POR_FRANJA,
  FRANJAS_HORARIAS,
  diasDeLaSemana,
  formatearFechaCorta,
  cupoPasado,
  offsetSemanaDe,
} from "@/lib/horarios";
import { fechaLima } from "@/lib/fecha";
import { tieneAccesoAHorarios } from "@/lib/acceso";
import { AccesoBloqueado } from "@/components/acceso-bloqueado";
import { SlotChip } from "./reservar-button";

type Horario = {
  id: string;
  fecha: string;
  hora_inicio: string;
  estado: string;
};

type MiReserva = {
  horario: { fecha: string; hora_inicio: string } | null;
};

type Avance = { incluidas: number; permitidas: number; usadas: number };

export default async function HorariosPage({
  searchParams,
}: {
  searchParams: Promise<{ reservado?: string; semana?: string; dia?: string }>;
}) {
  const acceso = await tieneAccesoAHorarios();
  if (!acceso) {
    return <AccesoBloqueado seccion="El cronograma de horarios" />;
  }

  const { reservado, semana, dia } = await searchParams;
  const offsetSemanas =
    semana === undefined && dia ? offsetSemanaDe(dia) : Math.max(0, Number(semana ?? 0) || 0);
  const dias = diasDeLaSemana(offsetSemanas);

  // Dia elegido: el que pidio el alumno, o el primero de la semana que
  // todavia no termino (para no abrir en un lunes que ya paso).
  const hoy = fechaLima(0);
  const diaElegido =
    dias.find((d) => d.iso === dia) ?? dias.find((d) => d.iso >= hoy) ?? dias[0];

  const supabase = await createClient();
  const [{ data }, { data: misReservas }, { data: avanceData }] = await Promise.all([
    supabase
      .from("horarios_clase")
      .select("id, fecha, hora_inicio, estado")
      .in("estado", ["reservado", "bloqueado"])
      .gte("fecha", dias[0].iso)
      .lte("fecha", dias[dias.length - 1].iso)
      .returns<Horario[]>(),
    supabase
      .from("reservas")
      .select("horario:horarios_clase(fecha, hora_inicio)")
      .eq("estado", "confirmada")
      .returns<MiReserva[]>(),
    supabase.rpc("mi_avance"),
  ]);

  // Cuantos cupos de cada franja ya estan tomados (reservados o bloqueados).
  const ocupados = new Map<string, number>();
  for (const h of data ?? []) {
    const clave = `${h.fecha}|${h.hora_inicio.slice(0, 5)}`;
    ocupados.set(clave, (ocupados.get(clave) ?? 0) + 1);
  }

  const mias = new Set(
    (misReservas ?? [])
      .filter((r) => r.horario)
      .map((r) => `${r.horario!.fecha}|${r.horario!.hora_inicio.slice(0, 5)}`),
  );

  const avance = ((avanceData ?? []) as Avance[])[0] ?? { incluidas: 0, permitidas: 0, usadas: 0 };
  const puedeReservar = avance.usadas < avance.permitidas;
  const faltaSegundoPago = !puedeReservar && avance.usadas < avance.incluidas;
  const restantes = Math.max(0, avance.incluidas - avance.usadas);

  const libresDelDia = (iso: string) =>
    FRANJAS_HORARIAS.filter(
      (f) =>
        !cupoPasado(iso, f.inicio) &&
        (ocupados.get(`${iso}|${f.inicio}`) ?? 0) < CUPOS_POR_FRANJA,
    ).length;

  const enlace = (s: number, d?: string) =>
    `/alumno/horarios?semana=${s}${d ? `&dia=${d}` : ""}`;

  return (
    <>
      <div className="animate-in corte-asimetrico relative overflow-hidden h-40 sm:h-48 max-sm:landscape:h-28 bg-ink isolate">
        <Image
          src="/cronograma-interior.webp"
          alt="Alumno al volante con el instructor al lado"
          fill
          priority
          quality={90}
          className="object-cover object-[50%_42%] -z-20"
          sizes="(min-width: 1024px) 800px, 100vw"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/60 to-ink/10" />
        <div className="absolute inset-x-0 bottom-0 p-6">
          <p className="tag tag-claro">Agenda</p>
          <h1 className="titular text-[1.8rem] sm:text-[2.2rem] text-white !leading-[1] !tracking-[-0.045em] mt-2.5">
            Reserva tu <em>clase</em>
          </h1>
          <p className="text-white/70 text-sm mt-2">Elige el día y luego la hora.</p>
        </div>
      </div>

      {reservado === "1" && (
        <div className="animate-in mt-6 rounded-xl bg-white border border-rojo/40 border-l-4 border-l-rojo text-grafito px-4 py-3.5 text-sm font-medium">
          ¡Tu clase quedó reservada! La vas a ver en{" "}
          <Link href="/alumno/agenda" className="text-rojo font-semibold underline">
            Mi agenda
          </Link>
          .
        </div>
      )}

      <p className="mt-5 text-sm text-grafito/65">
        Te quedan <span className="font-semibold text-grafito">{restantes}</span> de{" "}
        {avance.incluidas} clases de tu paquete.
      </p>

      {faltaSegundoPago && (
        <div className="animate-in mt-4 rounded-xl bg-white border border-amber-500/40 border-l-4 border-l-amber-500 px-4 py-4 text-sm text-grafito flex gap-3">
          <Lock className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Ya vas a mitad de curso</p>
            <p className="text-grafito/70 mt-1">
              Completa tu segundo pago para seguir reservando las {avance.incluidas - avance.usadas}{" "}
              clases que te faltan.
            </p>
            <Link
              href="/alumno/pago"
              className="btn-press inline-flex mt-3 items-center bg-rojo hover:bg-rojo-oscuro text-white font-semibold px-5 py-2.5 rounded-full"
            >
              Pagar el 50% restante
            </Link>
          </div>
        </div>
      )}

      {!puedeReservar && !faltaSegundoPago && avance.incluidas > 0 && (
        <p className="mt-4 text-sm text-grafito/70">
          Ya reservaste todas las clases de tu paquete. ¡Bien hecho!
        </p>
      )}

      <div className="mt-6 flex items-center justify-between gap-3">
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

      <nav className="mt-4 grid grid-cols-6 gap-1.5" aria-label="Días de la semana">
        {dias.map((d) => {
          const libres = libresDelDia(d.iso);
          const activo = d.iso === diaElegido.iso;
          return (
            <Link
              key={d.iso}
              href={enlace(offsetSemanas, d.iso)}
              aria-current={activo ? "date" : undefined}
              className={`btn-press rounded-xl border px-1 py-2.5 text-center transition-colors ${
                activo
                  ? "bg-grafito border-grafito text-white"
                  : libres === 0
                    ? "border-grafito/10 bg-sand/60 text-grafito/40"
                    : "border-grafito/15 bg-white text-grafito hover:border-grafito/40"
              }`}
            >
              <span className={`block font-mono text-[10px] font-bold uppercase tracking-[0.12em] ${activo ? "text-white/70" : "text-rojo"}`}>
                {d.label}
              </span>
              <span className="block text-[15px] font-bold leading-tight mt-0.5">
                {d.fecha.getUTCDate()}
              </span>
              <span className={`block text-[10.5px] mt-0.5 ${activo ? "text-white/60" : "text-grafito/45"}`}>
                {libres === 0 ? "lleno" : `${libres} libres`}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
        {FRANJAS_HORARIAS.map((f) => {
          const clave = `${diaElegido.iso}|${f.inicio}`;
          return (
            <SlotChip
              key={clave}
              fecha={diaElegido.iso}
              etiquetaDia={formatearFechaCorta(diaElegido.fecha)}
              nombreDia={diaElegido.label}
              horaInicio={f.inicio}
              horaFin={f.fin}
              libres={CUPOS_POR_FRANJA - (ocupados.get(clave) ?? 0)}
              esMia={mias.has(clave)}
              pasado={cupoPasado(diaElegido.iso, f.inicio)}
              puedeReservar={puedeReservar}
            />
          );
        })}
      </div>
    </>
  );
}
