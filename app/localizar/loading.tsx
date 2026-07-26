export default function LocalizarLoading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10" aria-busy="true">
      <div className="h-8 w-40 animate-pulse rounded bg-zinc-200" />
      <div className="mt-8 grid gap-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-28 animate-pulse rounded-xl bg-zinc-200/70" />
        ))}
      </div>
    </main>
  );
}
