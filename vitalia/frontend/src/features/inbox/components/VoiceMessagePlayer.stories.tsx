// cap: sales_agent.inbox-handler-mode-occ
// story-origin: TBD
/**
 * VoiceMessagePlayer.stories.tsx — Storybook stories for the inline audio player.
 *
 * Covers: transcript válido, confianza baja (SC-02 fallback), sin transcript,
 * duración pre-cargada, transcript expandido por defecto.
 *
 * Note: HTML5 <audio> no reproduce en Storybook canvas, pero el UI (scrubber,
 * velocidad, transcript) sí renderiza correctamente.
 *
 * downstream-regression-na: brand-local story; no cross-brand consumers
 */

import type { Meta, StoryObj } from "@storybook/nextjs";
import { VoiceMessagePlayer } from "./VoiceMessagePlayer";

const SAMPLE_MEDIA_URL = "https://www.w3schools.com/html/horse.ogg";

const meta: Meta<typeof VoiceMessagePlayer> = {
  title: "Features/Inbox/VoiceMessagePlayer",
  component: VoiceMessagePlayer,
  tags: ["autodocs"],
  parameters: {
    backgrounds: { default: "vitalia-bg" },
    layout: "padded",
  },
  args: {
    mediaUrl: SAMPLE_MEDIA_URL,
    durationS: 75,
  },
  argTypes: {
    durationS: {
      control: { type: "number" },
      description:
        "Duración en segundos (para mostrar antes de cargar el audio)",
    },
    transcriptionConfidence: {
      control: { type: "range", min: 0, max: 1, step: 0.01 },
      description:
        "Confianza de Whisper (0–1). Debajo de 0.5 muestra fallback (SC-02)",
    },
  },
};

export default meta;
type Story = StoryObj<typeof VoiceMessagePlayer>;

export const SinTranscript: Story = {
  name: "Sin transcript",
  args: {
    transcriptionText: null,
    transcriptionConfidence: null,
  },
};

export const TranscriptConfiableAlt: Story = {
  name: "Transcript confiable (alta confianza)",
  args: {
    transcriptionText:
      "Hola, quiero consultar si tienen turnos disponibles para el lunes próximo. Mi nombre es Valentina.",
    transcriptionConfidence: 0.87,
  },
};

export const TranscriptBajaConfianza: Story = {
  name: "SC-02: Transcript baja confianza (fallback)",
  args: {
    transcriptionText: "Quiero un turno para el lunes",
    transcriptionConfidence: 0.35,
  },
};

export const SinDuracion: Story = {
  name: "Sin duración precargada",
  args: {
    durationS: null,
    transcriptionText: null,
    transcriptionConfidence: null,
  },
};

export const DuracionLarga: Story = {
  name: "Audio largo (5 minutos)",
  args: {
    durationS: 305,
    transcriptionText:
      "Buenos días, les llamo porque quisiera hacer una consulta sobre los tratamientos que ofrecen.",
    transcriptionConfidence: 0.92,
  },
};
