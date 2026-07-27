import { LeadStatus } from "@/lib/types";
import { statusTone } from "@/lib/tone";
import { Badge } from "./Badge";

export function StatusBadge({ status }: { status: LeadStatus }) {
  return <Badge tone={statusTone(status)} />;
}
