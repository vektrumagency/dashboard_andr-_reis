import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, verifyPassword, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/auth";
import { isRateLimited } from "@/lib/rateLimit";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  // atraso fixo em todas as respostas — dificulta brute-force por bots
  await sleep(400);

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Demasiadas tentativas. Tenta novamente dentro de alguns minutos." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";

  if (!password || !(await verifyPassword(password))) {
    return NextResponse.json({ error: "Password incorreta." }, { status: 401 });
  }

  const token = await createSessionToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return response;
}
