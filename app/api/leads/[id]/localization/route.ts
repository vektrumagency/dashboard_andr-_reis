import { NextRequest, NextResponse } from "next/server";
import { BackendApiError, mutateLocalization } from "@/lib/backend";
import { verifyRequestSession } from "@/lib/auth";

async function handle(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
  method: "POST" | "DELETE",
) {
  if (!(await verifyRequestSession(request))) {
    return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });
  }

  const { id } = await context.params;
  try {
    return NextResponse.json(await mutateLocalization(id, method));
  } catch (error) {
    const status = error instanceof BackendApiError ? error.status : 502;
    const message =
      error instanceof Error ? error.message : "Falha ao atualizar o pedido de localização.";
    console.error("Falha no workflow Localizar", id, method, error);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return handle(request, context, "POST");
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return handle(request, context, "DELETE");
}
