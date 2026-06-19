import { LeadPriority } from "@/lib/types";
import { PRIORITY_LABELS } from "@/lib/leads";

const STYLES: Record<LeadPriority, string> = {
  high: "bg-red-100 text-red-700 ring-red-600/20",
  medium: "bg-amber-100 text-amber-700 ring-amber-600/20",
  low: "bg-zinc-100 text-zinc-600 ring-zinc-500/20",
  exclude: "bg-zinc-100 text-zinc-400 ring-zinc-500/20",
};

export function PriorityBadge({ priority }: { priority: LeadPriority }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STYLES[priority]}`}
    >
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
