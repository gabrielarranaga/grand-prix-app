import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { TitleAccent } from "@/components/title-accent";
import { ConfiguracionFormulario } from "./formulario";

export default async function ConfiguracionPage() {
  await requireProfile("admin");
  const supabase = await createClient();

  const { data: config } = await supabase
    .from("configuracion_negocio")
    .select("punto_encuentro_texto, punto_encuentro_maps_link")
    .eq("id", true)
    .single();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-grafito">Ajustes</h1>
        <TitleAccent className="w-10 h-1 mt-2" />
        <p className="text-grafito/60 mt-1">
          Datos que se usan en los recordatorios automáticos de clase.
        </p>
      </div>

      <ConfiguracionFormulario
        puntoEncuentroTexto={config?.punto_encuentro_texto ?? ""}
        puntoEncuentroMapsLink={config?.punto_encuentro_maps_link ?? ""}
      />
    </div>
  );
}
