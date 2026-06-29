import { LeadPriority } from "@/lib/types";
import { PRIORITY_LABELS } from "@/lib/leads";

const STYLES: Record<LeadPriority, string> = {
  high: "bg-red-500 text-white",
  medium: "bg-amber-500 text-white",
  low: "bg-sky-500 text-white",
  exclude: "bg-zinc-400 text-white",
};

export function PriorityBadge({ priority }: { priority: LeadPriority }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[priority]}`}
    >
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
