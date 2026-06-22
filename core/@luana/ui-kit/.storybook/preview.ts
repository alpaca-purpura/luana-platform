import type { Preview } from "@storybook/nextjs";
import "./preview.css";

/**
 * @luana/ui-kit Storybook preview (story core-ds-foundation T-2).
 *
 * - preview.css carries the full Tailwind v4 wiring + brand-agnostic token contract.
 * - nextjs.appDirectory:true so next/navigation hooks (useParams/useRouter/usePathname)
 *   used by EntityWorkspaceLayout/EntitySubNavBar are mocked under the App Router model.
 * - a11y enabled globally (kit components must stay accessible across all brands).
 */
const preview: Preview = {
  parameters: {
    nextjs: {
      appDirectory: true,
    },
    backgrounds: {
      default: "surface",
      values: [
        { name: "surface", value: "#ffffff" },
        { name: "muted", value: "#f4f4f5" },
        { name: "dark", value: "#0a0a0b" },
      ],
    },
    a11y: {
      config: {},
      options: {
        checks: { "color-contrast": { options: { noScroll: true } } },
        restoreScroll: true,
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
