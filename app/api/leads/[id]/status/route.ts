import { NextRequest, NextResponse } from "next/server";
import { updateLeadStatus } from "@/lib/api";
import { ALL_STATUSES } from "@/lib/leads";
import { LeadStatus } from "@/lib/types";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const status = body?.status;

  if (typeof status !== "string" || !ALL_STATUSES.includes(status as LeadStatus)) {
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
