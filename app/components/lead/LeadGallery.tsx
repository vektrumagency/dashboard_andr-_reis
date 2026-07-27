"use client";

import { useMemo, useRef, useState } from "react";
import { Camera, ImageOff, LayoutGrid, Wand2 } from "lucide-react";
import { Lead } from "@/lib/types";
import { buildGallery, floorPlanIndices, imageUrlExpiry } from "@/lib/derive/gallery";

/**
 * Galeria hero do card — "as imagens são super importantes" foi um dos
 * pedidos explícitos do cliente. Full-bleed, rail de miniaturas, badge
 * render/fotografia por foto (a partir de visual_authenticity_shadow,
 * quando o mapeamento é fiável — ver buildGallery), salto directo para a
 * planta, e uma foto com URL expirado (assinaturas Idealista duram ~1 mês)
 * mostra um estado próprio em vez de um quadrado partido.
 *
 * As setas ← → só mudam de foto quando a galeria tem foco — fora dela
 * continuam a mudar de LEAD (ver LeadModal/LeadPageNav). stopPropagation
 * é o que separa os dois.
 */
export function LeadGallery({ lead }: { lead: Lead }) {
  const images = useMemo(() => buildGallery(lead), [lead]);
  const floorPlans = useMemo(() => floorPlanIndices(lead), [lead]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [dead, setDead] = useState<Set<number>>(new Set());
  const railRef = useRef<HTMLDivElement>(null);

  const alt = lead.property.title ?? `${lead.property.zone} · ${lead.property.typology}`;
  const active = images[activeIndex];
  const activeExpiry = active ? imageUrlExpiry(active.url) : null;
  const activeDead = active ? dead.has(active.index) || activeExpiry?.expired : false;

  function goTo(index: number) {
    const clamped = ((index % images.length) + images.length) % images.length;
    setActiveIndex(clamped);
    const thumb = railRef.current?.querySelector<HTMLElement>(`[data-thumb-index="${clamped}"]`);
    thumb?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (images.length < 2) return;
    if (event.key === "ArrowLeft") {
      event.stopPropagation();
      goTo(activeIndex - 1);
    } else if (event.key === "ArrowRight") {
      event.stopPropagation();
      goTo(activeIndex + 1);
    }
  }

  if (images.length === 0) {
    return (
      <div className="flex aspect-video w-full items-center justify-center bg-surface-sunken text-ink-faint">
        <div className="flex flex-col items-center gap-2 text-sm">
          <ImageOff size={28} strokeWidth={1.5} />
          Sem fotografias disponíveis
        </div>
      </div>
    );
  }

  return (
    <div tabIndex={0} onKeyDown={onKeyDown} className="outline-none">
      <div className="relative aspect-video w-full overflow-hidden bg-surface-sunken">
        {activeDead ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-sm text-ink-faint">
            <ImageOff size={28} strokeWidth={1.5} />
            {activeExpiry?.expired ? "Fotografia expirada" : "Não foi possível carregar a fotografia"}
          </div>
        ) : (
          <img
            key={active.url}
            src={active.url}
            alt={`${alt} — foto ${activeIndex + 1} de ${images.length}`}
            loading="eager"
            decoding="async"
            onError={() => setDead((prev) => new Set(prev).add(active.index))}
            className="h-full w-full object-cover"
          />
        )}

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(activeIndex - 1)}
              aria-label="Foto anterior"
              className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-pill bg-black/50 text-ink hover:bg-black/70"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => goTo(activeIndex + 1)}
              aria-label="Foto seguinte"
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-pill bg-black/50 text-ink hover:bg-black/70"
            >
              ›
            </button>
          </>
        )}

        <div className="absolute right-3 top-3 flex items-center gap-2">
          {floorPlans.length > 0 && (
            <button
              type="button"
              onClick={() => goTo(floorPlans[0])}
              className="flex items-center gap-1 rounded-pill bg-black/60 px-2.5 py-1 text-[11px] font-medium text-ink hover:bg-black/80"
            >
              <LayoutGrid size={12} strokeWidth={2} />
              Planta
            </button>
          )}
          <span className="flex items-center gap-1 rounded-pill bg-black/60 px-2.5 py-1 text-[11px] font-mono text-ink">
            <Camera size={12} strokeWidth={2} />
            {activeIndex + 1}/{images.length}
          </span>
        </div>

        {active.origin && (
          <span
            title={
              active.origin === "render"
                ? "Esta imagem é um render/visualização, não uma fotografia real"
                : "Fotografia"
            }
            className={`absolute left-3 top-3 flex items-center gap-1 rounded-pill px-2.5 py-1 text-[11px] font-medium ${
              active.origin === "render" ? "bg-warning-soft text-warning" : "bg-black/60 text-ink-muted"
            }`}
          >
            {active.origin === "render" && <Wand2 size={12} strokeWidth={2} />}
            {active.origin === "render" ? "Render" : "Fotografia"}
          </span>
        )}
      </div>

      {images.length > 1 && (
        <div ref={railRef} className="flex gap-1.5 overflow-x-auto bg-canvas px-2 py-2">
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              data-thumb-index={i}
              onClick={() => goTo(i)}
              className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-tile ${
                i === activeIndex ? "ring-2 ring-accent" : "opacity-70 hover:opacity-100"
              }`}
            >
              {dead.has(img.index) ? (
                <div className="flex h-full w-full items-center justify-center bg-surface-sunken">
                  <ImageOff size={14} className="text-ink-faint" />
                </div>
              ) : (
                <img
                  src={img.url}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  onError={() => setDead((prev) => new Set(prev).add(img.index))}
                  className="h-full w-full object-cover"
                />
              )}
              {img.isFloorPlan && (
                <span className="absolute bottom-0.5 right-0.5 rounded bg-black/70 p-0.5">
                  <LayoutGrid size={9} className="text-ink" />
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
