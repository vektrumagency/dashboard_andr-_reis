"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ChevronDown, Diamond, Handshake, LogOut, Mail, MapPinned, Menu,
  Mountain, PanelLeftClose, PanelLeftOpen, Users, X,
} from "lucide-react";
import { ALL_STATUSES, STATUS_LABELS, marketsSummary } from "@/lib/leads";
import { ALL } from "@/lib/leadQuery";
import { useLeads } from "@/lib/leadsStore";
import { usePartners } from "@/lib/partnersStore";
import { PARTNER_STAGES, PARTNER_STAGE_LABELS } from "@/lib/partners";
import { parsePartnerQuery, partnerIndexHref } from "@/lib/partnerQuery";
import { useRecruitment } from "@/lib/recruitmentStore";
import { RECRUITMENT_STAGES, RECRUITMENT_STAGE_LABELS, recruitmentTabFor } from "@/lib/recruitment";
import { parseRecruitmentQuery, recruitmentIndexHref } from "@/lib/recruitmentQuery";

type GroupKey = "leads" | "partners" | "recruitment";
type SubItem = { href: string; label: string; count: number; active: boolean };

const DEFAULT_GROUPS: Record<GroupKey, boolean> = {
  leads: true,
  partners: false,
  recruitment: false,
};

const LINK_CLASS = "flex min-h-11 min-w-0 items-center gap-3 rounded-tile px-3 text-sm font-medium transition-colors";
const ACTIVE_CLASS = "bg-sidebar-active text-sidebar-ink shadow-[inset_3px_0_0_#b99655]";
const IDLE_CLASS = "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-ink";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { leads } = useLeads();
  const { partners } = usePartners();
  const { candidates } = useRecruitment();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState(DEFAULT_GROUPS);
  const mobileTriggerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setCollapsed(window.localStorage.getItem("vektrum.sidebar.collapsed") === "true");
      try {
        const saved = JSON.parse(window.localStorage.getItem("vektrum.sidebar.groups") || "null");
        if (saved && typeof saved === "object") {
          setOpenGroups({
            leads: saved.leads === true,
            partners: saved.partners === true,
            recruitment: saved.recruitment === true,
          });
        }
      } catch {
        // Ignore stale navigation preferences.
      }
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const active: GroupKey | null = pathname === "/" || pathname.startsWith("/leads/")
      ? "leads"
      : pathname.startsWith("/parceiros")
        ? "partners"
        : pathname.startsWith("/recrutamento")
          ? "recruitment"
          : null;
    queueMicrotask(() => {
      if (active) setOpenGroups((previous) => ({ ...previous, [active]: true }));
      setMobileOpen(false);
    });
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    drawerRef.current?.querySelector<HTMLElement>("button, a")?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileOpen(false);
        mobileTriggerRef.current?.focus();
      }
      if (event.key !== "Tab" || !drawerRef.current) return;
      const focusable = [...drawerRef.current.querySelectorAll<HTMLElement>("a, button:not([disabled])")]
        .filter((element) => element.getClientRects().length > 0);
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  if (pathname === "/login") return null;

  const onLeadsPage = pathname === "/";
  const activeStatus = onLeadsPage ? searchParams.get("status") : null;
  const onPartnersPage = pathname.startsWith("/parceiros");
  const partnerQuery = parsePartnerQuery(searchParams);
  const onRecruitmentPage = pathname.startsWith("/recrutamento");
  const recruitmentQuery = parseRecruitmentQuery(searchParams);
  const statusCounts = Object.fromEntries(
    ALL_STATUSES.map((status) => [status, leads.filter((lead) => lead.status === status).length]),
  ) as Record<(typeof ALL_STATUSES)[number], number>;
  const decidedStatuses = ALL_STATUSES.filter((status) => status !== "new" && status !== "locating");
  const locatingLeads = leads.filter((lead) => lead.status === "locating");
  const locatingProcessingCount = locatingLeads.filter((lead) => lead.localization_case?.status === "processing").length;
  const outreachCandidates = candidates.filter((candidate) => recruitmentTabFor(candidate) === "outreach");
  const enrichmentCount = candidates.filter((candidate) => recruitmentTabFor(candidate) === "enrichment").length;

  const leadItems: SubItem[] = [
    { href: `/?status=${ALL}`, label: "Todas", count: leads.length, active: onLeadsPage && activeStatus === ALL },
    ...decidedStatuses.map((status) => ({
      href: `/?status=${status}`,
      label: STATUS_LABELS[status],
      count: statusCounts[status],
      active: onLeadsPage && activeStatus === status,
    })),
  ];
  const partnerItems: SubItem[] = PARTNER_STAGES.map((stage) => ({
    href: partnerIndexHref({ ...partnerQuery, stage }),
    label: PARTNER_STAGE_LABELS[stage],
    count: partners.filter((partner) => partner.funnel_stage === stage).length,
    active: onPartnersPage && partnerQuery.stage === stage,
  }));
  const recruitmentItems: SubItem[] = [
    ...RECRUITMENT_STAGES.map((stage) => ({
      href: recruitmentIndexHref({ ...recruitmentQuery, tab: "outreach" as const, stage }),
      label: RECRUITMENT_STAGE_LABELS[stage],
      count: outreachCandidates.filter((candidate) => candidate.funnel_stage === stage).length,
      active: onRecruitmentPage && recruitmentQuery.tab === "outreach" && recruitmentQuery.stage === stage,
    })),
    {
      href: recruitmentIndexHref({ ...recruitmentQuery, tab: "enrichment", stage: "all" }),
      label: "Falta email/LinkedIn",
      count: enrichmentCount,
      active: onRecruitmentPage && recruitmentQuery.tab === "enrichment",
    },
  ];

  function toggleCollapsed() {
    setCollapsed((previous) => {
      window.localStorage.setItem("vektrum.sidebar.collapsed", String(!previous));
      return !previous;
    });
  }

  function toggleGroup(key: GroupKey) {
    setOpenGroups((previous) => {
      const next = { ...previous, [key]: !previous[key] };
      window.localStorage.setItem("vektrum.sidebar.groups", JSON.stringify(next));
      return next;
    });
  }

  function group(key: GroupKey, href: string, label: string, Icon: typeof Diamond, count: number, active: boolean, items: SubItem[]) {
    const expanded = openGroups[key];
    return (
      <div key={key} className="space-y-1">
        <div className="flex items-center gap-1">
          <Link href={href} onClick={() => setMobileOpen(false)} title={collapsed ? label : undefined}
            aria-label={collapsed ? label : undefined}
            className={`${LINK_CLASS} min-w-0 flex-1 ${active ? ACTIVE_CLASS : IDLE_CLASS} ${collapsed ? "lg:justify-center lg:px-0" : ""}`}>
            <Icon size={18} strokeWidth={1.8} className="shrink-0" aria-hidden="true" />
            <span className={collapsed ? "lg:sr-only" : "truncate"}>{label}</span>
            <span className={`ml-auto font-mono text-xs text-sidebar-faint ${collapsed ? "lg:hidden" : ""}`}>{count}</span>
          </Link>
          <button type="button" onClick={() => toggleGroup(key)} aria-expanded={expanded}
            aria-controls={`sidebar-${key}`} aria-label={`${expanded ? "Recolher" : "Expandir"} ${label}`}
            className={`flex h-10 w-8 shrink-0 items-center justify-center rounded-tile text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-ink ${collapsed ? "lg:hidden" : ""}`}>
            <ChevronDown size={16} className={`transition-transform ${expanded ? "" : "-rotate-90"}`} aria-hidden="true" />
          </button>
        </div>
        {expanded && (
          <div id={`sidebar-${key}`} className={`ml-5 space-y-0.5 border-l border-sidebar-line pl-3 ${collapsed ? "lg:hidden" : ""}`}>
            {items.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} aria-current={item.active ? "page" : undefined}
                className={`flex min-h-9 items-center gap-2 rounded-tile px-2 py-1 text-[13px] transition-colors ${item.active ? "bg-sidebar-active text-sidebar-ink" : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-ink"}`}>
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                <span className="font-mono text-[11px] text-sidebar-faint">{item.count}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  function simpleLink(href: string, label: string, Icon: typeof Diamond, active: boolean, count?: number) {
    return <Link href={href} onClick={() => setMobileOpen(false)} title={collapsed ? label : undefined}
      aria-label={collapsed ? label : undefined} aria-current={active ? "page" : undefined}
      className={`${LINK_CLASS} ${active ? ACTIVE_CLASS : IDLE_CLASS} ${collapsed ? "lg:justify-center lg:px-0" : ""}`}>
      <Icon size={18} strokeWidth={1.8} className="shrink-0" aria-hidden="true" />
      <span className={collapsed ? "lg:sr-only" : "truncate"}>{label}</span>
      {count !== undefined && <span className={`ml-auto font-mono text-xs text-sidebar-faint ${collapsed ? "lg:hidden" : ""}`}>{count}</span>}
    </Link>;
  }

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-surface/95 px-4 backdrop-blur lg:hidden">
        <button ref={mobileTriggerRef} type="button" onClick={() => setMobileOpen(true)} aria-label="Abrir menu"
          aria-expanded={mobileOpen} aria-controls="dashboard-sidebar"
          className="flex h-10 w-10 items-center justify-center rounded-tile border border-line text-ink">
          <Menu size={20} aria-hidden="true" />
        </button>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">Vektrum</p>
          <p className="truncate text-sm font-semibold text-ink">André Reis</p>
        </div>
      </header>
      {mobileOpen && <button type="button" aria-label="Fechar menu" onClick={() => setMobileOpen(false)}
        className="fixed inset-0 z-30 bg-sidebar/60 lg:hidden" />}
      <aside id="dashboard-sidebar" ref={drawerRef} aria-label="Menu principal"
        className={`fixed inset-y-0 left-0 z-40 flex h-dvh w-[min(19rem,86vw)] shrink-0 flex-col border-r border-sidebar-line bg-sidebar text-sidebar-ink shadow-xl transition-[width,transform] duration-200 lg:sticky lg:top-0 lg:translate-x-0 lg:shadow-none ${mobileOpen ? "translate-x-0" : "-translate-x-full"} ${collapsed ? "lg:w-20" : "lg:w-64"}`}>
        <div className={`flex h-20 shrink-0 items-center border-b border-sidebar-line px-5 ${collapsed ? "lg:justify-center lg:px-2" : "justify-between"}`}>
          <div className={collapsed ? "lg:sr-only" : ""}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#d8ba7a]">Vektrum</p>
            <p className="mt-0.5 text-base font-semibold tracking-tight">André Reis</p>
          </div>
          <button type="button" onClick={toggleCollapsed} aria-label={collapsed ? "Expandir barra lateral" : "Recolher barra lateral"}
            className="hidden h-10 w-10 items-center justify-center rounded-tile text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-ink lg:flex">
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
          <button type="button" onClick={() => { setMobileOpen(false); mobileTriggerRef.current?.focus(); }} aria-label="Fechar menu"
            className="flex h-10 w-10 items-center justify-center rounded-tile text-sidebar-muted hover:bg-sidebar-hover lg:hidden">
            <X size={19} />
          </button>
        </div>

        <nav aria-label="Navegação principal" className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-3 py-5">
          {group("leads", "/", "Leads", Diamond, statusCounts.new, onLeadsPage && !activeStatus, leadItems)}
          {simpleLink("/localizar", "Localizar", MapPinned, pathname.startsWith("/localizar"), locatingProcessingCount || locatingLeads.length)}
          {group("partners", "/parceiros", "Parceiros", Handshake, partners.length, onPartnersPage && partnerQuery.stage === "all", partnerItems)}
          {group("recruitment", "/recrutamento", "Recrutamento", Users, outreachCandidates.length, onRecruitmentPage && recruitmentQuery.tab === "outreach" && recruitmentQuery.stage === "all", recruitmentItems)}
          <div className="my-1 border-t border-sidebar-line" />
          {simpleLink("/mapa", "Mapa", Mountain, pathname.startsWith("/mapa"))}
          {simpleLink("/atacar", "Atacar", Mail, pathname.startsWith("/atacar"))}
        </nav>

        <div className="shrink-0 border-t border-sidebar-line px-4 py-4">
          <button type="button" onClick={async () => {
            await fetch("/api/logout", { method: "POST" });
            router.replace("/login");
            router.refresh();
          }} title={collapsed ? "Sair" : undefined}
            className={`flex min-h-10 w-full items-center gap-3 rounded-tile px-2 text-sm text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-ink ${collapsed ? "lg:justify-center" : ""}`}>
            <LogOut size={17} aria-hidden="true" /> <span className={collapsed ? "lg:sr-only" : ""}>Sair</span>
          </button>
          <p className={`mt-2 px-2 text-xs text-sidebar-faint ${collapsed ? "lg:hidden" : ""}`}>{marketsSummary(leads) || "Sem leads"}</p>
        </div>
      </aside>
    </>
  );
}
