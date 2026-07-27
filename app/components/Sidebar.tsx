"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Diamond, LogOut, Mail, MapPinned, Mountain } from "lucide-react";
import { ALL_STATUSES, STATUS_LABELS, marketsSummary } from "@/lib/leads";
import { ALL } from "@/lib/leadQuery";
import { useLeads } from "@/lib/leadsStore";

const NAV_ITEMS = [
  { href: "/mapa", label: "Mapa", icon: Mountain },
  { href: "/atacar", label: "Atacar", icon: Mail },
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
  const decidedStatuses = ALL_STATUSES.filter(
    (status) => status !== "new" && status !== "locating",
  );
  const locatingLeads = leads.filter((lead) => lead.status === "locating");
  const locatingProcessingCount = locatingLeads.filter(
    (lead) => lead.localization_case?.status === "processing",
  ).length;

  return (
    <aside className="flex w-56 shrink-0 flex-col bg-canvas px-4 py-6 text-ink-muted">
      <div className="mb-8 px-2">
        <p className="font-mono text-xs uppercase tracking-widest text-ink-faint">Vektrum</p>
        <p className="text-sm font-semibold text-ink">André Reis</p>
      </div>

      <nav className="flex flex-col gap-1">
        <Link
          href="/"
          className={`flex items-center gap-3 rounded-tile px-3 py-2 text-sm font-medium transition-colors ${
            onLeadsPage && !activeStatus
              ? "bg-surface text-ink"
              : "text-ink-muted hover:bg-surface hover:text-ink"
          }`}
        >
          <Diamond size={14} strokeWidth={2} className="text-ink-faint" />
          Leads
          <span className="ml-auto font-mono text-xs text-ink-faint">{pendingCount}</span>
        </Link>

        <div className="ml-6 flex flex-col gap-0.5 border-l border-line pl-3">
          <Link
            href={`/?status=${ALL}`}
            className={`flex items-center gap-2 rounded-tile px-2 py-1.5 text-[13px] transition-colors ${
              activeStatus === ALL
                ? "bg-surface text-ink"
                : "text-ink-faint hover:bg-surface hover:text-ink-muted"
            }`}
          >
            {ALL}
            <span className="ml-auto font-mono text-[11px] text-ink-faint">{leads.length}</span>
          </Link>
          {decidedStatuses.map((status) => (
            <Link
              key={status}
              href={`/?status=${status}`}
              className={`flex items-center gap-2 rounded-tile px-2 py-1.5 text-[13px] transition-colors ${
                activeStatus === status
                  ? "bg-surface text-ink"
                  : "text-ink-faint hover:bg-surface hover:text-ink-muted"
              }`}
            >
              {STATUS_LABELS[status]}
              <span className="ml-auto font-mono text-[11px] text-ink-faint">
                {statusCounts[status]}
              </span>
            </Link>
          ))}
        </div>

        <Link
          href="/localizar"
          className={`mt-2 flex items-center gap-3 rounded-tile px-3 py-2 text-sm font-medium transition-colors ${
            pathname.startsWith("/localizar")
              ? "bg-accent-soft text-accent"
              : "text-ink-muted hover:bg-surface hover:text-ink"
          }`}
        >
          <MapPinned size={14} strokeWidth={2} className="text-accent/70" />
          Localizar
          <span className="ml-auto flex items-center gap-1.5 font-mono text-[11px]">
            {locatingProcessingCount > 0 && (
              <span className="rounded-pill bg-accent-strong px-1.5 py-0.5 text-canvas">
                {locatingProcessingCount}
              </span>
            )}
            <span className="text-ink-faint">{locatingLeads.length}</span>
          </span>
        </Link>

        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-tile px-3 py-2 text-sm font-medium transition-colors ${
                active ? "bg-surface text-ink" : "text-ink-muted hover:bg-surface hover:text-ink"
              }`}
            >
              <item.icon size={14} strokeWidth={2} className="text-ink-faint" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-3 px-2 pt-6 text-xs text-ink-faint">
        <button
          type="button"
          onClick={async () => {
            await fetch("/api/logout", { method: "POST" });
            router.replace("/login");
            router.refresh();
          }}
          className="flex items-center gap-1.5 self-start text-ink-faint hover:text-ink-muted"
        >
          <LogOut size={12} strokeWidth={2} />
          Sair
        </button>
        <p>{marketsSummary(leads) || "Sem leads"}</p>
      </div>
    </aside>
  );
}
