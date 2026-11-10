import Image from "next/image";
import { Star } from "lucide-react";
import { LINK_RESENA_GOOGLE } from "@/lib/enlaces";

export default function ResenasPage() {
  return (
    <div className="space-y-6">
      <div className="animate-in corte-asimetrico relative overflow-hidden h-56 sm:h-64 max-sm:landscape:h-40 bg-ink isolate">
        <Image
          src="/resenas-hero.jpg"
          alt="Alumno feliz con su experiencia en Grand Prix"
          fill
          priority
          quality={90}
          className="object-cover object-[58%_26%] -z-20"
          sizes="(min-width: 1024px) 800px, 100vw"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/55 to-ink/10" />
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
          <p className="tag tag-claro">Reseñas de Google</p>
          <h1 className="titular text-[2rem] sm:text-[2.6rem] text-white !leading-[1] !tracking-[-0.045em] mt-3">
            ¿Te gustó tu <em>experiencia</em>?
          </h1>
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
