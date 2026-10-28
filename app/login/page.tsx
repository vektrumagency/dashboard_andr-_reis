"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.error ?? "Não foi possível entrar.");
      setLoading(false);
      return;
    }

    router.replace(searchParams.get("from") || "/");
    router.refresh();
  }

  return (
    <main className="flex min-h-dvh w-full items-center justify-center bg-canvas px-4 py-12">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-card border border-line bg-surface p-7 shadow-card sm:p-10"
      >
        <div className="mb-8 border-b border-line pb-7">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Vektrum</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink">Bem-vindo, André</h1>
          <p className="mt-2 text-sm text-ink-muted">Entre para acompanhar leads, parceiros e recrutamento.</p>
        </div>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-muted">
          Password
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="min-h-11 rounded-tile border border-line-strong bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
          />
        </label>

        {error && <p className="mt-3 text-sm text-negative">{error}</p>}

        <button
          type="submit"
          disabled={loading || password.length === 0}
          className="mt-6 min-h-11 w-full rounded-tile bg-accent px-4 py-2 text-sm font-semibold text-on-accent hover:bg-accent-strong disabled:cursor-default disabled:opacity-50"
        >
          {loading ? "A entrar..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}
