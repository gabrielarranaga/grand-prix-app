import { createClient } from "@/lib/supabase/server";
import { TitleAccent } from "@/components/title-accent";
import { hora12 } from "@/lib/horarios";
import { ResetPinForm } from "./reset-pin-form";
import { LiberarNoShowButton } from "./liberar-no-show-button";

type AlumnoFila = {
  id: string;
  nombre: string;
  telefono: string | null;
};

type NoShowFila = {
  id: string;
  alumno_id: string;
  horario: { fecha: string; hora_inicio: string } | null;
};

function formatearFecha(fecha: string) {
  return new Date(fecha + "T00:00:00").toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
  });
}

export default async function AlumnosPage() {
  const supabase = await createClient();

  const { data: alumnos } = await supabase
    .from("profiles")
    .select("id, nombre, telefono")
    .eq("rol", "alumno")
    .order("nombre")
    .returns<AlumnoFila[]>();

  const { data: noShows } = await supabase
    .from("reservas")
    .select("id, alumno_id, horario:horarios_clase(fecha, hora_inicio)")
    .eq("estado", "no_show")
    .returns<NoShowFila[]>();

  const noShowsPorAlumno = new Map<string, NoShowFila[]>();
  for (const r of noShows ?? []) {
    const lista = noShowsPorAlumno.get(r.alumno_id) ?? [];
    lista.push(r);
    noShowsPorAlumno.set(r.alumno_id, lista);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-grafito">Alumnos</h1>
        <TitleAccent className="w-10 h-1 mt-2" />
        <p className="text-grafito/60 mt-2">
          Si un alumno se olvida su PIN, resetéaselo aquí y avísale el nuevo por WhatsApp. Una
          inasistencia consume la clase de su paquete por defecto — si estuvo justificada, puedes
          perdonarla aquí abajo para liberarle el cupo.
        </p>
      </div>

      {!alumnos || alumnos.length === 0 ? (
        <p className="text-sm text-grafito/60">Todavía no hay alumnos registrados.</p>
      ) : (
        <div className="space-y-2">
          {alumnos.map((a) => {
            const inasistencias = noShowsPorAlumno.get(a.id) ?? [];
            return (
              <div key={a.id} className="glass rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="text-sm font-semibold text-grafito">{a.nombre}</span>
                    <span className="text-sm text-grafito/60">{a.telefono ?? "—"}</span>
                  </div>
                  <ResetPinForm alumnoId={a.id} />
                </div>

                {inasistencias.length > 0 && (
                  <div className="pt-3 border-t border-grafito/10 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-grafito/40">
                      Inasistencias sin perdonar
                    </p>
                    {inasistencias.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <span className="text-grafito/70">
                          {r.horario
                            ? `${formatearFecha(r.horario.fecha)} · ${hora12(r.horario.hora_inicio.slice(0, 5))}`
                            : "—"}
                        </span>
                        <LiberarNoShowButton reservaId={r.id} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
