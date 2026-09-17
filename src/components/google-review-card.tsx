import { Star } from "lucide-react";
import { LINK_RESENA_GOOGLE } from "@/lib/enlaces";

export function GoogleReviewCard() {
  return (
    <div className="animate-in glass corte-asimetrico-sm p-5 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex gap-0.5 text-rojo">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-current" />
          ))}
        </div>
        <p className="text-sm font-semibold text-grafito mt-1.5">¿Contento con tu clase?</p>
        <p className="text-xs text-grafito/60 mt-0.5">
          Cuéntaselo a otros con una reseña en Google. Nos ayuda muchísimo.
        </p>
      </div>
      <a
        href={LINK_RESENA_GOOGLE}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-press glow-rojo shrink-0 rounded-full bg-rojo text-white text-xs font-semibold px-4 py-2.5 text-center"
      >
        Reseñar
      </a>
    </div>
  );
}
