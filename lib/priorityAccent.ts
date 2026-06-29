import { LeadPriority } from "./types";

export interface PriorityAccent {
  text: string;
}

const ACCENTS: Record<LeadPriority, PriorityAccent> = {
  high: { text: "text-red-600" },
  medium: { text: "text-amber-600" },
  low: { text: "text-sky-600" },
  exclude: { text: "text-zinc-500" },
};

export function priorityAccent(priority: LeadPriority): PriorityAccent {
  return ACCENTS[priority];
}
