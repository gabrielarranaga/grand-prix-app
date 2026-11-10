import Image from "next/image";
import { cerrarSesion } from "@/app/(auth)/actions";

// Cabecera igual a la de la landing: tinta oscura, logo con aro blanco,
// nombre en Bricolage y etiqueta mono. La tira de bandera cierra el borde.
export function DashboardHeader({
  nombre,
  etiquetaRol,
}: {
  nombre: string;
  etiquetaRol: string;
}) {
  return (
    <header className="sticky top-0 z-20 bg-ink text-white">
      <div className="max-w-5xl mx-auto px-5 h-[66px] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/logo-mark.png"
            alt="Grand Prix"
            width={42}
            height={42}
            className="h-[42px] w-[42px] rounded-full shadow-[0_0_0_2px_rgba(255,255,255,0.9)]"
          />
          <div>
            <p className="font-display text-[17px] font-extrabold leading-[1.1] tracking-[-0.02em]">
              Grand Prix
            </p>
            <p className="font-mono text-[9.5px] font-medium uppercase tracking-[0.16em] text-white/60 mt-[5px]">
              {etiquetaRol}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm hidden sm:inline text-white/80">{nombre}</span>
          <form action={cerrarSesion}>
            <button
              type="submit"
              className="btn-press h-10 px-4 rounded-[10px] border-[1.5px] border-white/30 text-sm font-semibold hover:bg-white hover:text-grafito hover:border-white"
            >
              Salir
            </button>
          </form>
        </div>
      </div>
      <div className="checker checker-claro !h-[6px] !bg-[length:6px_6px] opacity-80" aria-hidden="true" />
    </header>
  );
}
