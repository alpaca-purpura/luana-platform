import { withThemeByClassName } from "@storybook/addon-themes";

import type { Preview } from "@storybook/nextjs-vite";
import "../src/app/globals.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    /**
     * appDirectory: true — activa el adaptador App Router de @storybook/nextjs-vite.
     * Auto-mockea useParams / useRouter / usePathname en todas las stories.
     * Prerequisito para storiar componentes con useParams() (IcpCard, IcpMasterListView…).
     */
    nextjs: {
      appDirectory: true,
    },
  },
  decorators: [
    withThemeByClassName({
      themes: {
        light: "",
        dark: "dark",
      },
      defaultTheme: "light",
    }),
  ],
};

// eslint-disable-next-line import/no-default-export -- Storybook requiere default export en preview.ts
export default preview;
