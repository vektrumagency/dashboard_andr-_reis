"use client";

export default function LocalizarError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col items-center px-6 py-24 text-center">
      <h1 className="text-xl font-semibold text-ink">Não foi possível carregar Localizar</h1>
      <p className="mt-2 text-sm text-ink-muted">Tenta novamente dentro de alguns segundos.</p>
      <button
        type="button"
        onClick={reset}
        className="mt-5 rounded-tile bg-accent px-4 py-2 text-sm font-medium text-canvas"
      >
        Tentar novamente
      </button>
    </main>
  );
}
