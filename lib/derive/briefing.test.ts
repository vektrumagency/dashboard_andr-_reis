import { describe, expect, it } from "vitest";
import { briefingModel, evidenceSourceLabel } from "./briefing";
import { Lead } from "../types";
import { CommercialBriefing } from "../types/analysis";

/** Só `commercial_briefing` importa aqui — o resto do Lead não é lido. */
function leadWith(briefing: CommercialBriefing | null | undefined): Lead {
  return { commercial_briefing: briefing } as unknown as Lead;
}

describe("briefingModel", () => {
  it("lê o schema v2, pela ordem comercial e sem secções vazias", () => {
    const model = briefingModel(
      leadWith({
        generated_at: "2026-08-04T17:01:11Z",
        status: "generated",
        commercial_snapshot: null,
        interpretation: null,
        briefing: {
          commercial_overview: { text: "Síntese do lead.", confidence: "medium" },
          commercial_relevance: [{ text: "Vale a pena ligar." }],
          strengths: [],
          approach_angle: [{ text: "Entrar pelo projeto." }],
          uncertainties: [{ text: "Não se sabe o estado da obra." }],
          first_call_questions: [{ question: "O que está incluído no preço?" }],
        },
      }),
    );

    expect(model?.overview?.text).toBe("Síntese do lead.");
    expect(model?.sections.map((section) => section.key)).toEqual([
      "commercial_relevance",
      "approach_angle",
      "uncertainties",
    ]);
    expect(model?.sections.at(-1)?.muted).toBe(true);
    expect(model?.questions).toHaveLength(1);
    expect(model?.generatedAt).toBe("2026-08-04T17:01:11Z");
  });

  it("cai para o schema v1 quando não há bloco briefing", () => {
    const model = briefingModel(
      leadWith({
        interpretation: {
          why_good_lead: [{ text: "Preço abaixo do mercado.", snapshot_bullet_ids: ["below_market"] }],
          owner_reading: [{ text: "Provável promotor." }],
          first_call_questions: [{ question: "Já teve propostas?" }],
        },
      }),
    );

    expect(model?.overview).toBeNull();
    expect(model?.sections.map((section) => section.title)).toEqual([
      "Porque é um bom lead",
      "Leitura do proprietário",
    ]);
    expect(model?.sections[0].items[0].evidence_ids).toEqual(["below_market"]);
    expect(model?.questions).toHaveLength(1);
  });

  it("devolve null sem briefing, e também quando o objecto existe mas está vazio", () => {
    expect(briefingModel(leadWith(undefined))).toBeNull();
    expect(
      briefingModel(
        leadWith({
          status: "failed",
          commercial_snapshot: null,
          interpretation: null,
          briefing: { commercial_overview: null, strengths: [], first_call_questions: [] },
        }),
      ),
    ).toBeNull();
  });
});

describe("evidenceSourceLabel", () => {
  it("traduz as origens conhecidas e devolve o id em bruto nas novas", () => {
    expect(evidenceSourceLabel("market.benchmark")).toBe("Referência de mercado");
    expect(evidenceSourceLabel("algo.novo")).toBe("algo.novo");
  });
});
