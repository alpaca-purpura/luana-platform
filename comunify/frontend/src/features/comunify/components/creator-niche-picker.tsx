"use client";

import { cn } from "@/lib/cn";

export type NicheOption = {
  slug: string;
  label: string;
  description: string;
  icon: string;
};

const NICHE_OPTIONS: NicheOption[] = [
  { slug: "coaching_life", label: "Coaching de vida", description: "Bienestar, propósito y mentalidad", icon: "🌱" },
  { slug: "coaching_business", label: "Coaching de negocios", description: "Estrategia y crecimiento empresarial", icon: "🚀" },
  { slug: "coaching_health", label: "Salud y bienestar", description: "Nutrición, medicina integrativa", icon: "💚" },
  { slug: "coaching_fitness", label: "Fitness y deporte", description: "Entrenamiento y rendimiento físico", icon: "💪" },
  { slug: "coaching_finance", label: "Finanzas personales", description: "Inversiones y libertad financiera", icon: "💰" },
  { slug: "consulting", label: "Consultoría", description: "Asesoría especializada B2B o B2C", icon: "🎯" },
  { slug: "mentoring", label: "Mentoría", description: "Acompañamiento personalizado 1:1", icon: "🤝" },
  { slug: "teaching", label: "Educación", description: "Cursos y formación especializada", icon: "📚" },
  { slug: "therapy", label: "Terapia y psicología", description: "Apoyo emocional y mental", icon: "🧠" },
  { slug: "other", label: "Otro", description: "Mi nicho no está en la lista", icon: "✨" },
];

interface CreatorNichePickerProps {
  value: string | null;
  onChange: (slug: string) => void;
  className?: string;
}

export function CreatorNichePicker({ value, onChange, className }: CreatorNichePickerProps) {
  return (
    <div
      className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3", className)}
      role="radiogroup"
      aria-label="Selecciona tu nicho"
    >
      {NICHE_OPTIONS.map((opt) => (
        <button
          key={opt.slug}
          type="button"
          role="radio"
          aria-checked={value === opt.slug}
          onClick={() => onChange(opt.slug)}
          className={cn(
            "flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition-all",
            "hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            value === opt.slug
              ? "border-primary bg-primary/10 ring-1 ring-primary"
              : "border-border bg-card"
          )}
        >
          <span className="text-2xl" aria-hidden="true">
            {opt.icon}
          </span>
          <span className="text-sm font-semibold leading-tight">{opt.label}</span>
          <span className="text-xs text-muted-foreground">{opt.description}</span>
        </button>
      ))}
    </div>
  );
}
