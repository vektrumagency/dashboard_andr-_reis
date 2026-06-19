import Link from "next/link";
import { notFound } from "next/navigation";
import { mockLeads } from "@/lib/mockData";
import { formatArea, formatPrice, priceDropPercent } from "@/lib/format";
import { getNextAction } from "@/lib/leads";
import { PriorityBadge } from "@/app/components/PriorityBadge";
import { StatusBadge } from "@/app/components/StatusBadge";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = mockLeads.find((item) => item.id === id);

  if (!lead) {
    notFound();
  }

  const drop = priceDropPercent(lead.price_current, lead.price_initial);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
      <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900">
        ← Voltar à tabela de leads
      </Link>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-zinc-900">
            {lead.zone} · {lead.typology}
          </h1>
          <PriorityBadge priority={lead.priority} />
          <StatusBadge status={lead.status} />
        </div>
        <p className="text-sm text-zinc-500">
          {lead.seller_type === "particular" ? "Particular" : "Agência"} · Score{" "}
          {lead.score} · Tier {lead.zone_tier}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-lg border border-zinc-200 bg-white p-5 sm:grid-cols-3">
        <Field label="Preço atual" value={formatPrice(lead.price_current)} />
        <Field
          label="Preço inicial"
          value={
            drop > 0
              ? `${formatPrice(lead.price_initial)} (-${drop}%)`
              : formatPrice(lead.price_initial)
          }
        />
        <Field label="Área" value={formatArea(lead.area_sqm)} />
        <Field label="Dias no mercado" value={String(lead.days_on_market)} />
        <Field label="Zona" value={`${lead.zone} (tier ${lead.zone_tier})`} />
        <Field
          label="Anúncio"
          value={
            <a
              href={lead.listing_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Ver anúncio original
            </a>
          }
        />
      </div>

      <Section title="Nota comercial">
        <p className="text-sm leading-6 text-zinc-700">{lead.commercial_note}</p>
      </Section>

      <Section title="Próxima ação">
        <p className="text-sm leading-6 text-zinc-700">{getNextAction(lead)}</p>
      </Section>
    </main>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
        {label}
      </span>
      <span className="text-sm text-zinc-900">{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
      {children}
    </div>
  );
}
