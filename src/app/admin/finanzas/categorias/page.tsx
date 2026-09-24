import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { TitleAccent } from "@/components/title-accent";
import type { CategoriaFinanciera, TipoMovimiento } from "@/lib/finanzas";
import { CategoriaFila, NuevaCategoriaForm } from "./categoria-forms";

export default async function CategoriasPage() {
  await requireProfile("admin");

  const supabase = await createClient();
  const { data } = await supabase
    .from("categorias_financieras")
    .select("id, nombre, tipo, activa")
    .order("activa", { ascending: false })
    .order("nombre")
    .returns<CategoriaFinanciera[]>();

  const categorias = data ?? [];

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/finanzas"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-grafito/60 hover:text-rojo mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Finanzas
        </Link>
        <h1 className="font-display text-2xl font-bold text-grafito">Categorías</h1>
        <TitleAccent className="w-10 h-1 mt-2" />
        <p className="text-grafito/60 mt-1">
          Las opciones que aparecen al registrar un ingreso o un egreso.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(["ingreso", "egreso"] as TipoMovimiento[]).map((tipo) => (
          <section key={tipo} className="glass corte-asimetrico-sm p-5 sm:p-6">
            <h2 className="font-display text-lg font-semibold text-grafito">
              {tipo === "ingreso" ? "Ingresos" : "Egresos"}
            </h2>
            <ul className="divide-y divide-grafito/10 mt-2">
              {categorias
                .filter((c) => c.tipo === tipo)
                .map((c) => (
                  <CategoriaFila key={c.id} categoria={c} />
                ))}
            </ul>
            <div className="mt-4 pt-4 border-t border-grafito/10">
              <NuevaCategoriaForm tipo={tipo} />
            </div>
          </section>
        ))}
      </div>

      <p className="text-xs text-grafito/45 max-w-lg">
        Archivar una categoría la saca del formulario, pero los movimientos que ya tiene siguen
        contando en los totales de sus meses. Puedes reactivarla cuando quieras.
      </p>
    </div>
  );
}
