import Link from "next/link";
import { Lock, ArrowRight } from "lucide-react";

export function AccesoBloqueado({ seccion }: { seccion: string }) {
  return (
    <div className="animate-in glass corte-asimetrico p-8 sm:p-10 text-center max-w-md mx-auto mt-10">
      <span className="inline-flex h-14 w-14 rounded-full bg-rojo/15 text-rojo items-center justify-center mb-5">
        <Lock className="h-6 w-6" />
      </span>
      <h1 className="font-display text-xl font-bold text-grafito tracking-tight">
        {seccion} está bloqueado
      </h1>
      <p className="text-sm text-grafito/60 mt-2 leading-relaxed">
        Para reservar clases necesitas haber pagado al menos el 50% de un paquete. Elige tu
        paquete y coordina el pago con nosotros por WhatsApp.
      </p>
      <Link
        href="/alumno/paquetes"
        className="btn-press glow-rojo mt-6 inline-flex items-center justify-center gap-2 bg-rojo text-white font-semibold px-6 py-3 rounded-full"
      >
        Ver paquetes
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
