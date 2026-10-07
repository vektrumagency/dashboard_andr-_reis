import { NextRequest, NextResponse } from "next/server";
import { verifyRequestSession } from "@/lib/auth";
import { isPartnerStage } from "@/lib/partners";
import { updatePartnerStage } from "@/lib/partnersApi";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await verifyRequestSession(request))) {
    return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  if (!isPartnerStage(body?.stage)) {
    return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
  }
  const { id } = await params;
  try {
    const updated = await updatePartnerStage(id, body.stage);
    if (!updated) return NextResponse.json({ error: "Parceiro não encontrado." }, { status: 404 });
    return NextResponse.json({ stage: body.stage, updated_at: new Date().toISOString() });
  } catch (error) {
    console.error("Falha ao atualizar estado do parceiro", id, error);
    return NextResponse.json({ error: "Falha ao atualizar o estado." }, { status: 502 });
  }
}
