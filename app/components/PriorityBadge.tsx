import { Priority } from "@/lib/types";

const STYLES: Record<Priority, string> = {
  HIGH: "bg-red-100 text-red-700 ring-red-600/20",
  MEDIUM: "bg-amber-100 text-amber-700 ring-amber-600/20",
  LOW: "bg-zinc-100 text-zinc-600 ring-zinc-500/20",
};

const LABELS: Record<Priority, string> = {
  HIGH: "Alta",
  MEDIUM: "Média",
  LOW: "Baixa",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STYLES[priority]}`}
    >
      {LABELS[priority]}
    </span>
  );
}
