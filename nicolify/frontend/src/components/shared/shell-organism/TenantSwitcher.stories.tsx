// cap: shell-organism.shell-nicolify
/**
 * TenantSwitcher.stories.tsx — CSF3 stories para TenantSwitcher.
 *
 * Skeleton del switcher de agencias — T-2 scope.
 * No usa hooks de datos (T-3+ los cablará).
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { TenantSwitcher } from "./TenantSwitcher";

const meta: Meta<typeof TenantSwitcher> = {
  title: "Shell/Organismo/TenantSwitcher",
  component: TenantSwitcher,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof TenantSwitcher>;

/** Trigger cerrado — hacer clic para ver el dropdown skeleton. */
export const TriggerCerrado: Story = {};
