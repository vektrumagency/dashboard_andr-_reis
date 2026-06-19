"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Leads", icon: "◆" },
  { href: "/mapa", label: "Mapa", icon: "▲" },
  { href: "/outreach", label: "Outreach", icon: "✉" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 shrink-0 flex-col bg-zinc-950 px-4 py-6 text-zinc-300">
      <div className="mb-8 px-2">
        <p className="font-mono text-xs uppercase tracking-widest text-zinc-500">Vektrum</p>
        <p className="text-sm font-semibold text-white">André Reis</p>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
              }`}
            >
              <span className="font-mono text-xs text-zinc-500">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-2 pt-6 text-xs text-zinc-600">
        <p>Cascais · mock data</p>
      </div>
    </aside>
  );
}
