// cap: sales_agent.inbox-handler-mode-occ
// story-origin: TBD
/**
 * SegmentedControl3Modes.stories.tsx — Storybook stories for the 3-state mode toggle.
 *
 * Covers all 3 segment values + pending + conflict states.
 *
 * downstream-regression-na: brand-local story; no cross-brand consumers
 */

import type { Meta, StoryObj } from "@storybook/nextjs";
import { fn } from "storybook/test";
import { SegmentedControl3Modes } from "./SegmentedControl3Modes";

const meta: Meta<typeof SegmentedControl3Modes> = {
  title: "Features/Inbox/SegmentedControl3Modes",
  component: SegmentedControl3Modes,
  tags: ["autodocs"],
  parameters: {
    backgrounds: { default: "vitalia-bg" },
    layout: "padded",
  },
  args: {
    onChange: fn(),
    isPending: false,
    isConflict: false,
  },
  argTypes: {
    value: {
      control: { type: "select" },
      options: ["adrian-decide", "adrian-consulta", "yo-escribo"],
      description: "Segmento activo actualmente",
    },
    isPending: {
      control: "boolean",
      description: "Hay mutación en vuelo (deshabilita botones)",
    },
    isConflict: {
      control: "boolean",
      description: "Conflicto OCC 409 — muestra ring rojo",
    },
  },
};

export default meta;
type Story = StoryObj<typeof SegmentedControl3Modes>;

export const AdrianDecide: Story = {
  name: "Modo: Adrián decide",
  args: { value: "adrian-decide" },
};

export const AdrianConsulta: Story = {
  name: "Modo: Adrián consulta",
  args: { value: "adrian-consulta" },
};

export const YoEscribo: Story = {
  name: "Modo: Yo escribo",
  args: { value: "yo-escribo" },
};

export const Pending: Story = {
  name: "Pendiente (mutación en vuelo)",
  args: { value: "adrian-decide", isPending: true },
};

export const Conflict: Story = {
  name: "Conflicto OCC 409",
  args: { value: "adrian-consulta", isConflict: true },
};
