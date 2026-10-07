import { notFound } from "next/navigation";
import { getPartner, getPartnersList } from "@/lib/partnersApi";
import { partnerAdjacency, parsePartnerQuery, partnerParamsFromRecord } from "@/lib/partnerQuery";
import { PartnerDetail } from "@/app/components/partners/PartnerDetail";
import { PartnerModal } from "@/app/components/partners/PartnerModal";

export default async function PartnerModalPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = parsePartnerQuery(partnerParamsFromRecord(await searchParams));
  const [partner, partners] = await Promise.all([getPartner(id), getPartnersList()]);
  if (!partner) notFound();
  return <PartnerModal><PartnerDetail partner={partner} query={query} adjacency={partnerAdjacency(partners, query, id)} modal /></PartnerModal>;
}
