import { LeadPriority } from "./types";

export interface PriorityAccent {
  ring: string;
  glow: string;
  text: string;
  bar: string;
}

const ACCENTS: Record<LeadPriority, PriorityAccent> = {
  high: {
    ring: "ring-red-500/30",
    glow: "shadow-[0_8px_30px_-12px_rgba(239,68,68,0.35)]",
    text: "text-red-600",
    bar: "bg-red-500",
  },
  medium: {
    ring: "ring-amber-500/30",
    glow: "shadow-[0_8px_30px_-12px_rgba(245,158,11,0.3)]",
    text: "text-amber-600",
    bar: "bg-amber-500",
  },
  low: {
    ring: "ring-sky-500/30",
    glow: "shadow-[0_8px_30px_-12px_rgba(14,165,233,0.25)]",
    text: "text-sky-600",
    bar: "bg-sky-500",
  },
  exclude: {
    ring: "ring-zinc-300",
    glow: "",
    text: "text-zinc-500",
    bar: "bg-zinc-400",
  },
};

export function priorityAccent(priority: LeadPriority): PriorityAccent {
  return ACCENTS[priority];
}
