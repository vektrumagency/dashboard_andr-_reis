import { NextRequest, NextResponse } from "next/server";
import { updateLeadStatus } from "@/lib/api";
import { PIPELINE_STATUSES } from "@/lib/leads";
import { LeadStatus } from "@/lib/types";
import { verifyRequestSession } from "@/lib/auth";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await verifyRequestSession(request))) {
    return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });
  }
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const status = body?.status;

  if (
    typeof status !== "string" ||
    !PIPELINE_STATUSES.includes(status as Exclude<LeadStatus, "locating">)
  ) {
    return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
  }

  try {
    const lead = await updateLeadStatus(id, status as LeadStatus);
    return NextResponse.json(lead);
  } catch (error) {
    console.error("Falha ao atualizar estado do lead", id, error);
    return NextResponse.json({ error: "Falha ao atualizar o estado do lead." }, { status: 502 });
  }
}
