export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-2 px-6 py-10">
      <h1 className="text-2xl font-semibold text-zinc-900">{title}</h1>
      <p className="max-w-md text-sm text-zinc-500">{description}</p>
      <div className="mt-6 flex h-64 items-center justify-center rounded-lg border border-dashed border-zinc-300 text-sm text-zinc-400">
        Em construção
      </div>
    </main>
  );
}
