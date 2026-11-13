import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { MarcarPagoBotones } from "./marcar-pago-botones";

function enlaceWhatsapp(telefono: string | null, texto: string) {
  if (!telefono) return null;
  return `https://wa.me/51${telefono}?text=${encodeURIComponent(texto)}`;
}

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
  parcial: "bg-amber-500/15 text-amber-800",
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
      <PageHeader
        etiqueta="Cobros"
        titulo={
          <>
            <em>Pagos</em> de paquetes
          </>
        }
        bajada="Todo se coordina por WhatsApp. Cuando confirmes en tu Yape (o en la oficina) que llegó el pago, márcalo aquí: se desbloquean los horarios del alumno y el ingreso se anota solo en Finanzas."
      />

      {compras.length === 0 ? (
        <p className="text-sm text-grafito/60">Todavía nadie eligió un paquete.</p>
      ) : (
        <div className="space-y-3">
          {compras.map((c) => (
            <div
              key={c.id}
              className="glass rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 card-lift"
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
                  className={`text-xs font-semibold px-2.5 py-1.5 rounded-md ${ESTILO_ESTADO[c.estado]}`}
                >
                  {ETIQUETA_ESTADO[c.estado]}
                </span>
                {(c.estado === "parcial" || c.estado === "pagado") && (
                  <span className="text-xs font-semibold px-2.5 py-1.5 rounded-md bg-grafito/5 text-grafito/60">
                    Clases: {usadasPorAlumno.get(c.alumno_id) ?? 0}/
                    {incluidasPorAlumno.get(c.alumno_id) ?? 0} usadas
                  </span>
                )}
                {c.estado === "parcial" &&
                  c.paquete &&
                  (usadasPorAlumno.get(c.alumno_id) ?? 0) >= Math.ceil(c.paquete.num_clases / 2) && (
                    <span className="text-xs font-semibold px-2.5 py-1.5 rounded-md bg-amber-500/15 text-amber-800">
                      Ya va a mitad de curso · cobrar 50% restante
                    </span>
                  )}
                {c.alumno?.telefono && (
                  <a
                    href={
                      enlaceWhatsapp(
                        c.alumno.telefono,
                        c.estado === "parcial"
                          ? `Hola ${c.alumno.nombre.split(" ")[0]}, te escribimos de Grand Prix. Ya vas a mitad de curso: para seguir reservando tus clases falta el segundo pago. Escríbenos por aquí y te decimos cómo pagar (Yape, Plin, efectivo o tarjeta). Apenas lo validemos, se desbloquean tus clases.`
                          : `Hola ${c.alumno.nombre.split(" ")[0]}, te escribimos de Grand Prix por tu paquete ${c.paquete?.nombre ?? ""}.`,
                      ) ?? undefined
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-rojo underline"
                  >
                    WhatsApp
                  </a>
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
