import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fechaLima } from "@/lib/fecha";
import { hora12 } from "@/lib/horarios";
import { mesActual, soles, ultimoDiaMes, type CategoriaFinanciera } from "@/lib/finanzas";
import { etiquetaOrigen } from "@/lib/origenes";
import { PageHeader } from "@/components/page-header";
import { GastoRapido } from "./finanzas/gasto-rapido";

type ClaseHoy = {
  id: string;
  hora_inicio: string;
  hora_fin: string;
  profesor: { nombre: string } | null;
  reservas: { estado: string; alumno: { nombre: string; telefono: string | null } | null }[];
};

// El resumen responde "¿que tengo que atender hoy?": las clases del dia,
// los pagos por revisar o cobrar, como va el mes y de donde llegan los
// alumnos nuevos. Todo lo demas vive en su propia pestaña.
export default async function AdminPage() {
  const profile = await requireProfile("admin");
  const supabase = await createClient();

  const hoy = fechaLima(0);
  const mes = mesActual();
  const inicioMes = `${mes}-01`;

  const [
    { data: clasesHoy },
    { count: comprobantesPendientes },
    { data: compras },
    { data: movimientos },
    { data: alumnosNuevos },
    { data: categorias },
  ] = await Promise.all([
    supabase
      .from("horarios_clase")
      .select(
        "id, hora_inicio, hora_fin, profesor:profiles(nombre), reservas(estado, alumno:profiles(nombre, telefono))",
      )
      .eq("fecha", hoy)
      .eq("estado", "reservado")
      .order("hora_inicio")
      .returns<ClaseHoy[]>(),
    supabase
      .from("comprobantes_pago")
      .select("id", { count: "exact", head: true })
      .eq("estado", "pendiente"),
    supabase.from("compras_paquete").select("estado, precio").in("estado", ["pendiente", "parcial"]),
    supabase
      .from("movimientos_financieros")
      .select("tipo, monto")
      .gte("fecha", inicioMes)
      .lte("fecha", ultimoDiaMes(mes)),
    supabase
      .from("profiles")
      .select("origen")
      .eq("rol", "alumno")
      .gte("created_at", `${inicioMes}T00:00:00-05:00`),
    supabase
      .from("categorias_financieras")
      .select("id, nombre, tipo, activa")
      .order("nombre")
      .returns<CategoriaFinanciera[]>(),
  ]);

  const sinPagar = (compras ?? []).filter((c) => c.estado === "pendiente").length;
  const porCobrarSegundo = (compras ?? []).filter((c) => c.estado === "parcial");
  const montoPorCobrar = porCobrarSegundo.reduce((s, c) => s + Number(c.precio) / 2, 0);

  const ingresos = (movimientos ?? []).filter((m) => m.tipo === "ingreso").reduce((s, m) => s + Number(m.monto), 0);
  const egresos = (movimientos ?? []).filter((m) => m.tipo === "egreso").reduce((s, m) => s + Number(m.monto), 0);

  const porOrigen = new Map<string, number>();
  for (const a of alumnosNuevos ?? []) {
    const clave = etiquetaOrigen(a.origen);
    porOrigen.set(clave, (porOrigen.get(clave) ?? 0) + 1);
  }
  const origenesOrdenados = [...porOrigen.entries()].sort((a, b) => b[1] - a[1]);
  const totalNuevos = alumnosNuevos?.length ?? 0;

  const clases = (clasesHoy ?? []).map((c) => ({
    ...c,
    alumno: c.reservas.find((r) => r.estado !== "cancelada")?.alumno ?? null,
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        etiqueta={`Hola, ${profile.nombre.split(" ")[0]}`}
        titulo={
          <>
            Lo de <em>hoy</em>
          </>
        }
      />

      {(comprobantesPendientes ?? 0) > 0 && (
        <Link
          href="/admin/pagos"
          className="animate-in btn-press flex items-center justify-between gap-3 rounded-2xl bg-rojo text-white px-5 py-4"
        >
          <span className="font-semibold">
            {comprobantesPendientes === 1
              ? "1 pago por Yape para revisar"
              : `${comprobantesPendientes} pagos por Yape para revisar`}
          </span>
          <ArrowRight className="h-5 w-5 shrink-0" />
        </Link>
      )}

      <section className="space-y-3">
        <h2 className="font-display text-xl font-extrabold tracking-[-0.02em] text-grafito">
          Clases de hoy{" "}
          <span className="font-mono text-sm font-bold text-rojo align-middle ml-1">
            {String(clases.length).padStart(2, "0")}
          </span>
        </h2>
        {clases.length === 0 ? (
          <p className="text-sm text-grafito/60">No hay clases reservadas para hoy.</p>
        ) : (
          <ul className="space-y-2">
            {clases.map((c) => (
              <li key={c.id} className="glass rounded-xl px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="text-sm font-bold text-grafito tabular-nums">
                  {hora12(c.hora_inicio.slice(0, 5))}
                </span>
                <span className="text-sm text-grafito">{c.alumno?.nombre ?? "—"}</span>
                <span className="text-sm text-grafito/55">{c.profesor?.nombre ?? "Sin instructor"}</span>
                {c.alumno?.telefono && (
                  <a
                    href={`https://wa.me/51${c.alumno.telefono}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-rojo underline ml-auto"
                  >
                    WhatsApp
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <dl className="grid grid-cols-2 sm:grid-cols-4 rounded-2xl bg-ink text-white overflow-hidden">
        {[
          { valor: soles(ingresos), etiqueta: "Entró este mes" },
          { valor: soles(egresos), etiqueta: "Salió este mes" },
          { valor: soles(montoPorCobrar), etiqueta: `Por cobrar (${porCobrarSegundo.length} segundos pagos)` },
          { valor: String(sinPagar), etiqueta: "Eligieron paquete y no pagaron" },
        ].map((k, i) => (
          <div
            key={k.etiqueta}
            className={`relative px-5 pt-6 pb-5 before:absolute before:left-5 before:right-5 before:top-0 before:h-[3px] before:bg-rojo ${
              i > 0 ? "sm:border-l border-white/10" : ""
            } ${i % 2 === 1 ? "max-sm:border-l border-white/10" : ""} ${i > 1 ? "max-sm:border-t border-white/10" : ""}`}
          >
            <dd className="font-display text-[1.6rem] sm:text-[1.9rem] font-extrabold leading-none tracking-[-0.04em] tabular-nums">
              {k.valor}
            </dd>
            <dt className="text-[12.5px] leading-snug text-white/60 mt-2">{k.etiqueta}</dt>
          </div>
        ))}
      </dl>

      <section className="glass corte-asimetrico-sm p-5 sm:p-6">
        <h2 className="font-display text-lg font-extrabold tracking-[-0.02em] text-grafito mb-4">+ Anotar un gasto</h2>
        <GastoRapido categorias={categorias ?? []} hoy={hoy} />
      </section>

      <section className="glass corte-asimetrico-sm p-5 sm:p-6">
        <h2 className="font-display text-lg font-extrabold tracking-[-0.02em] text-grafito">
          ¿De dónde llegaron este mes?
        </h2>
        <p className="text-sm text-grafito/60 mt-1 mb-4">
          {totalNuevos === 1 ? "1 alumno nuevo registrado" : `${totalNuevos} alumnos nuevos registrados`} en la app.
        </p>
        {origenesOrdenados.length === 0 ? (
          <p className="text-sm text-grafito/55">Todavía nadie se registró este mes.</p>
        ) : (
          <ul className="space-y-3">
            {origenesOrdenados.map(([origen, n]) => (
              <li key={origen}>
                <div className="flex justify-between text-sm">
                  <span className="text-grafito/80">{origen}</span>
                  <span className="font-semibold tabular-nums text-grafito">{n}</span>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-grafito/5 overflow-hidden">
                  <div className="h-full rounded-full bg-rojo" style={{ width: `${(n / totalNuevos) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
