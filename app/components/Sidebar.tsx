"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ALL_STATUSES, STATUS_LABELS } from "@/lib/leads";
import { useLeads } from "@/lib/leadsStore";

const NAV_ITEMS = [
  { href: "/mapa", label: "Mapa", icon: "▲" },
  { href: "/atacar", label: "Atacar", icon: "✉" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { leads } = useLeads();
  const onLeadsPage = pathname === "/";
  const activeStatus = onLeadsPage ? searchParams.get("status") : null;

  if (pathname === "/login") return null;

  const statusCounts = Object.fromEntries(
    ALL_STATUSES.map((status) => [status, leads.filter((lead) => lead.status === status).length]),
  ) as Record<(typeof ALL_STATUSES)[number], number>;
  const pendingCount = statusCounts.new;
  const decidedStatuses = ALL_STATUSES.filter((status) => status !== "new");

  return (
    <aside className="flex w-56 shrink-0 flex-col bg-zinc-950 px-4 py-6 text-zinc-300">
      <div className="mb-8 px-2">
        <p className="font-mono text-xs uppercase tracking-widest text-zinc-500">Vektrum</p>
        <p className="text-sm font-semibold text-white">André Reis</p>
      </div>

      <nav className="flex flex-col gap-1">
        <Link
          href="/"
          className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            onLeadsPage && !activeStatus
              ? "bg-zinc-800 text-white"
              : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
          }`}
        >
          <span className="font-mono text-xs text-zinc-500">◆</span>
          Leads
          <span className="ml-auto font-mono text-xs text-zinc-500">{pendingCount}</span>
        </Link>

        <div className="ml-6 flex flex-col gap-0.5 border-l border-zinc-800 pl-3">
          {decidedStatuses.map((status) => (
            <Link
              key={status}
              href={`/?status=${status}`}
              className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors ${
                activeStatus === status
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"
              }`}
            >
              {STATUS_LABELS[status]}
              <span className="ml-auto font-mono text-[11px] text-zinc-600">
                {statusCounts[status]}
              </span>
            </Link>
          ))}
        </div>

        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
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

      <div className="mt-auto flex flex-col gap-3 px-2 pt-6 text-xs text-zinc-600">
        <button
          type="button"
          onClick={async () => {
            await fetch("/api/logout", { method: "POST" });
            router.replace("/login");
            router.refresh();
          }}
          className="self-start text-zinc-500 hover:text-zinc-300"
        >
          Sair
        </button>
        <p>Cascais · mock data</p>
      </div>
    </aside>
  );
}
