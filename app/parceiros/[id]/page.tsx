import { notFound } from "next/navigation";
import { getPartner, getPartnersList } from "@/lib/partnersApi";
import { partnerAdjacency, parsePartnerQuery, partnerParamsFromRecord } from "@/lib/partnerQuery";
import { PartnerDetail } from "@/app/components/partners/PartnerDetail";

export default async function PartnerPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = parsePartnerQuery(partnerParamsFromRecord(await searchParams));
  const [partner, partners] = await Promise.all([getPartner(id), getPartnersList()]);
  if (!partner) notFound();
  return <main className="min-h-full bg-canvas px-4 py-10"><div className="mx-auto w-full max-w-5xl">
    <PartnerDetail partner={partner} query={query} adjacency={partnerAdjacency(partners, query, id)} />
  </div></main>;
}
