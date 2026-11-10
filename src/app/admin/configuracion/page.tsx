import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { ConfiguracionFormulario } from "./formulario";

export default async function ConfiguracionPage() {
  await requireProfile("admin");
  const supabase = await createClient();

  const { data: config } = await supabase
    .from("configuracion_negocio")
    .select("punto_encuentro_texto, punto_encuentro_maps_link, yape_numero, yape_titular")
    .eq("id", true)
    .single();

  return (
    <div className="space-y-8">
      <PageHeader
        etiqueta="Configuración"
        titulo={
          <>
            <em>Ajustes</em> del negocio
          </>
        }
        bajada="Datos que ven los alumnos al pagar y en los recordatorios de clase."
      />

      <ConfiguracionFormulario
        puntoEncuentroTexto={config?.punto_encuentro_texto ?? ""}
        puntoEncuentroMapsLink={config?.punto_encuentro_maps_link ?? ""}
        yapeNumero={config?.yape_numero ?? ""}
        yapeTitular={config?.yape_titular ?? ""}
      />
    </div>
  );
}
