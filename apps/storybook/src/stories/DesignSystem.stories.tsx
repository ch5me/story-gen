import type { Meta, StoryObj } from '@storybook/react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from '@ch5me/ch5-ui-web';

/**
 * Design system primitives from @ch5me/ch5-ui-web.
 * Each story is a compact variant strip — no explanatory prose.
 */
const meta: Meta = {
  title: 'Design System/Primitives',
  parameters: { layout: 'centered' },
};

export default meta;

type Story = StoryObj;

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------

export const ButtonVariants: Story = {
  name: 'Button — variants',
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button variant="default">Default</Button>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
};

export const ButtonSizes: Story = {
  name: 'Button — sizes',
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="xs">xs</Button>
      <Button size="sm">sm</Button>
      <Button size="default">default</Button>
      <Button size="md">md</Button>
      <Button size="lg">lg</Button>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

export const CardStory: Story = {
  name: 'Card',
  render: () => (
    <Card className="w-72">
      <CardHeader>
        <CardTitle>Rooftop</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-[var(--ff-text-muted)]">
          A glass-railed bar above the city.
        </p>
      </CardContent>
    </Card>
  ),
};

// ---------------------------------------------------------------------------
// Badge
// ---------------------------------------------------------------------------

export const BadgeVariants: Story = {
  name: 'Badge — variants',
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="destructive">Destructive</Badge>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Input / Textarea
// ---------------------------------------------------------------------------

export const InputStory: Story = {
  name: 'Input',
  render: () => (
    <div className="flex flex-col gap-3 w-64">
      <Input placeholder="Character name…" />
      <Input placeholder="Disabled" disabled />
    </div>
  ),
};

export const TextareaStory: Story = {
  name: 'Textarea',
  render: () => (
    <Textarea className="w-64" placeholder="Scene description…" rows={4} />
  ),
};

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

export const TabsStory: Story = {
  name: 'Tabs',
  render: () => (
    <Tabs defaultValue="dialogue" className="w-72">
      <TabsList>
        <TabsTrigger value="dialogue">Dialogue</TabsTrigger>
        <TabsTrigger value="narration">Narration</TabsTrigger>
        <TabsTrigger value="choice">Choice</TabsTrigger>
      </TabsList>
      <TabsContent value="dialogue">Dialogue beat editor</TabsContent>
      <TabsContent value="narration">Narration beat editor</TabsContent>
      <TabsContent value="choice">Choice beat editor</TabsContent>
    </Tabs>
  ),
};
