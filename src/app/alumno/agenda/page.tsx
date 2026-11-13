import { createClient } from "@/lib/supabase/server";
import { instanteLima, ahora } from "@/lib/fecha";
import { hora12 } from "@/lib/horarios";
import { tieneAccesoAHorarios } from "@/lib/acceso";
import { AccesoBloqueado } from "@/components/acceso-bloqueado";
import { PageHeader } from "@/components/page-header";
import { CancelarButton } from "./cancelar-button";

type ReservaConHorario = {
  id: string;
  estado: string;
  fecha_creacion: string;
  horario: {
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
    profesor: { nombre: string } | null;
  } | null;
};

const ETIQUETA_ESTADO: Record<string, string> = {
  confirmada: "Confirmada",
  cancelada: "Cancelada",
  completada: "Completada",
  no_show: "No asististe",
  profesor_no_asistio: "El profesor no pudo asistir",
};

const ESTILO_ESTADO: Record<string, string> = {
  confirmada: "bg-rojo/10 text-rojo-oscuro",
  cancelada: "bg-grafito/5 text-grafito/55",
  completada: "bg-green-600/12 text-green-800",
  no_show: "bg-rojo/10 text-rojo-oscuro",
  profesor_no_asistio: "bg-grafito/5 text-grafito/65",
};

function formatearFecha(fecha: string) {
  return new Date(fecha + "T00:00:00").toLocaleDateString("es-PE", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

export default async function AgendaAlumnoPage() {
  const acceso = await tieneAccesoAHorarios();
  if (!acceso) {
    return <AccesoBloqueado seccion="Tu agenda" />;
  }

  const supabase = await createClient();

  const { data } = await supabase
    .from("reservas")
    .select(
      "id, estado, fecha_creacion, horario:horarios_clase(fecha, hora_inicio, hora_fin, profesor:profiles(nombre))",
    )
    .returns<ReservaConHorario[]>();

  const reservas = data ?? [];
  const instante = ahora();

  const proximas = reservas
    .filter(
      (r) =>
        r.estado === "confirmada" &&
        r.horario &&
        instanteLima(r.horario.fecha, r.horario.hora_inicio).getTime() > instante,
    )
    .sort((a, b) => (a.horario!.fecha + a.horario!.hora_inicio).localeCompare(
      b.horario!.fecha + b.horario!.hora_inicio,
    ));

  const historial = reservas
    .filter((r) => !proximas.includes(r))
    .sort((a, b) =>
      ((b.horario?.fecha ?? "") + (b.horario?.hora_inicio ?? "")).localeCompare(
        (a.horario?.fecha ?? "") + (a.horario?.hora_inicio ?? ""),
      ),
    );


  return (
    <div className="space-y-10">
      <PageHeader
        etiqueta="Tus clases"
        titulo={
          <>
            Mi <em>agenda</em>
          </>
        }
        bajada="Puedes cancelar una clase hasta 2 horas antes de que empiece."
      />


      <section>
        <h2 className="font-display text-xl font-extrabold tracking-[-0.02em] text-grafito mb-4">
          Próximas clases <span className="font-mono text-sm font-bold text-rojo align-middle ml-1">{String(proximas.length).padStart(2, "0")}</span>
        </h2>
        {proximas.length === 0 ? (
          <p className="text-sm text-grafito/60">No tienes clases próximas reservadas.</p>
        ) : (
          <div className="space-y-3">
            {proximas.map((r) => (
              <div
                key={r.id}
                className="glass rounded-2xl p-5 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="text-sm font-semibold text-grafito">
                    {formatearFecha(r.horario!.fecha)}
                  </span>
                  <span className="text-sm text-grafito/70">
                    {hora12(r.horario!.hora_inicio.slice(0, 5))}–{hora12(r.horario!.hora_fin.slice(0, 5))}
                  </span>
                  <span className="text-sm text-grafito/70">
                    {r.horario!.profesor?.nombre ?? "—"}
                  </span>
                </div>
                <CancelarButton reservaId={r.id} />
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
                    {r.horario ? formatearFecha(r.horario.fecha) : "—"}
                  </span>
                  <span className="text-sm text-grafito/70">
                    {r.horario
                      ? `${hora12(r.horario.hora_inicio.slice(0, 5))}–${hora12(r.horario.hora_fin.slice(0, 5))}`
                      : ""}
                  </span>
                  <span className="text-sm text-grafito/70">
                    {r.horario?.profesor?.nombre ?? "—"}
                  </span>
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-1.5 rounded-md ${
                    r.estado === "confirmada" ? "bg-grafito/10 text-grafito/70" : ESTILO_ESTADO[r.estado]
                  }`}
                >
                  {r.estado === "confirmada" ? "Pendiente de registro" : ETIQUETA_ESTADO[r.estado]}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
