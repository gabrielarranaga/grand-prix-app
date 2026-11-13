import { nombreMes, soles, sumarMeses, type CategoriaFinanciera } from "@/lib/finanzas";

type Mov = { tipo: "ingreso" | "egreso"; monto: number; fecha: string; categoria_id: string };

const COLORES = ["#E4231F", "#2B2724", "#F5A623", "#6B7280", "#B91C1C", "#9CA3AF", "#D97706", "#44403C"];

// Resumen simple: en que se fue la plata este mes (grafico circular) y, en
// una tabla, cuanto entro, salio y quedo en los ultimos 3 meses.
export function CuentasDelMes({
  mes,
  movimientos,
  categorias,
}: {
  mes: string;
  movimientos: Mov[];
  categorias: CategoriaFinanciera[];
}) {
  const nombre = new Map(categorias.map((c) => [c.id, c.nombre]));

  const porCategoria = new Map<string, number>();
  for (const m of movimientos) {
    if (m.tipo !== "egreso" || m.fecha.slice(0, 7) !== mes) continue;
    porCategoria.set(m.categoria_id, (porCategoria.get(m.categoria_id) ?? 0) + m.monto);
  }
  const partes = [...porCategoria.entries()]
    .map(([id, total]) => ({ nombre: nombre.get(id) ?? "Otros", total }))
    .sort((a, b) => b.total - a.total);
  const totalEgresos = partes.reduce((s, p) => s + p.total, 0);

  const R = 52;
  const C = 2 * Math.PI * R;
  let acumulado = 0;

  const meses = [sumarMeses(mes, -2), sumarMeses(mes, -1), mes];
  const filas = meses.map((m) => {
    const delMes = movimientos.filter((x) => x.fecha.slice(0, 7) === m);
    const entro = delMes.filter((x) => x.tipo === "ingreso").reduce((s, x) => s + x.monto, 0);
    const salio = delMes.filter((x) => x.tipo === "egreso").reduce((s, x) => s + x.monto, 0);
    return { m, entro, salio };
  });

  return (
    <section className="glass corte-asimetrico-sm p-5 sm:p-6 space-y-6">
      <div>
        <h2 className="font-display text-lg font-extrabold tracking-[-0.02em] text-grafito">¿En qué gasté este mes?</h2>
        {totalEgresos === 0 ? (
          <p className="text-sm text-grafito/60 mt-2">Todavía no anotaste gastos este mes.</p>
        ) : (
          <div className="mt-4 flex flex-col sm:flex-row items-center gap-6">
            <svg viewBox="0 0 140 140" className="h-40 w-40 shrink-0 -rotate-90" role="img" aria-label="Gastos por categoría">
              {partes.map((p, i) => {
                const largo = (p.total / totalEgresos) * C;
                const circulo = (
                  <circle
                    key={p.nombre}
                    cx="70"
                    cy="70"
                    r={R}
                    fill="none"
                    stroke={COLORES[i % COLORES.length]}
                    strokeWidth="26"
                    strokeDasharray={`${largo} ${C - largo}`}
                    strokeDashoffset={-acumulado}
                  />
                );
                acumulado += largo;
                return circulo;
              })}
            </svg>
            <ul className="w-full space-y-2 text-sm">
              {partes.map((p, i) => (
                <li key={p.nombre} className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-sm shrink-0" style={{ background: COLORES[i % COLORES.length] }} />
                  <span className="text-grafito/80 flex-1">{p.nombre}</span>
                  <span className="tabular-nums font-semibold text-grafito">{soles(p.total)}</span>
                  <span className="tabular-nums text-grafito/50 w-10 text-right">
                    {Math.round((p.total / totalEgresos) * 100)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div>
        <h3 className="font-display text-base font-extrabold tracking-[-0.02em] text-grafito mb-2">Entró y salió</h3>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-grafito/50 text-xs uppercase tracking-wide">
              <th className="py-1.5 font-semibold">Mes</th>
              <th className="py-1.5 font-semibold text-right">Entró</th>
              <th className="py-1.5 font-semibold text-right">Salió</th>
              <th className="py-1.5 font-semibold text-right">Quedó</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.m} className="border-t border-grafito/10 tabular-nums">
                <td className="py-2 text-grafito/80">{nombreMes(f.m, true)}</td>
                <td className="py-2 text-right">{soles(f.entro)}</td>
                <td className="py-2 text-right">{soles(f.salio)}</td>
                <td className={`py-2 text-right font-semibold ${f.entro - f.salio < 0 ? "text-rojo" : "text-grafito"}`}>
                  {soles(f.entro - f.salio)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
