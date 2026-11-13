import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";

const NUMERO_WHATSAPP = "51990697634";

type CompraActiva = {
  id: string;
  precio: number;
  estado: string;
  modalidad_pago: string | null;
  paquete: { nombre: string } | null;
};

// Cuanto toca pagar ahora: con el 50% ya pagado toca la otra mitad; en dos
// partes, la primera mitad; si no, todo.
function montoAPagar(c: CompraActiva) {
  const mitad = Math.round((c.precio / 2) * 100) / 100;
  if (c.estado === "parcial") return { monto: c.precio - mitad, etiqueta: "Segundo pago (50% restante)" };
  if (c.modalidad_pago === "medio_medio") return { monto: mitad, etiqueta: "Primer pago (50%)" };
  return { monto: c.precio, etiqueta: "Pago total" };
}

// El pago se coordina por WhatsApp: el alumno escribe, nosotros validamos el
// pago y le liberamos las clases para que reserve.
export default async function PagoPage() {
  const profile = await requireProfile("alumno");
  const supabase = await createClient();

  const { data: compra } = await supabase
    .from("compras_paquete")
    .select("id, precio, estado, modalidad_pago, paquete:paquetes(nombre)")
    .neq("estado", "cancelado")
    .maybeSingle<CompraActiva>();

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
        <PageHeader etiqueta="Pago" titulo={<>Tu paquete está <em>pagado</em></>} bajada="No tienes nada pendiente." />
        <Link
          href="/alumno/horarios"
          className="btn-press inline-flex bg-rojo hover:bg-rojo-oscuro text-white font-semibold px-6 py-3 rounded-full"
        >
          Reservar mis clases
        </Link>
      </div>
    );
  }

  const { monto, etiqueta } = montoAPagar(compra);
  const nombrePaquete = compra.paquete?.nombre ?? "";
  const mensaje = encodeURIComponent(
    `Hola, soy ${profile.nombre}. Quiero coordinar mi pago del paquete ${nombrePaquete}: ${etiqueta.toLowerCase()}, S/ ${monto.toFixed(2)}.`,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        etiqueta="Pago"
        titulo={<>Tu pago se coordina por <em>WhatsApp</em></>}
        bajada={`${nombrePaquete} · ${etiqueta}`}
      />

      <div className="glass rounded-2xl p-6 space-y-4">
        <p className="text-sm text-grafito/60">Te toca pagar</p>
        <p className="font-display text-[2.6rem] font-extrabold leading-none tracking-[-0.05em] tabular-nums">
          S/ {monto.toFixed(2)}
        </p>
        <p className="text-sm text-grafito/70 leading-relaxed">
          Escríbenos por WhatsApp y te decimos cómo pagar (Yape, Plin, efectivo o tarjeta). Apenas
          validemos tu pago, te liberamos los cupos para que reserves tus clases.
        </p>
        <a
          href={`https://wa.me/${NUMERO_WHATSAPP}?text=${mensaje}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-press inline-flex items-center gap-2 bg-rojo hover:bg-rojo-oscuro text-white font-semibold px-6 py-3 rounded-full"
        >
          <MessageCircle className="h-5 w-5" />
          Escribir por WhatsApp
        </a>
      </div>
    </div>
  );
}
