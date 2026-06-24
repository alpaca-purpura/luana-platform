// cap: abel.icp-buyer
/**
 * IcpIntakeOverlay.stories.tsx — CSF3 stories para IcpIntakeOverlay.
 *
 * IcpIntakeOverlay es un Dialog controlado por useAbelUiStore.intakeOverlayOpen.
 * Para que aparezca en Storybook necesitamos inicializar el store con la flag = true.
 *
 * NOTA: El store de Zustand (useAbelUiStore) es un singleton en el módulo.
 * En stories, se pueden inyectar acciones via play() o render() con store.setState.
 */

import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";

import { withSeededQuery } from "../../../../../.storybook/decorators/withQueryClient";

import { useAbelUiStore } from "../../store/abel-ui-store";

import { IcpIntakeOverlay } from "./IcpIntakeOverlay";

/** Decorator que abre el overlay forzando el store flag antes de renderizar. */
const withOverlayOpen: Decorator = (Story) => {
  // Abrir el overlay antes del primer render
  useAbelUiStore.setState({ intakeOverlayOpen: true });
  return <Story />;
};

const meta: Meta<typeof IcpIntakeOverlay> = {
  title: "Abel/ICP/IcpIntakeOverlay",
  component: IcpIntakeOverlay,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof IcpIntakeOverlay>;

/**
 * Overlay abierto — muestra UniversalIntake con los tres modos de entrada.
 * El dialog se abre automáticamente via el store flag.
 */
export const Abierto: Story = {
  decorators: [
    withOverlayOpen,
    withSeededQuery((qc) => {
      // Mutations de extracción usan QueryClient
      qc.setQueryData(["abel", "icp", "list"], []);
    }),
  ],
};

/**
 * Overlay cerrado (estado por defecto del componente).
 * No renderiza nada visible — útil para verificar que no rompe el árbol.
 */
export const Cerrado: Story = {
  decorators: [
    withSeededQuery((qc) => {
      qc.setQueryData(["abel", "icp", "list"], []);
    }),
  ],
};
