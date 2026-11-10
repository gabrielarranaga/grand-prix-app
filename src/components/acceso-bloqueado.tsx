import Link from "next/link";
import { Lock, ArrowRight } from "lucide-react";

export function AccesoBloqueado({ seccion }: { seccion: string }) {
  return (
    <div className="animate-in glass corte-asimetrico p-8 sm:p-10 text-center max-w-md mx-auto mt-10">
      <span className="flex mx-auto h-14 w-14 rounded-xl bg-grafito text-white items-center justify-center mb-5">
        <Lock className="h-6 w-6" />
      </span>
      <p className="tag justify-center">Acceso</p>
      <h1 className="titular text-[1.7rem] text-grafito mt-2.5">
        {seccion} está <em>bloqueado</em>
      </h1>
      <p className="text-sm text-grafito/65 mt-3 leading-relaxed">
        Para reservar clases necesitas haber pagado al menos el 50% de un paquete. Elige tu
        paquete y paga con Yape o Plin desde la app.
      </p>
      <Link
        href="/alumno"
        className="btn-press glow-rojo mt-6 inline-flex items-center justify-center gap-2 bg-rojo text-white font-semibold px-6 py-3 rounded-full"
      >
        Ver qué me falta
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
