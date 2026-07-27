import { cn } from "@/lib/cn";
import { Tone } from "@/lib/tone";

/** Pill genérico tonalizado — base partilhada por StatusBadge e PriorityBadge. */
export function Badge({ tone, className }: { tone: Tone; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-medium",
        tone.chip,
        className,
      )}
    >
      {tone.label}
    </span>
  );
}
