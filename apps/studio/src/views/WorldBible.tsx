import { useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  ScrollArea,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@ch5me/ch5-ui-web';
import type { EntityKind, Project } from '@ch5me/storygen-schema';

interface WorldBibleProps {
  project: Project;
}

interface EntityRow {
  id: string;
  kind: EntityKind;
  label: string;
  detail?: string;
}

const TABS: { kind: EntityKind; label: string }[] = [
  { kind: 'character', label: 'Characters' },
  { kind: 'location', label: 'Locations' },
  { kind: 'prop', label: 'Props' },
  { kind: 'lore', label: 'Lore facts' },
  { kind: 'event', label: 'Plot threads' },
];

/**
 * World Bible: an entity browser over characters/locations/props/loreFacts/
 * plotThreads, with the world's entityLinks rendered as editable-looking
 * cross-links.
 */
export function WorldBible({ project }: WorldBibleProps): React.ReactElement {
  const [activeKind, setActiveKind] = useState<EntityKind>('character');
  const labelById = entityLabelIndex(project);

  return (
    <Tabs
      value={activeKind}
      onValueChange={(value) => setActiveKind(value as EntityKind)}
      className="flex h-full flex-col"
      data-view="world-bible"
    >
      <div className="border-b p-2">
        <TabsList variant="line">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.kind} value={tab.kind}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {TABS.map((tab) => (
        <TabsContent key={tab.kind} value={tab.kind} className="min-h-0 flex-1">
          <ScrollArea className="h-full">
            <div className="p-4">
              <h1 className="mb-3 text-lg font-semibold">{tab.label}</h1>
              <ul className="space-y-2">
                {entityRows(project, tab.kind).map((row) => (
                  <li key={row.id}>
                    <Card data-entity-id={row.id}>
                      <CardContent>
                        <div className="flex items-baseline justify-between">
                          <span className="text-sm font-medium">{row.label}</span>
                          <span className="text-muted-foreground text-[11px]">{row.id}</span>
                        </div>
                        {row.detail ? (
                          <p className="text-muted-foreground mt-0.5 text-xs">{row.detail}</p>
                        ) : null}
                        <CrossLinks project={project} entityId={row.id} labelById={labelById} />
                      </CardContent>
                    </Card>
                  </li>
                ))}
                {entityRows(project, tab.kind).length === 0 ? (
                  <li className="text-muted-foreground text-sm">No entities.</li>
                ) : null}
              </ul>
            </div>
          </ScrollArea>
        </TabsContent>
      ))}
    </Tabs>
  );
}

function CrossLinks({
  project,
  entityId,
  labelById,
}: {
  project: Project;
  entityId: string;
  labelById: Map<string, string>;
}): React.ReactElement | null {
  const links = project.world.entityLinks.filter(
    (link) => link.fromId === entityId || link.toId === entityId,
  );
  if (links.length === 0) return null;
  return (
    <div className="mt-1.5 flex flex-wrap gap-1" data-region="cross-links">
      {links.map((link) => {
        const otherId = link.fromId === entityId ? link.toId : link.fromId;
        const direction = link.fromId === entityId ? '→' : '←';
        return (
          <Button
            key={link.id}
            type="button"
            variant="outline"
            size="xs"
            className="border-dashed font-normal"
            title="Edit cross-link"
          >
            {link.relation} {direction} {labelById.get(otherId) ?? otherId}
          </Button>
        );
      })}
    </div>
  );
}

function entityRows(project: Project, kind: EntityKind): EntityRow[] {
  const { world } = project;
  switch (kind) {
    case 'character':
      return world.characters.map((c) => ({
        id: c.id,
        kind,
        label: c.name,
        detail: c.role,
      }));
    case 'location':
      return world.locations.map((l) => ({
        id: l.id,
        kind,
        label: l.name,
        detail: l.description,
      }));
    case 'prop':
      return world.props.map((p) => ({
        id: p.id,
        kind,
        label: p.name,
        detail: p.description,
      }));
    case 'lore':
      return world.loreFacts.map((f) => ({
        id: f.id,
        kind,
        label: f.statement,
        detail: f.tags.join(', ') || undefined,
      }));
    case 'event':
      return world.plotThreads.map((t) => ({
        id: t.id,
        kind,
        label: t.name,
        detail: t.description,
      }));
    default:
      return [];
  }
}

function entityLabelIndex(project: Project): Map<string, string> {
  const index = new Map<string, string>();
  const { world } = project;
  for (const c of world.characters) index.set(c.id, c.name);
  for (const l of world.locations) index.set(l.id, l.name);
  for (const p of world.props) index.set(p.id, p.name);
  for (const f of world.loreFacts) index.set(f.id, f.statement);
  for (const t of world.plotThreads) index.set(t.id, t.name);
  return index;
}
