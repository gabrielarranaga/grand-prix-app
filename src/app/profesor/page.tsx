import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { instanteLima, ahora } from "@/lib/fecha";
import { hora12 } from "@/lib/horarios";
import { DashboardHeader } from "@/components/dashboard-header";
import { PageHeader } from "@/components/page-header";
import { MarcarBotones } from "./marcar-botones";

type ReservaConAlumno = {
  id: string;
  estado: string;
  alumno: { nombre: string; telefono: string | null } | null;
  horario: {
    id: string;
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
  };
};

// El historial del profesor solo muestra clases que ya pasaron y se
// marcaron: asistio (verde), no asistio el alumno (rojo), o no pudo el
// profesor (gris). Las canceladas por el alumno no le sirven de nada al
// profesor, asi que no se muestran aca.
const ETIQUETA_ESTADO: Record<string, string> = {
  completada: "Completada",
  no_show: "No asistió el alumno",
  profesor_no_asistio: "No pudiste ir",
};

const ESTILO_ESTADO: Record<string, string> = {
  completada: "bg-green-600/12 text-green-800",
  no_show: "bg-rojo/10 text-rojo-oscuro",
  profesor_no_asistio: "bg-grafito/10 text-grafito/70",
};

function ContactoAlumno({ alumno }: { alumno: ReservaConAlumno["alumno"] }) {
  if (!alumno?.telefono) {
    return <span className="text-sm text-grafito/70">{alumno?.nombre ?? "—"}</span>;
  }
  return (
    <a
      href={`https://wa.me/51${alumno.telefono}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm text-grafito/80 hover:text-rojo"
    >
      {alumno.nombre} <span className="underline text-rojo text-xs font-semibold ml-1">WhatsApp</span>
    </a>
  );
}

function formatearFecha(fecha: string) {
  return new Date(fecha + "T00:00:00").toLocaleDateString("es-PE", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

export default async function ProfesorPage() {
  const profile = await requireProfile("profesor");
  const supabase = await createClient();

  const { data } = await supabase
    .from("reservas")
    .select(
      "id, estado, alumno:profiles!reservas_alumno_id_fkey(nombre, telefono), horario:horarios_clase!inner(id, fecha, hora_inicio, hora_fin, profesor_id)",
    )
    .eq("horario.profesor_id", profile.id)
    .returns<ReservaConAlumno[]>();

  const reservas = data ?? [];
  const instante = ahora();

  const pendientesPorMarcar = reservas.filter(
    (r) =>
      r.estado === "confirmada" &&
      instanteLima(r.horario.fecha, r.horario.hora_fin).getTime() <= instante,
  );

  const proximas = reservas
    .filter(
      (r) =>
        r.estado === "confirmada" &&
        instanteLima(r.horario.fecha, r.horario.hora_fin).getTime() > instante,
    )
    .sort((a, b) =>
      (a.horario.fecha + a.horario.hora_inicio).localeCompare(
        b.horario.fecha + b.horario.hora_inicio,
      ),
    );

  const historial = reservas
    .filter(
      (r) =>
        (r.estado === "completada" || r.estado === "no_show" || r.estado === "profesor_no_asistio") &&
        !pendientesPorMarcar.includes(r) &&
        !proximas.includes(r),
    )
    .sort((a, b) =>
      (b.horario.fecha + b.horario.hora_inicio).localeCompare(
        a.horario.fecha + a.horario.hora_inicio,
      ),
    );

  return (
    <>
      <DashboardHeader nombre={profile.nombre} etiquetaRol="Profesor" />
      <main className="max-w-5xl mx-auto px-5 pt-8 pb-16 space-y-10">
        <PageHeader
          etiqueta="Panel de instructores"
          titulo={
            <>
              Hola, <em>{profile.nombre.split(" ")[0]}</em>
            </>
          }
          bajada="Esta es tu agenda de clases."
        />

        {pendientesPorMarcar.length > 0 && (
          <section>
            <h2 className="font-display text-xl font-extrabold tracking-[-0.02em] text-grafito mb-4">
              Marca cómo salieron <span className="font-mono text-sm font-bold text-rojo align-middle ml-1">{String(pendientesPorMarcar.length).padStart(2, "0")}</span>
            </h2>
            <div className="space-y-3">
              {pendientesPorMarcar.map((r) => (
                <div
                  key={r.id}
                  className="glass rounded-2xl border-rojo/40 border-l-4 border-l-rojo p-5 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="text-sm font-semibold text-grafito">
                      {formatearFecha(r.horario.fecha)}
                    </span>
                    <span className="text-sm text-grafito/70">
                      {hora12(r.horario.hora_inicio.slice(0, 5))}–{hora12(r.horario.hora_fin.slice(0, 5))}
                    </span>
                    <ContactoAlumno alumno={r.alumno} />
                  </div>
                  <MarcarBotones reservaId={r.id} horarioId={r.horario.id} />
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="font-display text-xl font-extrabold tracking-[-0.02em] text-grafito mb-4">
            Próximas clases <span className="font-mono text-sm font-bold text-rojo align-middle ml-1">{String(proximas.length).padStart(2, "0")}</span>
          </h2>
          {proximas.length === 0 ? (
            <p className="text-sm text-grafito/60">No tienes clases próximas asignadas.</p>
          ) : (
            <div className="space-y-3">
              {proximas.map((r) => (
                <div
                  key={r.id}
                  className="glass rounded-2xl p-5 flex flex-wrap items-center gap-x-4 gap-y-1"
                >
                  <span className="text-sm font-semibold text-grafito">
                    {formatearFecha(r.horario.fecha)}
                  </span>
                  <span className="text-sm text-grafito/70">
                    {hora12(r.horario.hora_inicio.slice(0, 5))}–{hora12(r.horario.hora_fin.slice(0, 5))}
                  </span>
                  <ContactoAlumno alumno={r.alumno} />
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="font-display text-xl font-extrabold tracking-[-0.02em] text-grafito mb-4">Historial</h2>
          {historial.length === 0 ? (
            <p className="text-sm text-grafito/60">Todavía no tienes clases pasadas.</p>
          ) : (
            <div className="space-y-3">
              {historial.map((r) => (
                <div
                  key={r.id}
                  className="glass rounded-2xl p-5 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="text-sm font-semibold text-grafito">
                      {formatearFecha(r.horario.fecha)}
                    </span>
                    <span className="text-sm text-grafito/70">
                      {hora12(r.horario.hora_inicio.slice(0, 5))}–{hora12(r.horario.hora_fin.slice(0, 5))}
                    </span>
                    <span className="text-sm text-grafito/70">{r.alumno?.nombre ?? "—"}</span>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1.5 rounded-md ${ESTILO_ESTADO[r.estado]}`}
                    >
                      {ETIQUETA_ESTADO[r.estado]}
                    </span>
                    <details className="text-right">
                      <summary className="cursor-pointer text-xs font-semibold text-rojo underline list-none">
                        Corregir
                      </summary>
                      <div className="mt-2">
                        <MarcarBotones reservaId={r.id} horarioId={r.horario.id} />
                      </div>
                    </details>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
