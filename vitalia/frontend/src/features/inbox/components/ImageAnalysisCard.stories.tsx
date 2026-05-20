/**
 * ImageAnalysisCard.stories.tsx — Storybook stories for the Slice 1 image stub card.
 *
 * Cubre: imagen de muestra (placeholder Slice 1), URL de imagen diferente.
 * Next.js Image component funciona nativamente con @storybook/nextjs.
 *
 * downstream-regression-na: brand-local story; no cross-brand consumers
 */

import type { Meta, StoryObj } from "@storybook/nextjs";
import { ImageAnalysisCard } from "./ImageAnalysisCard";

const meta: Meta<typeof ImageAnalysisCard> = {
  title: "Features/Inbox/ImageAnalysisCard",
  component: ImageAnalysisCard,
  tags: ["autodocs"],
  parameters: {
    backgrounds: { default: "vitalia-bg" },
    layout: "padded",
    nextjs: { appDirectory: true },
  },
  args: {
    mediaUrl: "https://picsum.photos/seed/vitalia/320/180",
  },
  argTypes: {
    mediaUrl: {
      control: "text",
      description: "URL CDN de la imagen del paciente",
    },
  },
};

export default meta;
type Story = StoryObj<typeof ImageAnalysisCard>;

export const Default: Story = {
  name: "Análisis pendiente (Slice 1 stub)",
};

export const ImagenRetrato: Story = {
  name: "Imagen en orientación vertical",
  args: {
    mediaUrl: "https://picsum.photos/seed/vitalia-portrait/180/320",
  },
};

export const ImagenPequena: Story = {
  name: "Tamaño personalizado",
  args: {
    className: "max-w-[160px]",
  },
};
