import { LeadStatus } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/leads";

const STYLES: Record<LeadStatus, string> = {
  new: "bg-blue-100 text-blue-700 ring-blue-600/20",
  saved: "bg-zinc-100 text-zinc-600 ring-zinc-500/20",
  contacted: "bg-violet-100 text-violet-700 ring-violet-600/20",
  visit: "bg-orange-100 text-orange-700 ring-orange-600/20",
  not_relevant: "bg-zinc-100 text-zinc-400 ring-zinc-500/20",
};

export function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
