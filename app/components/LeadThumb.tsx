"use client";

import { useState } from "react";
import { ImageOff, Images, Wand2 } from "lucide-react";

/**
 * Miniatura da linha da tabela. `images` vem da vista de lista já reduzida
 * a 1 elemento (ver LIST_PIPELINE em lib/api.ts); `photoCount` é o total
 * real, calculado no servidor antes do corte, para o badge "N fotos".
 */
export function LeadThumb({
  images,
  photoCount,
  likelyRenders,
  alt,
}: {
  images: string[];
  photoCount: number | null | undefined;
  likelyRenders: boolean;
  alt: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = images[0];

  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-tile bg-surface-sunken">
      {src && !failed ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-ink-faint">
          <ImageOff size={18} strokeWidth={1.5} />
        </div>
      )}
      {!!photoCount && photoCount > 1 && (
        <span className="absolute bottom-1 right-1 flex items-center gap-1 rounded-pill bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-ink">
          <Images size={11} strokeWidth={2} />
          {photoCount}
        </span>
      )}
      {likelyRenders && (
        <span
          title="A galeria pode conter renders/visualizações, não fotografias reais"
          className="absolute left-1 top-1 flex items-center gap-1 rounded-pill bg-warning-soft px-1.5 py-0.5 text-[10px] font-medium text-warning"
        >
          <Wand2 size={11} strokeWidth={2} />
        </span>
      )}
    </div>
  );
}
