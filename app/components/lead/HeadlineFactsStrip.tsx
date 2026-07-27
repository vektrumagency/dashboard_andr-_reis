import { Lead } from "@/lib/types";
import { leadHeadlineFacts } from "@/lib/derive/headlineFacts";

/**
 * Responde de relance às perguntas que o André faz sempre sobre um lead:
 * multi-agência? mobilada/ocupada? construção nova? que agência? Cada
 * facto só aparece quando o campo de origem é conhecido — ver
 * lib/derive/headlineFacts.ts.
 */
export function HeadlineFactsStrip({ lead }: { lead: Lead }) {
  const facts = leadHeadlineFacts(lead);
  if (facts.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-6 py-4">
      {facts.map((fact) => (
        <div
          key={fact.key}
          title={fact.detail ?? undefined}
          className={`flex items-center gap-2 rounded-tile px-3 py-2 ${fact.tone.chip}`}
        >
          <fact.icon size={16} strokeWidth={1.75} />
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] uppercase tracking-wide opacity-70">{fact.label}</span>
            <span className="text-sm font-medium">{fact.value}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
