// cap: abel.icp-buyer
/**
 * IcpMasterListView.stories.tsx — CSF3 stories para IcpMasterListView.
 *
 * Las stories usan el patrón cache-seed (withSeededQuery) para pre-poblar
 * el QueryClient sin MSW ni vi.mock.
 *
 * Estados cubiertos:
 *   - Cargando (skeleton) — withEmptyQuery sin datos
 *   - Vacío — cache con lista vacía (DraftFirstStarter)
 *   - Lista con ICPs — datos pre-cargados
 *   - Error — query en estado error
 */

import type { Decorator, Meta, StoryObj } from "@storybook/nextjs-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import {
  withEmptyQuery,
  withSeededQuery,
} from "../../../../../.storybook/decorators/withQueryClient";
import { icpListFixture } from "../../../../../.storybook/fixtures/abel-icp";

import { IcpMasterListView } from "./IcpMasterListView";

/** Decorator que fuerza el query en estado error */
const withErrorQuery: Decorator = (Story) => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  // Inject error state using query cache directly
  qc.getQueryCache().build(qc, {
    queryKey: ["abel", "icp", "list"],
    queryFn: () => {
      throw new Error("Error al cargar los perfiles de cliente ideal");
    },
  });
  return (
    <QueryClientProvider client={qc}>
      <Story />
    </QueryClientProvider>
  );
};

const meta: Meta<typeof IcpMasterListView> = {
  title: "Abel/ICP/IcpMasterListView",
  component: IcpMasterListView,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof IcpMasterListView>;

/**
 * Estado de carga — muestra el skeleton de grilla.
 * withEmptyQuery provee QueryClientProvider sin datos pre-cargados.
 */
export const Cargando: Story = {
  decorators: [withEmptyQuery],
};

/**
 * Lista vacía — ningún ICP configurado aún.
 * Muestra DraftFirstStarter con las dos acciones:
 *   "Abel me arma un borrador" / "Lo armo yo"
 */
export const Vacio: Story = {
  decorators: [
    withSeededQuery((qc) => {
      qc.setQueryData(["abel", "icp", "list"], []);
    }),
  ],
};

/**
 * Lista con 3 ICPs — estado habitual del panel de Abel.
 * Usa icpListFixture: 1 listo + 1 borrador + 1 sin buyers.
 */
export const ConICPs: Story = {
  decorators: [
    withSeededQuery((qc) => {
      qc.setQueryData(["abel", "icp", "list"], icpListFixture);
    }),
  ],
};

/**
 * Error al cargar — muestra el banner de error con opción de reintentar.
 */
export const ConError: Story = {
  decorators: [withErrorQuery],
};
