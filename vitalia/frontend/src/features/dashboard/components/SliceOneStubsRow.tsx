"use client";

/**
 * SliceOneStubsRow — 5 coming-soon stub cards for Slice 1 features.
 *
 * Features: Inbox / Pipeline / Agenda / Fidelización / Marketing.
 * All display "pronto" badge — no real functionality yet.
 *
 * Client Component: uses `"use client"` because future iterations will
 * add interactive hover state and progressive disclosure.
 *
 * Spanish neutro: "pronto" (no accent needed — monosyllable).
 */

interface StubCard {
  label: string;
  icon: string;
  description: string;
}

const STUB_CARDS: StubCard[] = [
  {
    label: "Inbox",
    icon: "📥",
    description: "Mensajes y notificaciones",
  },
  {
    label: "Pipeline",
    icon: "📊",
    description: "Seguimiento de pacientes",
  },
  {
    label: "Agenda",
    icon: "📅",
    description: "Citas y horarios",
  },
  {
    label: "Fidelización",
    icon: "⭐",
    description: "Retención de pacientes",
  },
  {
    label: "Marketing",
    icon: "📣",
    description: "Campañas y comunicaciones",
  },
];

export function SliceOneStubsRow() {
  return (
    <div
      role="list"
      aria-label="Módulos disponibles próximamente"
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
    >
      {STUB_CARDS.map((card) => (
        <div
          key={card.label}
          role="listitem"
          data-testid="stub-card"
          className="flex flex-col items-start gap-2 rounded-lg border border-gray-200 bg-white p-4 opacity-60"
          aria-label={`${card.label} — próximamente`}
        >
          <span className="text-2xl" aria-hidden="true">
            {card.icon}
          </span>
          <div className="flex w-full items-center justify-between gap-1">
            <span className="text-sm font-medium text-gray-700">
              {card.label}
            </span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
              pronto
            </span>
          </div>
          <p className="text-xs text-gray-400">{card.description}</p>
        </div>
      ))}
    </div>
  );
}
