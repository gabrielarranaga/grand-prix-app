"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Package,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  Lock,
  Wallet,
  Star,
  Gift,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

const ICONOS: Record<string, LucideIcon> = {
  home: Home,
  package: Package,
  calendar: CalendarDays,
  clipboard: ClipboardList,
  dashboard: LayoutDashboard,
  wallet: Wallet,
  users: Users,
  star: Star,
  gift: Gift,
  settings: Settings,
};

export type NavItem = {
  href: string;
  label: string;
  icon: keyof typeof ICONOS;
  bloqueado?: boolean;
};

export function DashboardNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 z-20 flex justify-center px-4 pointer-events-none"
      style={{ bottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
    >
      <div className="glass pointer-events-auto rounded-full p-1.5 flex items-center gap-1">
        {items.map(({ href, label, icon, bloqueado }) => {
          const Icon = ICONOS[icon];
          const externo = href.startsWith("http");
          const activo =
            !externo &&
            (href === "/alumno" || href === "/profesor" || href === "/admin"
              ? pathname === href
              : pathname === href || pathname.startsWith(href + "/"));
          return (
            <Link
              key={href}
              href={href}
              target={externo ? "_blank" : undefined}
              rel={externo ? "noopener noreferrer" : undefined}
              aria-label={bloqueado ? `${label} (bloqueado)` : label}
              className={`btn-press relative flex items-center justify-center h-12 rounded-full transition-[width] ${
                activo
                  ? "w-auto px-4 gap-2 bg-rojo text-white shadow-md shadow-rojo/30"
                  : "w-12 text-grafito/50 hover:text-rojo hover:bg-rojo/5"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" strokeWidth={activo ? 2.25 : 2} />
              {activo && <span className="text-sm font-semibold whitespace-nowrap">{label}</span>}
              {bloqueado && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-rojo text-white flex items-center justify-center">
                  <Lock className="h-2.5 w-2.5" strokeWidth={3} />
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
