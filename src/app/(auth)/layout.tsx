import Image from "next/image";
import { Award, ShieldCheck, Car } from "lucide-react";

const BENEFICIOS = [
  {
    icon: Award,
    titulo: "31 años de trayectoria",
    texto: "Formando conductores en Lima desde 1995, con más de 1,000 alumnos que ya tienen su brevete.",
  },
  {
    icon: ShieldCheck,
    titulo: "Sin gritos ni apuros",
    texto: "Nuestro equipo de instructores tiene paciencia y se adapta a tu nivel, clase a clase.",
  },
  {
    icon: Car,
    titulo: "Flota 100% automática",
    texto: "Te concentras en manejar, sin pelearte con el embrague.",
  },
];

// Pantalla de entrada con el mismo lenguaje del hero de la landing: tinta
// oscura, foto con velo, titular con la palabra clave en rojo y bandera.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-dvh flex flex-col">
      <div className="relative overflow-hidden bg-ink px-6 pt-8 pb-24 sm:px-10 sm:pt-12 sm:pb-32 isolate">
        <Image
          src="/instructor-sonriendo.jpg"
          alt=""
          fill
          priority
          quality={90}
          className="object-cover object-[50%_38%] -z-20"
          sizes="(min-width: 1024px) 1200px, 100vw"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink via-ink/85 to-ink/30" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />

        <div className="relative max-w-3xl mx-auto animate-in">
          <div className="flex items-center gap-3 mb-10">
            <Image
              src="/logo-mark.png"
              alt="Grand Prix"
              width={42}
              height={42}
              priority
              className="h-[42px] w-[42px] rounded-full shadow-[0_0_0_2px_rgba(255,255,255,0.9)]"
            />
            <div>
              <p className="font-display text-[17px] font-extrabold leading-[1.1] tracking-[-0.02em] text-white">
                Grand Prix
              </p>
              <p className="font-mono text-[9.5px] font-medium uppercase tracking-[0.16em] text-white/60 mt-[5px]">
                Escuela de manejo
              </p>
            </div>
          </div>

          <p className="tag tag-claro">Escuela de manejo en San Miguel, Lima</p>
          <h1 className="titular text-[2.4rem] sm:text-[3.4rem] text-white !leading-[1] !tracking-[-0.045em] mt-5 max-w-xl">
            La escuela correcta, con el <em>método correcto</em>
          </h1>
          <p className="text-[15.5px] sm:text-[17px] text-white/75 mt-6 max-w-md leading-[1.7]">
            Aquí reservas tus clases, revisas tu horario y sigues tu progreso. La instrucción al
            volante la sigues recibiendo con el mismo equipo de siempre.
          </p>
        </div>
        <div
          className="checker checker-claro absolute inset-x-0 bottom-0 !h-3 opacity-90"
          aria-hidden="true"
        />
      </div>

      <div className="flex-1 px-5 sm:px-10 -mt-12 sm:-mt-16 pb-14 relative">
        <div className="max-w-3xl mx-auto">
          <div className="animate-in max-w-sm mx-auto bg-white rounded-2xl border border-grafito/[0.13] shadow-[0_50px_90px_-50px_rgba(27,24,22,0.6)] p-6 sm:p-8">
            {children}
          </div>

          <ul className="animate-in mt-12 border-t border-grafito/[0.13]">
            {BENEFICIOS.map(({ icon: Icon, titulo, texto }) => (
              <li
                key={titulo}
                className="group grid grid-cols-[52px_1fr] gap-[18px] items-center py-5 border-b border-grafito/[0.13]"
              >
                <span className="h-[52px] w-[52px] rounded-xl grid place-items-center bg-grafito text-white transition-[background-color,transform] duration-300 group-hover:bg-rojo group-hover:-rotate-[8deg]">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-display text-[18.5px] font-bold leading-tight tracking-[-0.015em] text-grafito">
                    {titulo}
                  </p>
                  <p className="text-[15px] text-grafito/65 mt-0.5 leading-snug">{texto}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
