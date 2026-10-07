import { beforeEach, describe, expect, it, vi } from "vitest";
import { ObjectId } from "mongodb";

const { find, findOne, updateOne, getPartnershipsDb } = vi.hoisted(() => {
  const find = vi.fn();
  const findOne = vi.fn();
  const updateOne = vi.fn();
  const collection = vi.fn(() => ({ find, findOne, updateOne }));
  const getPartnershipsDb = vi.fn(async () => ({ collection }));
  return { find, findOne, updateOne, getPartnershipsDb };
});

vi.mock("./mongodb", () => ({ getPartnershipsDb }));

import { getPartnersList, getPartner, updatePartnerStage } from "./partnersApi";

beforeEach(() => vi.clearAllMocks());

describe("partnership database access", () => {
  it("lists qualified records with a small projection", async () => {
    find.mockReturnValue({ toArray: async () => [{
      _id: new ObjectId(), company_name: "Empresa", segment: "mortgage_credit", status: "qualified",
      priority: "B", score_total: 60, funnel_stage: "new", candidate: { contact: { name: "Ana" } },
      updated_at: new Date("2026-10-07T00:00:00Z"),
    }] });
    const result = await getPartnersList();
    expect(find).toHaveBeenCalledWith({ status: "qualified" }, expect.objectContaining({ projection: expect.any(Object) }));
    expect(result[0]).toMatchObject({ company_name: "Empresa", contact: { name: "Ana" }, funnel_stage: "new" });
    expect(result[0].updated_at).toBe("2026-10-07T00:00:00.000Z");
  });

  it("never fetches a rejected record into the detail view", async () => {
    findOne.mockResolvedValue(null);
    const id = new ObjectId().toString();
    expect(await getPartner(id)).toBeNull();
    expect(findOne).toHaveBeenCalledWith({ _id: new ObjectId(id), status: "qualified" });
  });

  it("updates only a qualified record and its funnel timestamp", async () => {
    updateOne.mockResolvedValue({ matchedCount: 1 });
    const id = new ObjectId().toString();
    expect(await updatePartnerStage(id, "closed_won")).toBe(true);
    expect(updateOne).toHaveBeenCalledWith(
      { _id: new ObjectId(id), status: "qualified" },
      { $set: { funnel_stage: "closed_won", updated_at: expect.any(Date) } },
    );
    expect(await updatePartnerStage("bad-id", "engaged")).toBe(false);
  });
});
