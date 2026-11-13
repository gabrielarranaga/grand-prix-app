import { requireProfile } from "@/lib/auth";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardNav, type NavItem } from "@/components/dashboard-nav";

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Resumen", icon: "dashboard" },
  { href: "/admin/horarios", label: "Horarios", icon: "calendar" },
  { href: "/admin/pagos", label: "Pagos", icon: "wallet" },
  { href: "/admin/alumnos", label: "Alumnos", icon: "users" },
  { href: "/admin/configuracion", label: "Ajustes", icon: "settings" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile("admin");

  return (
    <>
      <DashboardHeader nombre={profile.nombre} etiquetaRol="Administrador" />
      <main className="max-w-5xl mx-auto px-5 pt-8 pb-28 w-full">{children}</main>
      <DashboardNav items={NAV_ITEMS} />
    </>
  );
}
