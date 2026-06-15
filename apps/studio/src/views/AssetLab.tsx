import { useState } from 'react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  ScrollArea,
} from '@ch5me/ch5-ui-web';
import { Sparkles, Upload } from 'lucide-react';
import type { Asset, AssetStatus, Project } from '@ch5me/storygen-schema';
import { compileCharacterPrompt } from '@ch5me/storygen-prompt-compiler';

interface AssetLabProps {
  project: Project;
}

interface Candidate {
  id: string;
  label: string;
  status: AssetStatus;
  prompt: string;
}

let candidateCounter = 0;

/**
 * Asset Lab: list world assets, an upload stub, a deterministic "Mock generate"
 * button, and a candidate gallery with approve/lock placeholders. Generation
 * here is local-only (no network) — it previews a real prompt via the prompt
 * compiler so the seam to a real backend is obvious.
 */
export function AssetLab({ project }: AssetLabProps): React.ReactElement {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const firstCharacterId = project.world.characters[0]?.id;

  const mockGenerate = (): void => {
    if (!firstCharacterId) return;
    const compiled = compileCharacterPrompt(project, firstCharacterId);
    candidateCounter += 1;
    setCandidates((prev) => [
      {
        id: `cand_${candidateCounter}`,
        label: `Candidate ${candidateCounter}`,
        status: 'candidate',
        prompt: compiled.prompt,
      },
      ...prev,
    ]);
  };

  const setCandidateStatus = (id: string, status: AssetStatus): void => {
    setCandidates((prev) =>
      prev.map((candidate) => (candidate.id === id ? { ...candidate, status } : candidate)),
    );
  };

  return (
    <ScrollArea className="h-full" data-view="asset-lab">
      <div className="p-4">
        <header className="mb-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Asset Lab</h1>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" disabled title="Manual upload (stub)">
              <Upload aria-hidden />
              Upload
            </Button>
            <Button type="button" size="sm" onClick={mockGenerate} disabled={!firstCharacterId}>
              <Sparkles aria-hidden />
              Mock generate
            </Button>
          </div>
        </header>

        <section className="mb-5">
          <h2 className="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wide">
            World assets
          </h2>
          <ul className="grid grid-cols-2 gap-2 lg:grid-cols-3">
            {project.world.assets.map((asset) => (
              <AssetCard key={asset.id} asset={asset} />
            ))}
            {project.world.assets.length === 0 ? (
              <li className="text-muted-foreground text-sm">No assets yet.</li>
            ) : null}
          </ul>
        </section>

        <section>
          <h2 className="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wide">
            Candidate gallery
          </h2>
          {candidates.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No candidates yet. Use Mock generate to add one.
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-2 lg:grid-cols-3" data-region="candidates">
              {candidates.map((candidate) => (
                <li key={candidate.id}>
                  <Card data-candidate-id={candidate.id}>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{candidate.label}</span>
                        <StatusPill status={candidate.status} />
                      </div>
                      <p className="text-muted-foreground mt-1 line-clamp-3 text-xs">
                        {candidate.prompt}
                      </p>
                      <div className="mt-2 flex gap-1.5">
                        <Button
                          type="button"
                          size="xs"
                          onClick={() => setCandidateStatus(candidate.id, 'approved')}
                        >
                          Approve
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="xs"
                          onClick={() => setCandidateStatus(candidate.id, 'locked')}
                        >
                          Lock
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </ScrollArea>
  );
}

function AssetCard({ asset }: { asset: Asset }): React.ReactElement {
  return (
    <li data-asset-id={asset.id}>
      <Card>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{asset.caption ?? asset.id}</span>
            <StatusPill status={asset.status} />
          </div>
          <div className="text-muted-foreground mt-0.5 text-[11px]">{asset.kind}</div>
        </CardContent>
      </Card>
    </li>
  );
}

function StatusPill({ status }: { status: AssetStatus }): React.ReactElement {
  const variant = status === 'locked' || status === 'approved' ? 'secondary' : 'outline';
  return (
    <Badge variant={variant} className="font-medium">
      {status}
    </Badge>
  );
}
