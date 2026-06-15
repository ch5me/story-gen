import type { GenerationJob, Project } from '@ch5me/storygen-schema';
import { sampleProject } from '@ch5me/storygen-schema';

/**
 * Persistence boundary for the API. Storage backends (in-memory, D1, ...) all
 * implement this so routes never depend on a concrete store. Methods reject
 * missing preconditions by throwing — callers handle 404s explicitly, the
 * adapter never invents data.
 */
export interface StorageAdapter {
  listProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | null>;
  createProject(project: Project): Promise<Project>;
  updateProject(id: string, project: Project): Promise<Project>;
  saveGenerationJob(job: GenerationJob): Promise<void>;
  getGenerationJob(id: string): Promise<GenerationJob | null>;
}

/** Structured clone helper that is deterministic and side-effect free. */
function deepClone<T>(value: T): T {
  return structuredClone(value);
}

/**
 * Development/test storage backed by in-memory Maps. The constructor seeds a
 * deep clone of `sampleProject` so `GET /projects` is non-empty immediately and
 * mutations never leak back into the shared fixture.
 */
export class InMemoryStorageAdapter implements StorageAdapter {
  private readonly projects = new Map<string, Project>();
  private readonly generationJobs = new Map<string, GenerationJob>();

  constructor() {
    const seed = deepClone(sampleProject);
    this.projects.set(seed.id, seed);
  }

  async listProjects(): Promise<Project[]> {
    return Array.from(this.projects.values()).map(deepClone);
  }

  async getProject(id: string): Promise<Project | null> {
    const found = this.projects.get(id);
    return found ? deepClone(found) : null;
  }

  async createProject(project: Project): Promise<Project> {
    const stored = deepClone(project);
    this.projects.set(stored.id, stored);
    return deepClone(stored);
  }

  async updateProject(id: string, project: Project): Promise<Project> {
    const stored = deepClone(project);
    this.projects.set(id, stored);
    return deepClone(stored);
  }

  async saveGenerationJob(job: GenerationJob): Promise<void> {
    this.generationJobs.set(job.id, deepClone(job));
  }

  async getGenerationJob(id: string): Promise<GenerationJob | null> {
    const found = this.generationJobs.get(id);
    return found ? deepClone(found) : null;
  }
}

/**
 * Cloudflare D1 storage backend. Deferred to v2 — every method fails fast and
 * loud rather than silently falling back to in-memory, so a misconfigured D1
 * binding surfaces the real error instead of masquerading as a working store.
 */
export class D1StorageAdapter implements StorageAdapter {
  async listProjects(): Promise<Project[]> {
    throw new Error('D1 storage adapter not implemented (v2)');
  }

  async getProject(_id: string): Promise<Project | null> {
    throw new Error('D1 storage adapter not implemented (v2)');
  }

  async createProject(_project: Project): Promise<Project> {
    throw new Error('D1 storage adapter not implemented (v2)');
  }

  async updateProject(_id: string, _project: Project): Promise<Project> {
    throw new Error('D1 storage adapter not implemented (v2)');
  }

  async saveGenerationJob(_job: GenerationJob): Promise<void> {
    throw new Error('D1 storage adapter not implemented (v2)');
  }

  async getGenerationJob(_id: string): Promise<GenerationJob | null> {
    throw new Error('D1 storage adapter not implemented (v2)');
  }
}
