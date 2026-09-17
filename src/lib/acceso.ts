import { createClient } from "@/lib/supabase/server";

// En true: horarios/agenda solo se desbloquean con 50% pagado o mas.
const BLOQUEO_ACTIVO = true;

// Un alumno desbloquea horarios/agenda cuando pago al menos el 50% de
// algun paquete (estado 'parcial' o 'pagado'). RLS ya limita esta consulta
// a las compras del propio alumno autenticado.
export async function tieneAccesoAHorarios(): Promise<boolean> {
  if (!BLOQUEO_ACTIVO) return true;

  const supabase = await createClient();
  const { count } = await supabase
    .from("compras_paquete")
    .select("id", { count: "exact", head: true })
    .in("estado", ["parcial", "pagado"]);

  return (count ?? 0) > 0;
}
