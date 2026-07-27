import { LeadPriority } from "@/lib/types";
import { priorityTone } from "@/lib/tone";
import { Badge } from "./Badge";

export function PriorityBadge({ priority }: { priority: LeadPriority }) {
  return <Badge tone={priorityTone(priority)} />;
}
