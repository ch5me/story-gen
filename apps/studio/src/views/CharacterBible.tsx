import type { Character, Project } from '@ch5me/storygen-schema';

interface CharacterBibleProps {
  project: Project;
}

/** Character Bible: canon fields, appearance locks, outfits, expressions, relationship vars. */
export function CharacterBible({ project }: CharacterBibleProps): React.ReactElement {
  const { characters } = project.world;
  return (
    <div className="h-full overflow-y-auto p-4" data-view="character-bible">
      <h1 className="mb-3 text-lg font-semibold text-slate-100">Character Bible</h1>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {characters.map((character) => (
          <CharacterCard key={character.id} character={character} />
        ))}
      </div>
    </div>
  );
}

function CharacterCard({ character }: { character: Character }): React.ReactElement {
  return (
    <article
      className="rounded border border-slate-800 bg-slate-900/50 p-3"
      data-character-id={character.id}
    >
      <header className="mb-2 flex items-baseline justify-between">
        <h2 className="text-base font-semibold text-slate-100">{character.name}</h2>
        <span className="text-xs text-slate-500">
          {character.role ?? 'character'} · age {character.age}
        </span>
      </header>

      {character.appearance ? (
        <p className="mb-2 text-sm text-slate-300">{character.appearance}</p>
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
    </article>
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
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
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
    <span
      className={`rounded px-1.5 py-0.5 text-xs ${
        locked
          ? 'bg-emerald-500/15 text-emerald-300'
          : 'bg-slate-800 text-slate-200'
      }`}
    >
      {locked ? '🔒 ' : ''}
      {children}
    </span>
  );
}

function Empty(): React.ReactElement {
  return <span className="text-xs text-slate-600">—</span>;
}
