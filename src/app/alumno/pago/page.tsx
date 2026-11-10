import Link from "next/link";
import { CheckCircle2, Clock } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { SubirComprobante } from "./subir-comprobante";
import { CopiarNumero } from "./copiar-numero";

const NUMERO_WHATSAPP = "51990697634";

type CompraActiva = {
  id: string;
  precio: number;
  estado: string;
  modalidad_pago: string | null;
  paquete: { nombre: string } | null;
};

type Comprobante = {
  estado: string;
  tramo: string;
  monto: number;
  created_at: string;
};

// Mismo calculo que registrar_comprobante() en la base (fix-21): con el 50%
// ya pagado toca la otra mitad; en dos partes, la primera mitad; si no, todo.
function montoAPagar(c: CompraActiva) {
  const mitad = Math.round((c.precio / 2) * 100) / 100;
  if (c.estado === "parcial") return { monto: c.precio - mitad, etiqueta: "Segundo pago (50% restante)" };
  if (c.modalidad_pago === "medio_medio") return { monto: mitad, etiqueta: "Primer pago (50%)" };
  return { monto: c.precio, etiqueta: "Pago total" };
}

export default async function PagoPage() {
  const profile = await requireProfile("alumno");
  const supabase = await createClient();

  const [{ data: compra }, { data: config }] = await Promise.all([
    supabase
      .from("compras_paquete")
      .select("id, precio, estado, modalidad_pago, paquete:paquetes(nombre)")
      .neq("estado", "cancelado")
      .maybeSingle<CompraActiva>(),
    supabase.from("configuracion_negocio").select("yape_numero, yape_titular").eq("id", true).maybeSingle(),
  ]);

  if (!compra) {
    return (
      <div className="space-y-6">
        <PageHeader etiqueta="Pago" titulo={<>Todavía no elegiste <em>paquete</em></>} />
        <Link
          href="/alumno/paquetes"
          className="btn-press inline-flex bg-rojo hover:bg-rojo-oscuro text-white font-semibold px-6 py-3 rounded-full"
        >
          Ver paquetes
        </Link>
      </div>
    );
  }

  if (compra.estado === "pagado") {
    return (
      <div className="space-y-6">
        <PageHeader
          etiqueta="Pago"
          titulo={<>Tu paquete está <em>pagado</em></>}
          bajada={`${compra.paquete?.nombre ?? "Paquete"} · S/ ${compra.precio.toLocaleString("es-PE")}`}
        />
        <Link
          href="/alumno/horarios"
          className="btn-press inline-flex bg-rojo hover:bg-rojo-oscuro text-white font-semibold px-6 py-3 rounded-full"
        >
          Reservar mis clases
        </Link>
      </div>
    );
  }

  const { data: ultimo } = await supabase
    .from("comprobantes_pago")
    .select("estado, tramo, monto, created_at")
    .eq("compra_id", compra.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<Comprobante>();

  const { monto, etiqueta } = montoAPagar(compra);
  const yapeNumero = config?.yape_numero || "990697634";
  const yapeTitular = config?.yape_titular || "";
  const enRevision = ultimo?.estado === "pendiente";
  const rechazado = ultimo?.estado === "rechazado";

  const mensajeWhatsapp = encodeURIComponent(
    `Hola, soy ${profile.nombre}. Quiero pagar mi paquete ${compra.paquete?.nombre ?? ""} (${etiqueta.toLowerCase()}: S/ ${monto.toFixed(2)}) en efectivo o con tarjeta.`,
  );

  return (
    <div className="max-w-xl space-y-6">
      <PageHeader
        etiqueta="Pago"
        titulo={<>Paga con <em>Yape</em> o Plin</>}
        bajada={`${compra.paquete?.nombre ?? "Paquete"} · ${etiqueta}`}
      />

      {enRevision ? (
        <div className="animate-in glass rounded-2xl p-6 flex gap-4">
          <Clock className="h-6 w-6 text-rojo shrink-0" />
          <div>
            <p className="font-semibold text-grafito">Recibimos tu comprobante</p>
            <p className="text-sm text-grafito/65 mt-1">
              Lo estamos revisando. Apenas lo confirmemos se te desbloquean tus horarios. Normalmente
              es el mismo día.
            </p>
          </div>
        </div>
      ) : (
        <>
          {rechazado && (
            <div className="rounded-xl bg-white border border-rojo/40 border-l-4 border-l-rojo px-4 py-3.5 text-sm text-grafito">
              No pudimos validar tu comprobante anterior. Revisa el monto y vuelve a enviarlo, o
              escríbenos por WhatsApp.
            </div>
          )}

          <ol className="animate-in glass corte-asimetrico p-6 sm:p-7 space-y-6">
            <li className="flex gap-4">
              <span className="font-display text-xl font-extrabold text-rojo w-6 shrink-0">1</span>
              <div className="min-w-0">
                <p className="font-semibold text-grafito">Yapea o plinea este monto</p>
                <p className="font-display text-[2.6rem] font-extrabold leading-none tracking-[-0.05em] text-grafito tabular-nums mt-2">
                  S/ {monto.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                </p>
                <div className="mt-3">
                  <CopiarNumero numero={yapeNumero} />
                  {yapeTitular && <p className="text-sm text-grafito/60 mt-1.5">A nombre de {yapeTitular}</p>}
                </div>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="font-display text-xl font-extrabold text-rojo w-6 shrink-0">2</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-grafito">Sube la captura del pago</p>
                <p className="text-sm text-grafito/60 mt-1">La foto de la pantalla de Yape o Plin que dice &quot;¡Yapeaste!&quot;.</p>
                <div className="mt-3">
                  <SubirComprobante compraId={compra.id} alumnoId={profile.id} />
                </div>
              </div>
            </li>
          </ol>
        </>
      )}

      <p className="text-sm text-grafito/60 flex items-start gap-2">
        <CheckCircle2 className="h-4 w-4 text-rojo shrink-0 mt-0.5" />
        <span>
          ¿Prefieres pagar en efectivo o con tarjeta?{" "}
          <a
            href={`https://wa.me/${NUMERO_WHATSAPP}?text=${mensajeWhatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-rojo font-semibold underline"
          >
            Escríbenos por WhatsApp
          </a>
          .
        </span>
      </p>
    </div>
  );
}
