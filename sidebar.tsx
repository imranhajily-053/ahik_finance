"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Building2,
  HandCoins,
  PartyPopper,
  Moon,
  Landmark,
  ScrollText,
  Settings,
  LogOut,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["EXECUTIVE", "READER", "ADMIN"] },
  { href: "/ledger", label: "Daxilolmaların ümumi uçotu", icon: BookOpen, roles: ["EXECUTIVE", "READER", "ADMIN"] },
  { href: "/membership-fees", label: "Üzvlük haqları", icon: Users, roles: ["EXECUTIVE", "READER", "ADMIN"] },
  { href: "/sanatorium", label: "Sanatoriyaların inkişafı", icon: Building2, roles: ["EXECUTIVE", "READER", "ADMIN"] },
  { href: "/debt", label: "Borc ödənişləri", icon: HandCoins, roles: ["EXECUTIVE", "READER", "ADMIN"] },
  { href: "/cultural-events", label: "Mədəni-kütləvi tədbirlər", icon: PartyPopper, roles: ["EXECUTIVE", "READER", "ADMIN"] },
  { href: "/overnight", label: "Overnight", icon: Moon, roles: ["EXECUTIVE", "READER", "ADMIN"] },
  { href: "/president-administration", label: "Prezident Administrasiyası", icon: Landmark, roles: ["EXECUTIVE", "READER", "ADMIN"] },
  { href: "/audit-log", label: "Audit Log", icon: ScrollText, roles: ["EXECUTIVE", "ADMIN"] },
  { href: "/settings", label: "Ayarlar", icon: Settings, roles: ["ADMIN"] },
];

export function Sidebar({ role }: { role: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:flex-col w-72 shrink-0 bg-brand-900 text-white min-h-screen">
      <div className="px-6 py-6 border-b border-white/10">
        <div className="text-sm uppercase tracking-wider text-brand-200">AHİK</div>
        <div className="text-base font-semibold">Maliyyə İnformasiya Sistemi</div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.filter((item) => item.roles.includes(role)).map((item) => {
          const Icon = item.icon;
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition",
                active ? "bg-brand-600 text-white" : "text-brand-200 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-brand-200 hover:bg-white/5 hover:text-white transition"
        >
          <LogOut size={18} />
          Çıxış
        </button>
      </div>
    </aside>
  );
}
