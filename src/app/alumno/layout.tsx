import { requireProfile } from "@/lib/auth";
import { tieneAccesoAHorarios } from "@/lib/acceso";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardNav, type NavItem } from "@/components/dashboard-nav";

export default async function AlumnoLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile("alumno");
  const acceso = await tieneAccesoAHorarios();

  const navItems: NavItem[] = [
    { href: "/alumno", label: "Inicio", icon: "home" },
    { href: "/alumno/paquetes", label: "Paquetes", icon: "package" },
    { href: "/alumno/horarios", label: "Horarios", icon: "calendar", bloqueado: !acceso },
    { href: "/alumno/agenda", label: "Mi agenda", icon: "clipboard", bloqueado: !acceso },
    { href: "/alumno/resenas", label: "Reseñas", icon: "star" },
  ];

  return (
    <>
      <DashboardHeader nombre={profile.nombre} etiquetaRol="Alumno" />
      <main className="max-w-5xl mx-auto px-5 pt-8 pb-28 w-full">{children}</main>
      <DashboardNav items={navItems} />
    </>
  );
}
