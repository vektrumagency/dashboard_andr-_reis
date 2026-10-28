import { notFound } from "next/navigation";
import { RecruitmentDetail } from "@/app/components/recruitment/RecruitmentDetail";
import { PartnerModal } from "@/app/components/partners/PartnerModal";
import { getRecruitmentCandidate } from "@/lib/recruitmentApi";
import { parseRecruitmentQuery, recruitmentParamsFromRecord } from "@/lib/recruitmentQuery";

export default async function RecruitmentCandidateModalPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = parseRecruitmentQuery(recruitmentParamsFromRecord(await searchParams));
  const candidate = await getRecruitmentCandidate(id);
  if (!candidate) notFound();
  return <PartnerModal><RecruitmentDetail candidate={candidate} query={query} /></PartnerModal>;
}
