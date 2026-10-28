import { notFound } from "next/navigation";
import { RecruitmentDetail } from "@/app/components/recruitment/RecruitmentDetail";
import { getRecruitmentCandidate } from "@/lib/recruitmentApi";
import { parseRecruitmentQuery, recruitmentParamsFromRecord } from "@/lib/recruitmentQuery";

export default async function RecruitmentCandidatePage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = parseRecruitmentQuery(recruitmentParamsFromRecord(await searchParams));
  const candidate = await getRecruitmentCandidate(id);
  if (!candidate) notFound();
  return <main className="min-h-full bg-canvas px-4 py-10"><div className="mx-auto w-full max-w-5xl">
    <RecruitmentDetail candidate={candidate} query={query} />
  </div></main>;
}
