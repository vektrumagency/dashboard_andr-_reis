import { cache } from "react";
import { ObjectId } from "mongodb";
import { getRecruitmentDb } from "./mongodb";
import { RecruitmentDetailData, RecruitmentListItem, RecruitmentStage, RecruitmentStageEvent, isRecruitmentStage } from "./recruitment";

const COLLECTION = "candidates";

type RawCandidate = {
  _id: ObjectId;
  full_name: string;
  email?: string | null;
  linkedin_url?: string | null;
  professional_role?: string | null;
  current_affiliation?: string | null;
  geographic_area?: string | null;
  segment: string;
  status: "qualified" | "rejected";
  priority: RecruitmentListItem["priority"];
  score_total: number;
  lead_completeness?: RecruitmentListItem["lead_completeness"];
  missing_fields?: string[];
  email_origin?: RecruitmentListItem["email_origin"];
  funnel_stage: string;
  stage_updated_at?: Date;
  stage_note?: string | null;
  recontact_at?: Date;
  updated_at: Date;
  created_at: Date;
  rationale?: string | null;
  rejection_reason?: string | null;
  research_date?: string | null;
  email_source_url?: string | null;
  instagram_url?: string | null;
  professional_website?: string | null;
  source_urls?: string[];
  stage_history?: Array<{ stage: RecruitmentStage; changed_at: Date; note?: string; recontact_at?: Date }>;
  candidate?: RecruitmentDetailData["candidate"];
};

function iso(date?: Date | null): string | null {
  return date instanceof Date ? date.toISOString() : null;
}

function normalizeList(raw: RawCandidate): RecruitmentListItem {
  return {
    id: raw._id.toString(),
    full_name: raw.full_name,
    email: raw.email ?? null,
    linkedin_url: raw.linkedin_url ?? null,
    professional_role: raw.professional_role ?? null,
    current_affiliation: raw.current_affiliation ?? null,
    geographic_area: raw.geographic_area ?? null,
    segment: raw.segment,
    status: raw.status,
    priority: raw.priority,
    score_total: raw.score_total,
    lead_completeness: raw.lead_completeness ?? "needs_enrichment",
    missing_fields: raw.missing_fields ?? [],
    email_origin: raw.email_origin ?? null,
    funnel_stage: isRecruitmentStage(raw.funnel_stage) ? raw.funnel_stage : "new",
    stage_updated_at: iso(raw.stage_updated_at),
    stage_note: raw.stage_note ?? null,
    recontact_at: iso(raw.recontact_at),
    updated_at: raw.updated_at.toISOString(),
  };
}

function normalizeDetail(raw: RawCandidate): RecruitmentDetailData {
  return {
    ...normalizeList(raw),
    rationale: raw.rationale ?? null,
    rejection_reason: raw.rejection_reason ?? null,
    research_date: raw.research_date ?? null,
    email_source_url: raw.email_source_url ?? null,
    instagram_url: raw.instagram_url ?? null,
    professional_website: raw.professional_website ?? null,
    source_urls: raw.source_urls ?? [],
    created_at: raw.created_at.toISOString(),
    stage_history: (raw.stage_history ?? []).map((event): RecruitmentStageEvent => ({
      stage: event.stage,
      changed_at: event.changed_at.toISOString(),
      ...(event.note ? { note: event.note } : {}),
      ...(event.recontact_at ? { recontact_at: iso(event.recontact_at) } : {}),
    })),
    candidate: raw.candidate ?? {},
  };
}

export const getRecruitmentList = cache(async (): Promise<RecruitmentListItem[]> => {
  const db = await getRecruitmentDb();
  const rows = await db.collection<RawCandidate>(COLLECTION).find({}, {
    projection: {
      full_name: 1, email: 1, linkedin_url: 1, professional_role: 1,
      current_affiliation: 1, geographic_area: 1, segment: 1, status: 1,
      priority: 1, score_total: 1, lead_completeness: 1, missing_fields: 1,
      email_origin: 1, funnel_stage: 1, stage_updated_at: 1, stage_note: 1,
      recontact_at: 1, updated_at: 1,
    },
  }).sort({ updated_at: -1 }).toArray();
  return rows.map(normalizeList);
});

export const getRecruitmentCandidate = cache(async (id: string): Promise<RecruitmentDetailData | null> => {
  if (!ObjectId.isValid(id)) return null;
  const db = await getRecruitmentDb();
  const row = await db.collection<RawCandidate>(COLLECTION).findOne({ _id: new ObjectId(id) });
  return row ? normalizeDetail(row) : null;
});

export type RecruitmentStageChange = {
  stage: RecruitmentStage;
  note?: string;
  recontact_at?: string;
};

export async function updateRecruitmentStage(id: string, change: RecruitmentStageChange): Promise<"updated" | "unchanged" | "missing" | "opted_out"> {
  if (!ObjectId.isValid(id)) return "missing";
  const db = await getRecruitmentDb();
  const collection = db.collection<RawCandidate>(COLLECTION);
  const objectId = new ObjectId(id);
  const now = new Date();
  const recontactAt = change.stage === "not_now" && change.recontact_at
    ? new Date(`${change.recontact_at}T12:00:00.000Z`) : null;
  const update = {
    $set: {
      funnel_stage: change.stage,
      stage_updated_at: now,
      stage_note: change.note ?? null,
      ...(recontactAt ? { recontact_at: recontactAt } : {}),
    },
    $push: {
      stage_history: {
        stage: change.stage,
        changed_at: now,
        ...(change.note ? { note: change.note } : {}),
        ...(recontactAt ? { recontact_at: recontactAt } : {}),
      },
    },
    ...(!recontactAt ? { $unset: { recontact_at: "" as const } } : {}),
  };
  const result = await collection.updateOne(
    { _id: objectId, funnel_stage: { $nin: [change.stage, "opted_out"] } },
    update,
  );
  if (result.matchedCount) return "updated";
  const existing = await collection.findOne({ _id: objectId }, { projection: { funnel_stage: 1 } });
  if (!existing) return "missing";
  return existing.funnel_stage === "opted_out" ? "opted_out" : "unchanged";
}
