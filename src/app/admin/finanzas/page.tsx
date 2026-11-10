import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Minus, Tags } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fechaLima } from "@/lib/fecha";
import { PageHeader } from "@/components/page-header";
import {
  esMesValido,
  mesActual,
  nombreMes,
  soles,
  sumarMeses,
  ultimoDiaMes,
  variacion,
  type CategoriaFinanciera,
  type FilaResumen,
  type MovimientoFinanciero,
} from "@/lib/finanzas";
import { SelectorMes } from "./selector-mes";
import { GraficoHistorico, type PuntoHistorico } from "./grafico-historico";
import { MovimientoForm } from "./movimiento-form";
import { MovimientoFila } from "./movimiento-fila";
import { GastoRapido } from "./gasto-rapido";

const MESES_HISTORICO = 12;

export default async function FinanzasPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  await requireProfile("admin");
  const { mes: mesParam } = await searchParams;

  const actual = mesActual();
  const mes = esMesValido(mesParam) && mesParam <= actual ? mesParam : actual;
  const mesAnterior = sumarMeses(mes, -1);
  const hoy = fechaLima(0);

  const supabase = await createClient();
  const [{ data: resumen }, { data: categorias }, { data: movimientos }] = await Promise.all([
    supabase.rpc("resumen_financiero", { p_mes: `${mes}-01`, p_meses: MESES_HISTORICO }),
    supabase
      .from("categorias_financieras")
      .select("id, nombre, tipo, activa")
      .order("nombre")
      .returns<CategoriaFinanciera[]>(),
    supabase
      .from("movimientos_financieros")
      .select("id, fecha, tipo, categoria_id, monto, notas, compra_id")
      .gte("fecha", `${mes}-01`)
      .lte("fecha", ultimoDiaMes(mes))
      .order("fecha", { ascending: false })
      .order("created_at", { ascending: false })
      .returns<MovimientoFinanciero[]>(),
  ]);

  const filas = ((resumen ?? []) as FilaResumen[]).map((f) => ({ ...f, total: Number(f.total) }));
  const totalDe = (m: string, tipo: "ingreso" | "egreso") =>
    filas
      .filter((f) => f.mes.startsWith(m) && f.tipo === tipo)
      .reduce((suma, f) => suma + f.total, 0);

  const ingresos = totalDe(mes, "ingreso");
  const egresos = totalDe(mes, "egreso");
  const utilidad = ingresos - egresos;
  const ingresosAnt = totalDe(mesAnterior, "ingreso");
  const egresosAnt = totalDe(mesAnterior, "egreso");
  const utilidadAnt = ingresosAnt - egresosAnt;

  const historico: PuntoHistorico[] = Array.from({ length: MESES_HISTORICO }, (_, i) => {
    const m = sumarMeses(mes, i - (MESES_HISTORICO - 1));
    return {
      mes: m,
      etiqueta: nombreMes(m, true),
      etiquetaLarga: nombreMes(m),
      ingresos: totalDe(m, "ingreso"),
      egresos: totalDe(m, "egreso"),
    };
  });

  const desglose = (tipo: "ingreso" | "egreso") =>
    filas
      .filter((f) => f.mes.startsWith(mes) && f.tipo === tipo)
      .sort((a, b) => b.total - a.total);

  // Selector: los ultimos 24 meses hasta el actual, lo mas nuevo arriba.
  const opcionesMes = Array.from({ length: 24 }, (_, i) => sumarMeses(actual, -i)).map((m) => ({
    valor: m,
    etiqueta: nombreMes(m),
  }));
  if (!opcionesMes.some((o) => o.valor === mes)) {
    opcionesMes.push({ valor: mes, etiqueta: nombreMes(mes) });
  }

  const listaCategorias = categorias ?? [];
  const nombreCategoria = new Map(listaCategorias.map((c) => [c.id, c.nombre]));
  const hayDatos = filas.length > 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          etiqueta="Dinero"
          titulo={
            <>
              <em>Finanzas</em> del negocio
            </>
          }
          bajada="Lo que entra y lo que sale, mes a mes."
        />
        <SelectorMes mes={mes} opciones={opcionesMes} />
      </div>

      <section id="gasto" className="glass corte-asimetrico-sm p-5 sm:p-6">
        <h2 className="font-display text-xl font-extrabold tracking-[-0.02em] text-grafito mb-1">+ Anotar un gasto</h2>
        <p className="text-sm text-grafito/60 mb-4">De hoy. Los pagos de alumnos se anotan solos.</p>
        <GastoRapido categorias={categorias ?? []} hoy={hoy} />
      </section>

      <dl className="grid grid-cols-1 sm:grid-cols-3 rounded-2xl bg-ink text-white overflow-hidden">
        <Kpi titulo="Ingresos" monto={ingresos} cambio={variacion(ingresos, ingresosAnt)} subirEsBueno />
        <Kpi titulo="Egresos" monto={egresos} cambio={variacion(egresos, egresosAnt)} subirEsBueno={false} />
        <Kpi
          titulo="Utilidad neta"
          monto={utilidad}
          cambio={variacion(utilidad, utilidadAnt)}
          subirEsBueno
        />
      </dl>
      <p className="-mt-5 text-xs text-grafito/60">
        Comparado con {nombreMes(mesAnterior).toLowerCase()}.
      </p>

      <section className="glass corte-asimetrico-sm p-5 sm:p-6">
        <h2 className="font-display text-xl font-extrabold tracking-[-0.02em] text-grafito mb-4">Últimos 12 meses</h2>
        {hayDatos ? (
          <GraficoHistorico puntos={historico} />
        ) : (
          <p className="text-sm text-grafito/55 py-8 text-center">
            Todavía no hay movimientos registrados. Cuando cargues el primero, aquí vas a ver la
            tendencia mes a mes.
          </p>
        )}
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Desglose titulo="Ingresos por categoría" filas={desglose("ingreso")} total={ingresos} color="#256abf" />
        <Desglose titulo="Egresos por categoría" filas={desglose("egreso")} total={egresos} color="#c1291f" />
      </div>

      <section className="glass corte-asimetrico-sm p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="font-display text-xl font-extrabold tracking-[-0.02em] text-grafito">Registrar movimiento</h2>
          <Link
            href="/admin/finanzas/categorias"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-grafito/60 hover:text-rojo"
          >
            <Tags className="h-4 w-4" />
            Editar categorías
          </Link>
        </div>
        <MovimientoForm categorias={listaCategorias} hoy={hoy} />
        <p className="text-xs text-grafito/45 mt-4">
          Los pagos de paquetes que marcas en Pagos se registran solos como ingreso.
        </p>
      </section>

      <section className="glass corte-asimetrico-sm p-5 sm:p-6">
        <h2 className="font-display text-xl font-extrabold tracking-[-0.02em] text-grafito">
          Movimientos de {nombreMes(mes).toLowerCase()}
        </h2>
        {movimientos && movimientos.length > 0 ? (
          <ul className="divide-y divide-grafito/10 mt-2">
            {movimientos.map((m) => (
              <MovimientoFila
                key={m.id}
                movimiento={{ ...m, monto: Number(m.monto) }}
                categoria={nombreCategoria.get(m.categoria_id) ?? "Sin categoría"}
                categorias={listaCategorias}
                hoy={hoy}
              />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-grafito/55 mt-3">No hay movimientos en este mes.</p>
        )}
      </section>
    </div>
  );
}

function Kpi({
  titulo,
  monto,
  cambio,
  subirEsBueno,
}: {
  titulo: string;
  monto: number;
  cambio: number | null;
  subirEsBueno: boolean;
}) {
  let indicador = <span className="text-white/55">Sin mes anterior para comparar</span>;
  if (cambio !== null) {
    const redondeado = Math.round(cambio);
    const Icono = redondeado > 0 ? ArrowUpRight : redondeado < 0 ? ArrowDownRight : Minus;
    const bueno = redondeado === 0 ? null : redondeado > 0 === subirEsBueno;
    indicador = (
      <span
        className={`inline-flex items-center gap-1 font-semibold ${
          bueno === null ? "text-white/60" : bueno ? "text-green-400" : "text-red-400"
        }`}
      >
        <Icono className="h-3.5 w-3.5" strokeWidth={2.5} />
        {redondeado > 0 ? "+" : ""}
        {redondeado}% vs. mes anterior
      </span>
    );
  }

  return (
    <div className="relative px-6 pt-8 pb-7 before:absolute before:left-6 before:right-6 before:top-0 before:h-[3px] before:bg-rojo max-sm:border-t first:max-sm:border-t-0 sm:border-l first:sm:border-l-0 border-white/10">
      <dt className="text-[13.5px] text-white/60">{titulo}</dt>
      <dd
        className={`font-display text-[2.4rem] sm:text-[2.2rem] lg:text-[2.7rem] font-extrabold leading-none tracking-[-0.045em] tabular-nums mt-2.5 ${
          monto < 0 ? "text-red-400" : ""
        }`}
      >
        {soles(monto)}
      </dd>
      <p className="text-xs mt-3">{indicador}</p>
    </div>
  );
}

function Desglose({
  titulo,
  filas,
  total,
  color,
}: {
  titulo: string;
  filas: FilaResumen[];
  total: number;
  color: string;
}) {
  return (
    <section className="glass corte-asimetrico-sm p-5 sm:p-6">
      <h2 className="font-display text-lg font-extrabold tracking-[-0.02em] text-grafito mb-4">{titulo}</h2>
      {filas.length === 0 ? (
        <p className="text-sm text-grafito/55">Nada registrado este mes.</p>
      ) : (
        <ul className="space-y-3.5">
          {filas.map((f) => (
            <li key={f.categoria_id}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-grafito/80 truncate">{f.categoria}</span>
                <span className="font-semibold text-grafito tabular-nums shrink-0">{soles(f.total)}</span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-grafito/5 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${total > 0 ? (f.total / total) * 100 : 0}%`, background: color }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
