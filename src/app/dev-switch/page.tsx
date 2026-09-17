import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Rol } from "@/lib/types";
import { entrarComo } from "./actions";

type PersonaFila = {
  id: string;
  nombre: string;
  telefono: string | null;
  rol: Rol;
};

const ETIQUETA_ESTADO: Record<string, { texto: string; clase: string }> = {
  pagado: { texto: "Pagado", clase: "bg-green-400/15 text-green-500" },
  parcial: { texto: "50% pagado", clase: "bg-yellow-400/15 text-yellow-600" },
  pendiente: { texto: "Sin pagar", clase: "bg-grafito/10 text-grafito/50" },
};

const PRIORIDAD_ESTADO: Record<string, number> = { pagado: 3, parcial: 2, pendiente: 1 };

function Grupo({
  titulo,
  items,
  estadoPorAlumno,
}: {
  titulo: string;
  items: PersonaFila[];
  estadoPorAlumno: Map<string, string>;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-grafito/50">{titulo}</p>
      {items.length === 0 ? (
        <p className="text-sm text-grafito/40">Nadie con este rol todavía.</p>
      ) : (
        <div className="space-y-2">
          {items.map((p) => {
            const estado = p.rol === "alumno" ? estadoPorAlumno.get(p.id) : undefined;
            const badge = estado ? ETIQUETA_ESTADO[estado] : null;
            return (
              <form action={entrarComo.bind(null, p.id)} key={p.id}>
                <button
                  type="submit"
                  className="w-full glass rounded-xl p-3.5 flex items-center justify-between gap-3 text-left hover:border-rojo/30 transition-colors"
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <span className="text-sm font-semibold text-grafito truncate">{p.nombre}</span>
                    <span className="text-xs text-grafito/50 shrink-0">{p.telefono || "sin celular"}</span>
                  </span>
                  {badge && (
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${badge.clase}`}
                    >
                      {badge.texto}
                    </span>
                  )}
                </button>
              </form>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default async function DevSwitchPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const supabase = createAdminClient();

  const { data: personas } = await supabase
    .from("profiles")
    .select("id, nombre, telefono, rol")
    .order("nombre")
    .returns<PersonaFila[]>();

  const { data: compras } = await supabase
    .from("compras_paquete")
    .select("alumno_id, estado")
    .neq("estado", "cancelado");

  const estadoPorAlumno = new Map<string, string>();
  for (const c of compras ?? []) {
    const actual = estadoPorAlumno.get(c.alumno_id);
    if (!actual || PRIORIDAD_ESTADO[c.estado] > PRIORIDAD_ESTADO[actual]) {
      estadoPorAlumno.set(c.alumno_id, c.estado);
    }
  }

  const todas = personas ?? [];
  const admins = todas.filter((p) => p.rol === "admin");
  const profesores = todas.filter((p) => p.rol === "profesor");
  const alumnos = todas.filter((p) => p.rol === "alumno");

  return (
    <div className="min-h-dvh px-5 py-10 max-w-lg mx-auto space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-grafito">Entrar como...</h1>
        <p className="text-sm text-grafito/60 mt-1">
          Solo para pruebas -- un click y entras a esa cuenta, sin PIN ni contraseña. Esta página
          no existe fuera de desarrollo.
        </p>
      </div>

      <Grupo titulo="Admin" items={admins} estadoPorAlumno={estadoPorAlumno} />
      <Grupo titulo="Profesores" items={profesores} estadoPorAlumno={estadoPorAlumno} />
      <Grupo titulo="Alumnos" items={alumnos} estadoPorAlumno={estadoPorAlumno} />
    </div>
  );
}
