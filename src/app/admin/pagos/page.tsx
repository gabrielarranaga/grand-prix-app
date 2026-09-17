import { createClient } from "@/lib/supabase/server";
import { MarcarPagoBotones } from "./marcar-pago-botones";

type CompraConDetalle = {
  id: string;
  alumno_id: string;
  precio: number;
  metodo_pago: string | null;
  modalidad_pago: string | null;
  estado: string;
  fecha_creacion: string;
  alumno: { nombre: string; telefono: string | null } | null;
  paquete: { nombre: string; num_clases: number } | null;
};

const ETIQUETA_MODALIDAD: Record<string, string> = {
  contado: "Al contado",
  medio_medio: "50% + 50%",
};

const ETIQUETA_ESTADO: Record<string, string> = {
  pendiente: "Pendiente",
  parcial: "50% pagado",
  pagado: "Pagado",
};

// Verde = pagado completo, amarillo = falta cobrar el resto, gris = pendiente.
const ESTILO_ESTADO: Record<string, string> = {
  pendiente: "bg-grafito/10 text-grafito/60",
  parcial: "bg-yellow-400/15 text-yellow-500",
  pagado: "bg-green-400/15 text-green-400",
};

export default async function PagosPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("compras_paquete")
    .select(
      "id, alumno_id, precio, metodo_pago, modalidad_pago, estado, fecha_creacion, alumno:profiles(nombre, telefono), paquete:paquetes(nombre, num_clases)",
    )
    .neq("estado", "cancelado")
    .order("fecha_creacion", { ascending: false })
    .returns<CompraConDetalle[]>();

  // Arriba los que faltan pagar (necesitan seguimiento), abajo los que ya
  // pagaron todo.
  const PRIORIDAD_ESTADO: Record<string, number> = {
    pendiente: 0,
    parcial: 1,
    pagado: 2,
  };
  const compras = [...(data ?? [])].sort(
    (a, b) => PRIORIDAD_ESTADO[a.estado] - PRIORIDAD_ESTADO[b.estado],
  );

  const { data: reservasActivas } = await supabase
    .from("reservas")
    .select("alumno_id")
    .in("estado", ["confirmada", "completada", "no_show"]);

  const usadasPorAlumno = new Map<string, number>();
  for (const r of reservasActivas ?? []) {
    usadasPorAlumno.set(r.alumno_id, (usadasPorAlumno.get(r.alumno_id) ?? 0) + 1);
  }

  const incluidasPorAlumno = new Map<string, number>();
  for (const c of compras) {
    if ((c.estado === "parcial" || c.estado === "pagado") && c.paquete) {
      incluidasPorAlumno.set(
        c.alumno_id,
        (incluidasPorAlumno.get(c.alumno_id) ?? 0) + c.paquete.num_clases,
      );
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-grafito">Pagos</h1>
        <p className="text-grafito/60 mt-1">
          Coordina el pago por WhatsApp y después marca el estado acá. En cuanto pague al
          contado o el 50%, se le desbloquean horarios y agenda al alumno.
        </p>
      </div>

      {compras.length === 0 ? (
        <p className="text-sm text-grafito/60">Todavía nadie eligió un paquete.</p>
      ) : (
        <div className="space-y-2">
          {compras.map((c) => (
            <div
              key={c.id}
              className="glass rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              style={{ borderColor: "rgba(228, 35, 31, 0.4)" }}
            >
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-sm font-semibold text-grafito">
                  {c.alumno?.nombre ?? "—"}
                </span>
                <span className="text-sm text-grafito/60">
                  {c.paquete?.nombre ?? "—"}
                  {c.paquete && ` · ${c.paquete.num_clases} clases`}
                </span>
                <span className="text-sm text-grafito/60">
                  S/ {c.precio.toLocaleString("es-PE")}
                </span>
                <span className="text-sm text-grafito/60">{c.metodo_pago ?? "—"}</span>
                {c.modalidad_pago && (
                  <span className="text-sm text-grafito/60">
                    {ETIQUETA_MODALIDAD[c.modalidad_pago] ?? c.modalidad_pago}
                  </span>
                )}
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ESTILO_ESTADO[c.estado]}`}
                >
                  {ETIQUETA_ESTADO[c.estado]}
                </span>
                {(c.estado === "parcial" || c.estado === "pagado") && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-grafito/5 text-grafito/60">
                    Clases: {usadasPorAlumno.get(c.alumno_id) ?? 0}/
                    {incluidasPorAlumno.get(c.alumno_id) ?? 0} usadas
                  </span>
                )}
                {c.estado === "parcial" &&
                  c.paquete &&
                  (usadasPorAlumno.get(c.alumno_id) ?? 0) >= Math.ceil(c.paquete.num_clases / 2) && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-yellow-400/15 text-yellow-500">
                      Ya va a mitad de curso · cobrar 50% restante
                    </span>
                  )}
              </div>
              <div className="flex items-center gap-3">
                <MarcarPagoBotones compraId={c.id} estado={c.estado} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
