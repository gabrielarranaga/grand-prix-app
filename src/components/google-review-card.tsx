import { Star } from "lucide-react";
import { LINK_RESENA_GOOGLE } from "@/lib/enlaces";

export function GoogleReviewCard() {
  return (
    <div className="animate-in rounded-2xl bg-grafito text-white p-5 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex gap-0.5 text-rojo">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-current" />
          ))}
        </div>
        <p className="font-display text-base font-bold tracking-[-0.015em] mt-1.5">¿Contento con tu clase?</p>
        <p className="text-xs text-white/65 mt-0.5">
          Cuéntaselo a otros con una reseña en Google. Nos ayuda muchísimo.
        </p>
      </div>
      <a
        href={LINK_RESENA_GOOGLE}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-press glow-rojo shrink-0 rounded-[10px] bg-rojo hover:bg-rojo-oscuro text-white text-sm font-bold h-11 px-5 inline-flex items-center text-center"
      >
        Reseñar
      </a>
    </div>
  );
}
