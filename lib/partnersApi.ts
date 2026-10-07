import { cache } from "react";
import { ObjectId } from "mongodb";
import { getPartnershipsDb } from "./mongodb";
import { PartnerDetailData, PartnerListItem, PartnerStage } from "./partners";

const COLLECTION = "leads";

type RawPartner = Omit<PartnerDetailData, "id" | "contact" | "created_at" | "updated_at"> & {
  _id: ObjectId;
  created_at: Date;
  updated_at: Date;
  candidate: PartnerDetailData["candidate"] & { contact?: PartnerListItem["contact"] };
};

function normalize(raw: RawPartner): PartnerDetailData {
  return {
    id: raw._id.toString(),
    company_name: raw.company_name,
    company_domain: raw.company_domain,
    website: raw.website,
    segment: raw.segment,
    status: raw.status,
    priority: raw.priority,
    score_total: raw.score_total,
    funnel_stage: raw.funnel_stage,
    contact: raw.candidate?.contact ?? {},
    rationale: raw.rationale,
    candidate: {
      company: raw.candidate?.company,
      message_angle: raw.candidate?.message_angle,
      value_proposition: raw.candidate?.value_proposition,
      meeting_question: raw.candidate?.meeting_question,
      evidence: raw.candidate?.evidence,
      known_positive_signals: raw.candidate?.known_positive_signals,
      known_cautions: raw.candidate?.known_cautions,
      critical_unknowns: raw.candidate?.critical_unknowns,
    },
    created_at: raw.created_at.toISOString(),
    updated_at: raw.updated_at.toISOString(),
  };
}

export const getPartnersList = cache(async (): Promise<PartnerListItem[]> => {
  const db = await getPartnershipsDb();
  const raw = await db.collection<RawPartner>(COLLECTION).find(
    { status: "qualified" },
    { projection: {
      company_name: 1, company_domain: 1, segment: 1, status: 1, priority: 1,
      score_total: 1, funnel_stage: 1, "candidate.contact": 1, updated_at: 1,
    } },
  ).toArray();
  return raw.map(({ _id, candidate, updated_at, ...item }) => ({
    ...item,
    id: _id.toString(),
    contact: candidate?.contact ?? {},
    updated_at: updated_at.toISOString(),
  }));
});

export const getPartner = cache(async (id: string): Promise<PartnerDetailData | null> => {
  if (!ObjectId.isValid(id)) return null;
  const db = await getPartnershipsDb();
  const raw = await db.collection<RawPartner>(COLLECTION).findOne({ _id: new ObjectId(id), status: "qualified" });
  return raw ? normalize(raw) : null;
});

export async function updatePartnerStage(id: string, stage: PartnerStage): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;
  const db = await getPartnershipsDb();
  const result = await db.collection<RawPartner>(COLLECTION).updateOne(
    { _id: new ObjectId(id), status: "qualified" },
    { $set: { funnel_stage: stage, updated_at: new Date() } },
  );
  return result.matchedCount === 1;
}
