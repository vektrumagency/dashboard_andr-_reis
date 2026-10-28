import { beforeEach, describe, expect, it, vi } from "vitest";
import { ObjectId } from "mongodb";

const updateOne = vi.fn();
const findOne = vi.fn();
vi.mock("./mongodb", () => ({
  getRecruitmentDb: async () => ({ collection: () => ({ updateOne, findOne }) }),
}));

import { updateRecruitmentStage } from "./recruitmentApi";

describe("recruitment stage persistence", () => {
  beforeEach(() => { updateOne.mockReset(); findOne.mockReset(); });

  it("saves a recontact date and audit event without overwriting research fields", async () => {
    updateOne.mockResolvedValue({ matchedCount: 1 });
    const id = new ObjectId().toString();
    expect(await updateRecruitmentStage(id, { stage: "not_now", recontact_at: "2026-11-03", note: "Voltar em novembro" })).toBe("updated");
    const [filter, update] = updateOne.mock.calls[0];
    expect(filter.funnel_stage).toEqual({ $nin: ["not_now", "opted_out"] });
    expect(update.$set.recontact_at).toEqual(new Date("2026-11-03T12:00:00.000Z"));
    expect(update.$push.stage_history).toMatchObject({ stage: "not_now", note: "Voltar em novembro" });
    expect(update.$set).not.toHaveProperty("updated_at");
  });

  it("keeps opted out records terminal", async () => {
    updateOne.mockResolvedValue({ matchedCount: 0 });
    findOne.mockResolvedValue({ funnel_stage: "opted_out" });
    expect(await updateRecruitmentStage(new ObjectId().toString(), { stage: "contacted" })).toBe("opted_out");
  });
});
