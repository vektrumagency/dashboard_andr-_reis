import "server-only";

import { Lead, LocalizationCase } from "./types";

export interface LocalizationMutationResult {
  id: string;
  status: Lead["status"];
  localization_case: LocalizationCase | null;
  updated_at: string;
}

export class BackendApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function backendConfig(): { baseUrl: string; token: string } {
  const baseUrl = process.env.LEAD_RESEARCHER_API_URL?.replace(/\/+$/, "");
  const token = process.env.DASHBOARD_SERVICE_TOKEN;
  if (!baseUrl || !token) {
    throw new BackendApiError("Ligação ao serviço de localização não configurada.", 503);
  }
  return { baseUrl, token };
}

export async function mutateLocalization(
  id: string,
  method: "POST" | "DELETE",
): Promise<LocalizationMutationResult> {
  const { baseUrl, token } = backendConfig();
  const response = await fetch(`${baseUrl}/leads/${encodeURIComponent(id)}/localization`, {
    method,
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const detail =
      typeof payload?.detail === "string"
        ? payload.detail
        : "O serviço de localização não conseguiu concluir o pedido.";
    throw new BackendApiError(detail, response.status);
  }
  return {
    id: payload.id,
    status: payload.status,
    localization_case: payload.localization_case ?? null,
    updated_at: payload.updated_at,
  };
}
