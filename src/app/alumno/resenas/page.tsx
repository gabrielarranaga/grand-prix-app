import Image from "next/image";
import { Star } from "lucide-react";
import { TitleAccent } from "@/components/title-accent";
import { LINK_RESENA_GOOGLE } from "@/lib/enlaces";

export default function ResenasPage() {
  return (
    <div className="space-y-6">
      <div className="animate-in corte-asimetrico relative overflow-hidden h-56 sm:h-64 max-sm:landscape:h-40">
        <Image
          src="/resenas-hero.jpg"
          alt="Alumno feliz con su experiencia en Grand Prix"
          fill
          priority
          quality={90}
          className="object-cover object-[58%_26%]"
          sizes="(min-width: 1024px) 800px, 100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-vino-oscuro/90 via-vino/50 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
            ¿Te gustó tu experiencia?
          </h1>
          <TitleAccent className="w-10 h-1 mt-2" />
        </div>
      </div>

      <div className="animate-in glass corte-asimetrico-sm p-6 sm:p-8 text-center">
        <div className="flex justify-center gap-1.5 text-rojo">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="h-7 w-7 fill-current" />
          ))}
        </div>
        <p className="text-sm text-grafito/70 mt-4 max-w-sm mx-auto leading-relaxed">
          Si te gustó tu clase con Grand Prix, cuéntaselo a otros con una reseña en Google. Nos
          ayuda muchísimo a seguir creciendo.
        </p>
        <a
          href={LINK_RESENA_GOOGLE}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-press glow-rojo mt-6 inline-flex items-center justify-center gap-2 bg-rojo text-white font-semibold px-6 py-3 rounded-full"
        >
          Dejar una reseña en Google
        </a>
      </div>
    </div>
  );
}
