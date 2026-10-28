import { NextRequest, NextResponse } from "next/server";
import { verifyRequestSession } from "@/lib/auth";
import { isRecruitmentStage } from "@/lib/recruitment";
import { updateRecruitmentStage } from "@/lib/recruitmentApi";

function validDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await verifyRequestSession(request))) {
    return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  if (!isRecruitmentStage(body?.stage)) {
    return NextResponse.json({ error: "Etapa inválida." }, { status: 400 });
  }
  if (body.note !== undefined && (typeof body.note !== "string" || body.note.length > 2000)) {
    return NextResponse.json({ error: "Nota inválida." }, { status: 400 });
  }
  if (body.stage === "not_now" && !validDate(body.recontact_at)) {
    return NextResponse.json({ error: "Indica uma data válida para voltar a contactar." }, { status: 400 });
  }
  if (body.recontact_at !== undefined && body.stage !== "not_now") {
    return NextResponse.json({ error: "Data de contacto inesperada." }, { status: 400 });
  }
  const { id } = await params;
  try {
    const result = await updateRecruitmentStage(id, {
      stage: body.stage,
      ...(body.note?.trim() ? { note: body.note.trim() } : {}),
      ...(body.stage === "not_now" ? { recontact_at: body.recontact_at } : {}),
    });
    if (result === "missing") return NextResponse.json({ error: "Candidato não encontrado." }, { status: 404 });
    if (result === "opted_out") return NextResponse.json({ error: "Este candidato pediu para não ser contactado." }, { status: 409 });
    return NextResponse.json({ result, stage: body.stage, stage_updated_at: new Date().toISOString() });
  } catch (error) {
    console.error("Falha ao atualizar etapa de recrutamento", id, error);
    return NextResponse.json({ error: "Falha ao atualizar a etapa." }, { status: 502 });
  }
}
