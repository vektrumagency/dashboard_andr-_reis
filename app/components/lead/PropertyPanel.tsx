"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Lead, Property } from "@/lib/types";
import {
  conditionLabel,
  furnitureStatusLabel,
  layoutEfficiencyLabel,
  occupancyLabel,
} from "@/lib/derive/enums";
import { signalsFor } from "@/lib/derive/signals";
import { likelyContainsRenders } from "@/lib/derive/gallery";
import { polarityTone } from "@/lib/tone";

const AMENITIES: { key: keyof Property; label: string }[] = [
  { key: "has_swimming_pool", label: "Piscina" },
  { key: "has_garden", label: "Jardim" },
  { key: "has_parking", label: "Garagem/Estacionamento" },
  { key: "has_elevator", label: "Elevador" },
  { key: "has_terrace", label: "Terraço" },
  { key: "has_balcony", label: "Varanda" },
  { key: "has_air_conditioning", label: "Ar condicionado" },
  { key: "has_storage_room", label: "Arrecadação" },
  { key: "has_exterior_facing", label: "Exterior" },
  { key: "has_floor_plan", label: "Planta disponível" },
  { key: "has_virtual_tour", label: "Tour virtual" },
  { key: "has_staging", label: "Home staging" },
];

/** Só entradas com valor — nunca uma linha "Label: —". */
function DefinitionList({ items }: { items: [string, string | null | undefined][] }) {
  const present = items.filter(([, v]) => !!v);
  if (present.length === 0) return null;
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {present.map(([label, value]) => (
        <div key={label}>
          <dt className="text-[10px] uppercase tracking-wide text-ink-faint">{label}</dt>
          <dd className="text-sm text-ink-muted">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function PropertyPanel({ lead }: { lead: Lead }) {
  const { property, visual_assessment: va, property_intelligence: pi, location_intelligence: li } = lead;
  const gallery = lead.visual_authenticity_shadow?.gallery_assessment;
  const showAuthenticityWarning = likelyContainsRenders(lead) || gallery?.likely_contains_virtual_staging === true;
  const activeAmenities = AMENITIES.filter((a) => property[a.key] === true);
  const signals = signalsFor(lead.signals);

  return (
    <div className="flex flex-col gap-6 px-6 py-5">
      {showAuthenticityWarning && (
        <div className="flex items-start gap-2.5 rounded-tile bg-warning-soft px-4 py-3">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warning" />
          <div className="text-sm text-ink">
            <p className="font-medium text-warning">A galeria pode conter renders ou home staging virtual</p>
            <p className="mt-0.5 text-ink-muted">
              Nem todas as fotos são fiáveis para avaliar estado real ou ocupação.
              {gallery?.reliable_physical_evidence_image_ids &&
                ` ${gallery.reliable_physical_evidence_image_ids.length} foto(s) confirmadas como fotografia real.`}
            </p>
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
          Condição e ocupação
        </p>
        <DefinitionList
          items={[
            ["Condição", conditionLabel(pi?.condition ?? va?.overall_condition)],
            ["Mobília", furnitureStatusLabel(va?.furniture_status)],
            ["Ocupação", occupancyLabel(va?.occupancy_cues)],
            ["Renovação", pi?.renovation_scope],
          ]}
        />
        {va?.positive_features && va.positive_features.length > 0 && (
          <ul className="mt-3 flex flex-col gap-1">
            {va.positive_features.map((f, i) => (
              <li key={i} className="flex items-start gap-1.5 text-sm text-positive">
                <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        )}
        {va?.suspected_issues && va.suspected_issues.length > 0 && (
          <ul className="mt-2 flex flex-col gap-1">
            {va.suspected_issues.map((issue, i) => (
              <li key={i} className="flex items-start gap-1.5 text-sm text-warning">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                {issue}
              </li>
            ))}
          </ul>
        )}
        {pi?.visible_risks && pi.visible_risks.length > 0 && (
          <ul className="mt-2 flex flex-col gap-1">
            {pi.visible_risks.map((risk, i) => (
              <li key={i} className="flex items-start gap-1.5 text-sm text-negative">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                {risk}
              </li>
            ))}
          </ul>
        )}
      </div>

      {pi && (
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
            Características do imóvel
          </p>
          <DefinitionList
            items={[
              ["Subtipo", pi.property_subtype],
              ["Qualidade de construção", pi.construction_quality],
              ["Qualidade do piso", pi.floor_quality],
              ["Orientação", pi.orientation],
              ["Luz natural", pi.natural_light],
              ["Vista", pi.view_quality],
              ["Privacidade", pi.privacy],
              ["Ruído", pi.noise_exposure],
              ["Qualidade do edifício", pi.building_quality],
              ["Qualidade do condomínio", pi.condominium_quality],
              ["Áreas comuns", pi.common_areas],
              ["Segurança", pi.security],
              ["Área útil", pi.usable_area_sqm ? `${pi.usable_area_sqm} m²` : null],
              ["Área bruta", pi.gross_area_sqm ? `${pi.gross_area_sqm} m²` : null],
              ["Área do lote", pi.plot_area_sqm ? `${pi.plot_area_sqm} m²` : null],
            ]}
          />
          {pi.outdoor_spaces && pi.outdoor_spaces.length > 0 && (
            <p className="mt-2 text-sm text-ink-muted">Exteriores: {pi.outdoor_spaces.join(", ")}</p>
          )}
          {pi.amenities && pi.amenities.length > 0 && (
            <p className="mt-1 text-sm text-ink-muted">Comodidades: {pi.amenities.join(", ")}</p>
          )}
        </div>
      )}

      {pi?.floor_plan?.detected && (
        <div className="rounded-tile bg-surface-sunken px-4 py-3">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Planta</p>
          {pi.floor_plan.rooms && pi.floor_plan.rooms.length > 0 && (
            <p className="text-sm text-ink-muted">Divisões: {pi.floor_plan.rooms.join(", ")}</p>
          )}
          {pi.floor_plan.zoning && <p className="mt-1 text-sm text-ink-muted">{pi.floor_plan.zoning}</p>}
          {pi.floor_plan.circulation && (
            <p className="mt-1 text-sm text-ink-muted">{pi.floor_plan.circulation}</p>
          )}
          {pi.floor_plan.layout_efficiency && (
            <p className="mt-1 text-xs text-ink-faint">
              {layoutEfficiencyLabel(pi.floor_plan.layout_efficiency)}
            </p>
          )}
        </div>
      )}

      {activeAmenities.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeAmenities.map((a) => (
            <span
              key={a.key}
              className="inline-flex items-center gap-1 rounded-pill border border-line-strong bg-surface-sunken px-2.5 py-1 text-[11px] font-medium text-ink-muted"
            >
              ✓ {a.label}
            </span>
          ))}
        </div>
      )}

      {signals.length > 0 && (
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Sinais</p>
          <div className="flex flex-wrap gap-1.5">
            {signals.map((s) => (
              <span
                key={s.label}
                className={`rounded-pill px-2.5 py-1 text-[11px] font-medium ${polarityTone(s.polarity).chip}`}
              >
                {s.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {property.description && (
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
            Descrição do anúncio
          </p>
          <p className="text-sm leading-relaxed text-ink-muted">{property.description}</p>
        </div>
      )}

      {li && (li.canonical_zone || li.estimated_street) && (
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
            Localização
          </p>
          <DefinitionList
            items={[
              ["Zona canónica", li.canonical_zone],
              ["Micro-zona", li.canonical_micro_zone],
              ["Rua estimada", li.estimated_street],
            ]}
          />
        </div>
      )}
    </div>
  );
}
