"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/cn";
import { broadcastComposeSchema, type BroadcastComposeInput } from "../schemas/broadcast-compose-schema";
import type { CohortBroadcast } from "../types/cohort.types";

interface CohortBroadcastComposerProps {
  onSend: (data: BroadcastComposeInput) => void;
  isSending?: boolean;
  previousBroadcasts?: CohortBroadcast[];
  className?: string;
}

const CHANNEL_OPTIONS = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Correo electrónico" },
  { value: "sms", label: "SMS" },
] as const;

const AUDIENCE_OPTIONS = [
  { value: "all", label: "Todos los miembros" },
  { value: "engaged_only", label: "Solo miembros activos" },
  { value: "inactive_7d", label: "Inactivos los últimos 7 días" },
] as const;

export function CohortBroadcastComposer({
  onSend,
  isSending,
  previousBroadcasts = [],
  className,
}: CohortBroadcastComposerProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BroadcastComposeInput>({
    resolver: zodResolver(broadcastComposeSchema),
    defaultValues: { channel: "whatsapp", audience: "all" },
  });

  const onSubmit = (data: BroadcastComposeInput) => {
    onSend(data);
    reset();
  };

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {/* Composer form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4 rounded-xl border bg-card p-4"
        aria-label="Redactar comunicación"
      >
        <h3 className="font-semibold">Nueva comunicación</h3>

        {/* Channel */}
        <fieldset>
          <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Canal
          </legend>
          <div className="flex gap-2">
            {CHANNEL_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex items-center gap-1.5 text-sm">
                <input
                  type="radio"
                  value={opt.value}
                  {...register("channel")}
                  className="accent-primary"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </fieldset>

        {/* Subject */}
        <div>
          <label htmlFor="broadcast-subject" className="mb-1 block text-xs font-semibold text-muted-foreground">
            Asunto
          </label>
          <input
            id="broadcast-subject"
            {...register("subject")}
            className={cn(
              "w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary",
              errors.subject && "border-comunify-critical"
            )}
            placeholder="Título de tu mensaje"
          />
          {errors.subject && (
            <p className="mt-1 text-xs text-comunify-critical" role="alert">{errors.subject.message}</p>
          )}
        </div>

        {/* Body */}
        <div>
          <label htmlFor="broadcast-body" className="mb-1 block text-xs font-semibold text-muted-foreground">
            Mensaje
          </label>
          <textarea
            id="broadcast-body"
            {...register("body")}
            rows={4}
            className={cn(
              "w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary",
              errors.body && "border-comunify-critical"
            )}
            placeholder="Escribe tu mensaje aquí..."
          />
          {errors.body && (
            <p className="mt-1 text-xs text-comunify-critical" role="alert">{errors.body.message}</p>
          )}
        </div>

        {/* Audience */}
        <div>
          <label htmlFor="broadcast-audience" className="mb-1 block text-xs font-semibold text-muted-foreground">
            Audiencia
          </label>
          <select
            id="broadcast-audience"
            {...register("audience")}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {AUDIENCE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={isSending}
          className={cn(
            "rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground",
            "hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
          aria-busy={isSending}
        >
          {isSending ? "Enviando..." : "Enviar comunicación"}
        </button>
      </form>

      {/* History */}
      {previousBroadcasts.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-semibold text-muted-foreground">Historial</h4>
          <ul className="flex flex-col gap-2">
            {previousBroadcasts.map((b) => (
              <li key={b.id} className="flex items-center justify-between rounded-lg border bg-card px-3 py-2 text-sm">
                <div>
                  <p className="font-medium">{b.subject}</p>
                  <p className="text-xs text-muted-foreground">
                    {b.channel} · {b.recipients_count} destinatarios
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Intl.DateTimeFormat("es-419", { dateStyle: "short" }).format(new Date(b.sent_at))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
