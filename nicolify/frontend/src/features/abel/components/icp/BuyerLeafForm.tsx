// cap: abel.icp-buyer
// story-origin: nicolify-r1-abel-icp-buyer T-FE-4
"use client";
/**
 * BuyerLeafForm.tsx — Buyer leaf form (rol, poder de decisión, demo, psico, pains, desires, objeciones, canales).
 *
 * Sections follow the engine BuyerPersona field-contract slugs + B2B extensions:
 *   1. Identidad del buyer   → name, role, decisionPower, isPrimary (RN-6 set-primary)
 *   2. Datos demográficos    → demographics JSONB sub-fields
 *   3. Psicografía           → psychographics JSONB sub-fields
 *   4. Dolores               → painPoints list[dict]
 *   5. Deseos                → desires list[dict]
 *   6. Objeciones            → objections list[dict]
 *   7. Canales preferidos    → preferredChannels list[dict]
 *   8. Viaje del comprador   → buyerJourney JSONB (awareness/consideration/decision)
 *
 * Autosave on-change debounced 600ms via usePatchBuyer (RN-8).
 * set-primary: "Establecer como principal" (RN-6 — clears others server-side).
 *
 * Named export (NO default) per FSD-Lite enforce.
 * spec_anchor: 03-arch-fe.md §3 Forms (buyer) + RN-5 + RN-6
 * validators_gate: RN-6 (set-primary ≤1) + autosave 600ms
 */

import { useCallback, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { WhatForChip } from "@/components/shared/WhatForChip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { useBuyer } from "../../hooks/use-buyers";
import { usePatchBuyer, useSetPrimaryBuyer } from "../../hooks/use-buyer-mutations";
import { buyerFormSchema, type BuyerFormValues } from "../../types/icp-schema";

// ── Types ─────────────────────────────────────────────────────────────────────

interface BuyerLeafFormProps {
  buyerId: string;
  icpId: string;
}

// ── Textarea helper ────────────────────────────────────────────────────────────

function Textarea({
  className,
  rows = 2,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { rows?: number }) {
  return (
    <textarea
      rows={rows}
      className={cn(
        "flex w-full rounded-md border border-input bg-background px-3 py-2",
        "text-sm ring-offset-background placeholder:text-muted-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50 resize-none",
        className,
      )}
      {...props}
    />
  );
}

// ── Group header ──────────────────────────────────────────────────────────────

function GroupHeader({
  title,
  consumers,
}: {
  title: string;
  consumers: React.ComponentProps<typeof WhatForChip>["consumers"];
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <WhatForChip consumers={consumers} fieldLabel={title} />
    </div>
  );
}

// ── Group container ────────────────────────────────────────────────────────────

function Group({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-border/60 bg-card p-4 mb-3">{children}</div>;
}

// ── FieldRow ──────────────────────────────────────────────────────────────────

function FieldRow({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

// ── Simple list-dict field ────────────────────────────────────────────────────

interface ListDictFieldProps {
  label: string;
  value: Array<Record<string, unknown>>;
  onChange: (value: Array<Record<string, unknown>>) => void;
  singleFieldKey: string;
  placeholder: string;
  "data-testid"?: string;
}

function ListDictField({
  label,
  value,
  onChange,
  singleFieldKey,
  placeholder,
  "data-testid": testId,
}: ListDictFieldProps) {
  const addItem = useCallback(() => {
    onChange([...value, { [singleFieldKey]: "" }]);
  }, [value, onChange, singleFieldKey]);

  const removeItem = useCallback(
    (idx: number) => {
      onChange(value.filter((_, i) => i !== idx));
    },
    [value, onChange],
  );

  const updateItem = useCallback(
    (idx: number, text: string) => {
      const next = [...value];
      next[idx] = { [singleFieldKey]: text };
      onChange(next);
    },
    [value, onChange, singleFieldKey],
  );

  return (
    <div className="flex flex-col gap-2" data-testid={testId}>
      <span className="text-xs font-medium text-muted-foreground sr-only">{label}</span>
      {value.map((item, idx) => {
        const text =
          typeof item[singleFieldKey] === "string" ? (item[singleFieldKey] as string) : "";
        return (
          <div key={idx} className="flex items-center gap-2">
            <Input
              value={text}
              onChange={(e) => updateItem(idx, e.target.value)}
              placeholder={placeholder}
              className="text-sm flex-1"
              aria-label={`${label} ${idx + 1}`}
            />
            <button
              type="button"
              onClick={() => removeItem(idx)}
              aria-label={`Eliminar ${label} ${idx + 1}`}
              className="text-muted-foreground hover:text-destructive transition-colors text-sm"
            >
              ×
            </button>
          </div>
        );
      })}
      <button
        type="button"
        onClick={addItem}
        className="text-xs text-agent-abel font-medium mt-1 self-start hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm"
        data-testid={`${testId ?? label.toLowerCase()}-add`}
      >
        + Agregar
      </button>
    </div>
  );
}

// ── Decision power options ─────────────────────────────────────────────────────

const DECISION_POWER_OPTIONS: { value: string; label: string }[] = [
  { value: "high", label: "Alto — decisor final" },
  { value: "medium", label: "Medio — influenciador fuerte" },
  { value: "low", label: "Bajo — influenciador" },
  { value: "influencer", label: "Influenciador — sin poder formal" },
];

// ── Main Component ─────────────────────────────────────────────────────────────

/**
 * BuyerLeafForm — full buyer profile form with autosave and set-primary action.
 */
export function BuyerLeafForm({ buyerId, icpId }: BuyerLeafFormProps) {
  const { data: buyer, isLoading, error } = useBuyer(buyerId);
  const patchBuyer = usePatchBuyer(buyerId, icpId);
  const setPrimary = useSetPrimaryBuyer(buyerId, icpId);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    register,
    watch,
    setValue,
    reset,
    formState: { isDirty },
  } = useForm<BuyerFormValues>({
    resolver: zodResolver(buyerFormSchema),
    defaultValues: {
      name: "",
      role: "",
      decisionPower: undefined,
      isPrimary: false,
      demographics: {},
      psychographics: {},
      painPoints: [],
      desires: [],
      objections: [],
      buyerJourney: {},
      purchaseTriggers: [],
      preferredChannels: [],
    },
  });

  // Reset form when buyer loads
  useEffect(() => {
    if (buyer) {
      reset({
        name: buyer.name ?? "",
        role: buyer.role ?? "",
        decisionPower: buyer.decisionPower ?? undefined,
        isPrimary: buyer.isPrimary ?? false,
        demographics: buyer.demographics ?? {},
        psychographics: buyer.psychographics ?? {},
        painPoints: buyer.painPoints ?? [],
        desires: buyer.desires ?? [],
        objections: buyer.objections ?? [],
        buyerJourney: buyer.buyerJourney ?? {},
        purchaseTriggers: buyer.purchaseTriggers ?? [],
        preferredChannels: buyer.preferredChannels ?? [],
      });
    }
  }, [buyer, reset]);

  // Autosave on change (debounce 600ms)
  const scheduleAutosave = useCallback(
    (values: BuyerFormValues) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        patchBuyer.mutate(values as Parameters<typeof patchBuyer.mutate>[0], {
          onSuccess: () => {
            toast.success("Guardado.", { duration: 1800 });
          },
          onError: () => {
            toast.error("Error al guardar. Intenta de nuevo.");
          },
        });
      }, 600);
    },
    [patchBuyer],
  );

  useEffect(() => {
    const subscription = watch((values) => {
      if (isDirty) {
        scheduleAutosave(values as BuyerFormValues);
      }
    });
    return () => {
      subscription.unsubscribe();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [watch, isDirty, scheduleAutosave]);

  // set-primary handler (RN-6)
  const handleSetPrimary = useCallback(async () => {
    try {
      await setPrimary.mutateAsync();
      toast.success("Buyer establecido como principal.");
    } catch {
      toast.error("No se pudo establecer como principal.");
    }
  }, [setPrimary]);

  // Loading / error states
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 p-6" aria-busy="true" aria-label="Cargando buyer">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-3/4" />
      </div>
    );
  }

  if (error || !buyer) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive m-6"
      >
        No se pudo cargar el buyer. Intenta de nuevo.
      </div>
    );
  }

  // Watched array fields
  const watchedPainPoints = watch("painPoints") ?? [];
  const watchedDesires = watch("desires") ?? [];
  const watchedObjections = watch("objections") ?? [];
  const watchedChannels = watch("preferredChannels") ?? [];
  const watchedDemo = watch("demographics") ?? {};
  const watchedPsycho = watch("psychographics") ?? {};
  const watchedJourney = watch("buyerJourney") ?? {};

  const updateJsonb = (field: keyof BuyerFormValues, key: string, val: string) => {
    const current = (watch(field) as Record<string, unknown>) ?? {};
    setValue(field, { ...current, [key]: val } as BuyerFormValues[typeof field], {
      shouldDirty: true,
    });
  };

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="flex flex-col gap-0 p-6"
      data-testid="buyer-leaf-form"
      aria-label={`Perfil de buyer: ${buyer.name}`}
    >
      {/* ── Grupo 1: Identidad ───────────────────────────────────────────────── */}
      <Group>
        <GroupHeader title="Identidad del buyer" consumers={["christian", "norvil"]} />

        {/* Buyer header + set-primary (RN-6) */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white bg-agent-abel"
              aria-hidden="true"
            >
              {buyer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold">{buyer.name}</p>
              {buyer.isPrimary && (
                <span className="text-[10px] font-medium text-agent-abel bg-agent-abel/10 px-1.5 py-0.5 rounded-full">
                  Principal
                </span>
              )}
            </div>
          </div>
          {!buyer.isPrimary && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                void handleSetPrimary();
              }}
              disabled={setPrimary.isPending}
              aria-busy={setPrimary.isPending}
              data-testid="buyer-set-primary-btn"
              className="text-xs"
            >
              {setPrimary.isPending ? "Guardando…" : "Establecer como principal"}
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <FieldRow label="Nombre *" htmlFor="buyer-name">
            <Input
              id="buyer-name"
              {...register("name")}
              placeholder="ej. Jefe de Logística"
              data-testid="buyer-field-name"
              className="text-sm"
            />
          </FieldRow>
          <div className="grid grid-cols-2 gap-3">
            <FieldRow label="Rol en la empresa" htmlFor="buyer-role">
              <Input
                id="buyer-role"
                {...register("role")}
                placeholder="ej. Director de Marketing"
                data-testid="buyer-field-role"
                className="text-sm"
              />
            </FieldRow>
            <FieldRow label="Poder de decisión" htmlFor="buyer-decision-power">
              <select
                id="buyer-decision-power"
                {...register("decisionPower")}
                data-testid="buyer-field-decision-power"
                className={cn(
                  "flex h-9 w-full rounded-md border border-input bg-background px-3 py-2",
                  "text-sm ring-offset-background",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                )}
              >
                <option value="">Selecciona…</option>
                {DECISION_POWER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </FieldRow>
          </div>
        </div>
      </Group>

      {/* ── Grupo 2: Datos demográficos ─────────────────────────────────────── */}
      <Group>
        <GroupHeader title="Datos demográficos" consumers={["christian"]} />
        <div className="flex flex-col gap-3">
          {(
            [
              {
                key: "age_range",
                label: "Rango de edad",
                placeholder: "ej. 35-50 años",
                id: "buyer-demo-age-range",
              },
              {
                key: "location",
                label: "Ubicación",
                placeholder: "ej. Ciudad de México",
                id: "buyer-demo-location",
              },
              {
                key: "occupation",
                label: "Ocupación",
                placeholder: "ej. Director de agencia",
                id: "buyer-demo-occupation",
              },
              {
                key: "income_range",
                label: "Rango de ingresos",
                placeholder: "ej. USD 80k-150k",
                id: "buyer-demo-income-range",
              },
            ] as const
          ).map(({ key, label, placeholder, id }) => (
            <FieldRow key={key} label={label} htmlFor={id}>
              <Input
                id={id}
                value={typeof watchedDemo[key] === "string" ? (watchedDemo[key] as string) : ""}
                onChange={(e) => updateJsonb("demographics", key, e.target.value)}
                placeholder={placeholder}
                data-testid={id}
                className="text-sm"
              />
            </FieldRow>
          ))}
        </div>
      </Group>

      {/* ── Grupo 3: Psicografía ────────────────────────────────────────────── */}
      <Group>
        <GroupHeader title="Psicografía" consumers={["abel", "christian"]} />
        <div className="flex flex-col gap-3">
          {(
            [
              {
                key: "values",
                label: "Valores",
                placeholder: "ej. Eficiencia, escalabilidad, ROI medible",
                id: "buyer-psycho-values",
              },
              {
                key: "lifestyle",
                label: "Estilo de vida",
                placeholder: "ej. Orientado a resultados, siempre conectado",
                id: "buyer-psycho-lifestyle",
              },
              {
                key: "aspirations",
                label: "Aspiraciones",
                placeholder: "ej. Escalar la agencia a 2x en 12 meses",
                id: "buyer-psycho-aspirations",
              },
            ] as const
          ).map(({ key, label, placeholder, id }) => (
            <FieldRow key={key} label={label} htmlFor={id}>
              <Textarea
                id={id}
                value={typeof watchedPsycho[key] === "string" ? (watchedPsycho[key] as string) : ""}
                onChange={(e) => updateJsonb("psychographics", key, e.target.value)}
                placeholder={placeholder}
                data-testid={id}
                rows={2}
              />
            </FieldRow>
          ))}
        </div>
      </Group>

      {/* ── Grupo 4: Dolores ─────────────────────────────────────────────────── */}
      <Group>
        <GroupHeader title="Dolores" consumers={["christian", "abel"]} />
        <ListDictField
          label="Dolor"
          value={watchedPainPoints}
          onChange={(v) => setValue("painPoints", v, { shouldDirty: true })}
          singleFieldKey="description"
          placeholder="ej. No puedo medir el ROI de mis campañas"
          data-testid="buyer-pain-points"
        />
      </Group>

      {/* ── Grupo 5: Deseos ──────────────────────────────────────────────────── */}
      <Group>
        <GroupHeader title="Deseos" consumers={["abel", "christian"]} />
        <ListDictField
          label="Deseo"
          value={watchedDesires}
          onChange={(v) => setValue("desires", v, { shouldDirty: true })}
          singleFieldKey="description"
          placeholder="ej. Tener visibilidad total de mis campañas en tiempo real"
          data-testid="buyer-desires"
        />
      </Group>

      {/* ── Grupo 6: Objeciones ──────────────────────────────────────────────── */}
      <Group>
        <GroupHeader title="Objeciones" consumers={["christian"]} />
        <ListDictField
          label="Objeción"
          value={watchedObjections}
          onChange={(v) => setValue("objections", v, { shouldDirty: true })}
          singleFieldKey="description"
          placeholder={`ej. "Ya tenemos una agencia que hace eso"`}
          data-testid="buyer-objections"
        />
      </Group>

      {/* ── Grupo 7: Canales preferidos ─────────────────────────────────────── */}
      <Group>
        <GroupHeader title="Canales preferidos" consumers={["christian", "brenda"]} />
        <ListDictField
          label="Canal"
          value={watchedChannels}
          onChange={(v) => setValue("preferredChannels", v, { shouldDirty: true })}
          singleFieldKey="channel"
          placeholder="ej. LinkedIn, WhatsApp, Email"
          data-testid="buyer-preferred-channels"
        />
      </Group>

      {/* ── Grupo 8: Viaje del comprador ─────────────────────────────────────── */}
      <Group>
        <GroupHeader title="Viaje del comprador" consumers={["christian", "abel"]} />
        <div className="flex flex-col gap-3">
          {(
            [
              {
                key: "awareness",
                label: "Reconocimiento",
                placeholder: "¿Cómo descubre que tiene este problema?",
                id: "buyer-journey-awareness",
              },
              {
                key: "consideration",
                label: "Consideración",
                placeholder: "¿Qué opciones evalúa para resolverlo?",
                id: "buyer-journey-consideration",
              },
              {
                key: "decision",
                label: "Decisión",
                placeholder: "¿Qué lo lleva a elegir al proveedor final?",
                id: "buyer-journey-decision",
              },
            ] as const
          ).map(({ key, label, placeholder, id }) => (
            <FieldRow key={key} label={label} htmlFor={id}>
              <Textarea
                id={id}
                value={
                  typeof watchedJourney[key] === "string" ? (watchedJourney[key] as string) : ""
                }
                onChange={(e) => updateJsonb("buyerJourney", key, e.target.value)}
                placeholder={placeholder}
                data-testid={id}
                rows={2}
              />
            </FieldRow>
          ))}
        </div>
      </Group>

      {patchBuyer.isPending && (
        <p
          aria-live="polite"
          className="text-xs text-muted-foreground text-right"
          data-testid="buyer-autosave-indicator"
        >
          Guardando…
        </p>
      )}
    </form>
  );
}
