import Image from "next/image";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fechaLima } from "@/lib/fecha";
import { TitleAccent } from "@/components/title-accent";

export default async function AdminPage() {
  const profile = await requireProfile("admin");
  const supabase = await createClient();

  const hoy = fechaLima(0);
  const en7dias = fechaLima(7);

  const [{ count: totalProfesores }, { data: horariosSemana }] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("rol", "profesor"),
    supabase
      .from("horarios_clase")
      .select("id, estado")
      .gte("fecha", hoy)
      .lte("fecha", en7dias),
  ]);

  const horarios = horariosSemana ?? [];
  const reservados = horarios.filter((h) => h.estado === "reservado").length;
  const bloqueados = horarios.filter((h) => h.estado === "bloqueado").length;
  // El cronograma es fijo (6 franjas x 6 dias) y se repite siempre; los
  // disponibles bajan a medida que se reservan o se bloquean cupos.
  const cuposPorSemana = 6 * 6;
  const cuposDisponibles = Math.max(0, cuposPorSemana - reservados - bloqueados);

  return (
    <div className="space-y-8">
      <div className="animate-in corte-asimetrico relative overflow-hidden h-64 sm:h-80 max-sm:landscape:h-48">
        <Image
          src="/admin-hero.jpg"
          alt="Grand Prix, Escuela de Manejo"
          fill
          priority
          quality={90}
          className="object-cover object-[42%_32%]"
          sizes="(min-width: 1024px) 800px, 100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/45 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6">
          <p className="text-white/70 text-xs font-semibold uppercase tracking-wide">
            Bienvenido, {profile.nombre.split(" ")[0]}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Resumen del negocio
          </h1>
          <TitleAccent className="w-10 h-1 mt-2" />
          <p className="text-white/80 text-sm mt-1.5">Próximos 7 días, a partir de hoy.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass corte-asimetrico-sm p-5">
          <p className="font-display text-3xl font-semibold text-rojo">{totalProfesores ?? 0}</p>
          <p className="text-sm text-grafito/60 mt-1">Profesores activos</p>
        </div>
        <div className="glass corte-asimetrico-sm p-5">
          <p className="font-display text-3xl font-semibold text-rojo">{cuposDisponibles}</p>
          <p className="text-sm text-grafito/60 mt-1">Cupos disponibles</p>
        </div>
        <div className="glass corte-asimetrico-sm p-5">
          <p className="font-display text-3xl font-semibold text-rojo">{reservados}</p>
          <p className="text-sm text-grafito/60 mt-1">Reservados</p>
        </div>
        <div className="glass corte-asimetrico-sm p-5">
          <p className="font-display text-3xl font-semibold text-rojo">{bloqueados}</p>
          <p className="text-sm text-grafito/60 mt-1">Bloqueados</p>
        </div>
      </div>
    </div>
  );
}
