import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ScrollArea,
} from '@ch5me/ch5-ui-web';
import { Lock } from 'lucide-react';
import type { Character, Project } from '@ch5me/storygen-schema';

interface CharacterBibleProps {
  project: Project;
}

/** Character Bible: canon fields, appearance locks, outfits, expressions, relationship vars. */
export function CharacterBible({ project }: CharacterBibleProps): React.ReactElement {
  const { characters } = project.world;
  return (
    <ScrollArea className="h-full" data-view="character-bible">
      <div className="p-4">
        <h1 className="mb-3 text-lg font-semibold">Character Bible</h1>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {characters.map((character) => (
            <CharacterCard key={character.id} character={character} />
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}

function CharacterCard({ character }: { character: Character }): React.ReactElement {
  return (
    <Card data-character-id={character.id}>
      <CardHeader>
        <div className="flex items-baseline justify-between">
          <CardTitle className="text-base font-semibold">{character.name}</CardTitle>
          <span className="text-muted-foreground text-xs">
            {character.role ?? 'character'} · age {character.age}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {character.appearance ? (
          <p className="text-foreground/80 mb-2 text-sm">{character.appearance}</p>
        ) : null}

        <FieldList label="Appearance locks">
          {character.appearanceLocks.length === 0 ? (
            <Empty />
          ) : (
            character.appearanceLocks.map((lock) => (
              <Chip key={lock.field} locked={lock.locked}>
                {lock.field}: {lock.value}
              </Chip>
            ))
          )}
        </FieldList>

        <FieldList label="Outfits">
          {character.outfits.length === 0 ? (
            <Empty />
          ) : (
            character.outfits.map((outfit) => <Chip key={outfit.id}>{outfit.name}</Chip>)
          )}
        </FieldList>

        <FieldList label="Expressions">
          {character.expressions.length === 0 ? (
            <Empty />
          ) : (
            character.expressions.map((expr) => <Chip key={expr}>{expr}</Chip>)
          )}
        </FieldList>

        <FieldList label="Relationship vars">
          {Object.keys(character.relationshipVars).length === 0 ? (
            <Empty />
          ) : (
            Object.entries(character.relationshipVars).map(([key, value]) => (
              <Chip key={key}>
                {key}: {value}
              </Chip>
            ))
          )}
        </FieldList>
      </CardContent>
    </Card>
  );
}

function FieldList({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="mt-2">
      <div className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wide">
        {label}
      </div>
      <div className="mt-1 flex flex-wrap gap-1">{children}</div>
    </div>
  );
}

function Chip({
  children,
  locked,
}: {
  children: React.ReactNode;
  locked?: boolean;
}): React.ReactElement {
  return (
    <Badge variant={locked ? 'secondary' : 'outline'} className="gap-1 font-normal">
      {locked ? <Lock aria-hidden className="size-3" /> : null}
      {children}
    </Badge>
  );
}

function Empty(): React.ReactElement {
  return <span className="text-muted-foreground text-xs">—</span>;
}
