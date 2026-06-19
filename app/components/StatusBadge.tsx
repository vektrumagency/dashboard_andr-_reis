import { LeadStatus } from "@/lib/types";

const STYLES: Record<LeadStatus, string> = {
  "Por contactar": "bg-blue-100 text-blue-700 ring-blue-600/20",
  Contactado: "bg-violet-100 text-violet-700 ring-violet-600/20",
  "Em negociação": "bg-orange-100 text-orange-700 ring-orange-600/20",
  Fechado: "bg-emerald-100 text-emerald-700 ring-emerald-600/20",
};

export function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STYLES[status]}`}
    >
      {status}
    </span>
  );
}
