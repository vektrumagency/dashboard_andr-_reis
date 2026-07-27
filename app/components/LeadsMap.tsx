"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Lead, LeadPriority } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { PRIORITY_LABELS } from "@/lib/leads";
import { priorityTone } from "@/lib/tone";

/**
 * O Mapbox cria os markers via DOM imperativo (ver useEffect abaixo), pelo
 * que não consegue ler var(--color-*) do CSS — precisa de um valor de cor
 * cru em JS. `priorityTone().hex` espelha os tokens de app/globals.css;
 * ver o comentário em lib/tone.ts sobre esta duplicação consciente.
 */
const PIN_COLORS: Record<LeadPriority, string> = {
  high: priorityTone("high").hex,
  medium: priorityTone("medium").hex,
  low: priorityTone("low").hex,
  exclude: priorityTone("exclude").hex,
};

// Centro por omissão (área Cascais/Algés) — só usado quando ainda não há
// nenhum lead com lat/lng; assim que houver coordenadas reais, o mapa
// ajusta-se sempre a elas em vez de ficar preso a este ponto fixo.
const DEFAULT_CENTER: [number, number] = [-9.35, 38.705];

export function LeadsMap({ leads }: { leads: Lead[] }) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token || !containerRef.current) return;

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: DEFAULT_CENTER,
      zoom: 12.5,
    });

    const markers: mapboxgl.Marker[] = [];
    const bounds = new mapboxgl.LngLatBounds();

    for (const lead of leads) {
      const { lat, lng } = lead.property;
      if (lat == null || lng == null) continue;

      const el = document.createElement("button");
      el.setAttribute("aria-label", `Lead ${lead.id}`);
      el.title = `${lead.property.zone} · ${lead.property.typology} · ${formatPrice(lead.property.price_current)} · ${PRIORITY_LABELS[lead.priority]}`;
      el.style.width = "16px";
      el.style.height = "16px";
      el.style.borderRadius = "50%";
      el.style.border = "2px solid white";
      el.style.boxShadow = "0 1px 4px rgba(0,0,0,0.4)";
      el.style.backgroundColor = PIN_COLORS[lead.priority];
      el.style.cursor = "pointer";
      el.onclick = () => router.push(`/leads/${lead.id}`);

      const marker = new mapboxgl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map);
      markers.push(marker);
      bounds.extend([lng, lat]);
    }

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 0 });
    }

    return () => {
      markers.forEach((marker) => marker.remove());
      map.remove();
    };
  }, [leads, router]);

  if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
    return (
      <div className="flex h-[32rem] items-center justify-center rounded-lg border border-dashed border-zinc-300 text-sm text-zinc-400">
        Falta configurar NEXT_PUBLIC_MAPBOX_TOKEN
      </div>
    );
  }

  return (
    <div className="relative h-[32rem] overflow-hidden rounded-lg border border-zinc-200">
      <div ref={containerRef} className="h-full w-full" />
      <div className="absolute bottom-4 left-4 flex flex-col gap-1.5 rounded-md bg-white/90 px-3 py-2 text-xs shadow-sm">
        {(["high", "medium", "low"] as const).map((priority) => (
          <div key={priority} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: PIN_COLORS[priority] }}
            />
            <span className="text-zinc-600">{PRIORITY_LABELS[priority]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
