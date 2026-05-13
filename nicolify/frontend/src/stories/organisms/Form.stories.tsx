import { Button } from "@luana/ui-kit";
import { Card, CardContent, CardHeader, CardTitle } from "@luana/ui-kit";
import { Input } from "@luana/ui-kit";
import { Label } from "@luana/ui-kit";
import { Textarea } from "@luana/ui-kit";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta = {
  title: "Organisms/Form",
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <Card className="w-[450px]">
      <CardHeader>
        <CardTitle>Contact Us</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contact-name">Name</Label>
            <Input id="contact-name" placeholder="Your name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-email">Email</Label>
            <Input id="contact-email" type="email" placeholder="your@email.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-message">Message</Label>
            <Textarea id="contact-message" placeholder="Type your message here" />
          </div>
          <Button type="submit" className="w-full">
            Send Message
          </Button>
        </form>
      </CardContent>
    </Card>
  ),
};
