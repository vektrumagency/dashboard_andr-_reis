import { describe, expect, it } from "vitest";
import { groupLocalizationLeads, localizationMapsUrl } from "./localization";
import { Lead, LocalizationCase } from "./types";

const processingCase: LocalizationCase = {
  request_id: "00000000-0000-0000-0000-000000000001",
  status: "processing",
  requested_at: "2026-07-20T10:00:00Z",
  updated_at: "2026-07-20T10:00:00Z",
  answered_at: null,
  previous_lead_status: "new",
  answer: null,
};

const answeredCase: LocalizationCase = {
  ...processingCase,
  request_id: "00000000-0000-0000-0000-000000000002",
  status: "answered",
  updated_at: "2026-07-21T10:00:00Z",
  answered_at: "2026-07-21T10:00:00Z",
  answer: {
    formatted_address: "Rua do Farol 12, Cascais",
    street: "Rua do Farol",
    door_number: "12",
    postal_code: null,
    locality: "Cascais",
    municipality: "Cascais",
    latitude: 38.695,
    longitude: -9.421,
    confidence: "high",
    explanation: null,
    answered_by: "agent-loc-1",
  },
};

function lead(id: string, localization_case: LocalizationCase, status: Lead["status"] = "locating") {
  return {
    id,
    status,
    localization_case,
    updated_at: localization_case.updated_at,
  } as Lead;
}

describe("Localizar grouping", () => {
  it("separates processing and answered leads and excludes leads moved onward", () => {
    const processing = lead("processing", processingCase);
    const answered = lead("answered", answeredCase);
    const contacted = lead("contacted", answeredCase, "contacted");

    const groups = groupLocalizationLeads([processing, contacted, answered]);

    expect(groups.processing.map((item) => item.id)).toEqual(["processing"]);
    expect(groups.answered.map((item) => item.id)).toEqual(["answered"]);
    expect(contacted.localization_case).toEqual(answeredCase);
  });
});

describe("Localizar Maps links", () => {
  it("prefers coordinates when the answer provides them", () => {
    expect(localizationMapsUrl(answeredCase.answer!)).toContain(
      "query=38.695%2C-9.421",
    );
  });

  it("falls back to the formatted address", () => {
    expect(
      localizationMapsUrl({
        ...answeredCase.answer!,
        latitude: null,
        longitude: null,
      }),
    ).toContain("Rua%20do%20Farol%2012%2C%20Cascais");
  });
});
