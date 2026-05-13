import { Button } from "@luana/ui-kit";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@luana/ui-kit";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta = {
  title: "Atoms/Tooltip",
  component: Tooltip,
  tags: ["autodocs"],
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Hover me</Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Add to library</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
};
