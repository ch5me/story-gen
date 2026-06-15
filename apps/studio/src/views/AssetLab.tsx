import { useState } from 'react';
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
    <div className="h-full overflow-y-auto p-4" data-view="asset-lab">
      <header className="mb-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-100">Asset Lab</h1>
        <div className="flex gap-2">
          <button
            type="button"
            disabled
            className="cursor-not-allowed rounded border border-slate-700 px-3 py-1.5 text-sm text-slate-500"
            title="Manual upload (stub)"
          >
            Upload
          </button>
          <button
            type="button"
            onClick={mockGenerate}
            disabled={!firstCharacterId}
            className="rounded bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
          >
            Mock generate
          </button>
        </div>
      </header>

      <section className="mb-5">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          World assets
        </h2>
        <ul className="grid grid-cols-2 gap-2 lg:grid-cols-3">
          {project.world.assets.map((asset) => (
            <AssetCard key={asset.id} asset={asset} />
          ))}
          {project.world.assets.length === 0 ? (
            <li className="text-sm text-slate-500">No assets yet.</li>
          ) : null}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Candidate gallery
        </h2>
        {candidates.length === 0 ? (
          <p className="text-sm text-slate-500">
            No candidates yet. Use Mock generate to add one.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-2 lg:grid-cols-3" data-region="candidates">
            {candidates.map((candidate) => (
              <li
                key={candidate.id}
                className="rounded border border-slate-800 bg-slate-900/50 p-2"
                data-candidate-id={candidate.id}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-100">{candidate.label}</span>
                  <StatusPill status={candidate.status} />
                </div>
                <p className="mt-1 line-clamp-3 text-xs text-slate-400">{candidate.prompt}</p>
                <div className="mt-2 flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCandidateStatus(candidate.id, 'approved')}
                    className="rounded bg-emerald-600/80 px-2 py-0.5 text-xs text-white hover:bg-emerald-500"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => setCandidateStatus(candidate.id, 'locked')}
                    className="rounded bg-amber-600/80 px-2 py-0.5 text-xs text-white hover:bg-amber-500"
                  >
                    Lock
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function AssetCard({ asset }: { asset: Asset }): React.ReactElement {
  return (
    <li
      className="rounded border border-slate-800 bg-slate-900/50 p-2"
      data-asset-id={asset.id}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-100">{asset.caption ?? asset.id}</span>
        <StatusPill status={asset.status} />
      </div>
      <div className="mt-0.5 text-[11px] text-slate-500">{asset.kind}</div>
    </li>
  );
}

function StatusPill({ status }: { status: AssetStatus }): React.ReactElement {
  const tone =
    status === 'locked'
      ? 'bg-amber-500/20 text-amber-300'
      : status === 'approved'
        ? 'bg-emerald-500/20 text-emerald-300'
        : 'bg-slate-700 text-slate-300';
  return <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${tone}`}>{status}</span>;
}
