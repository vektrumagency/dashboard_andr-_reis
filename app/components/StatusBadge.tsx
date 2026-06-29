import { LeadStatus } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/leads";

const STYLES: Record<LeadStatus, string> = {
  new: "bg-blue-500 text-white",
  contacted: "bg-violet-500 text-white",
  visit: "bg-orange-500 text-white",
  not_relevant: "bg-zinc-500 text-white",
};

export function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
