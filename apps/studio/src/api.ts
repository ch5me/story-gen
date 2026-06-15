import {
  ProjectSchema,
  WebManifestSchema,
  type Project,
  type WebManifest,
} from '@ch5me/storygen-schema';
import { z } from 'zod';

/**
 * Typed client for the StoryGen API. Reads its base URL from
 * `VITE_PUBLIC_API_URL` and validates every response against the canonical
 * schema — a malformed payload fails loud instead of poisoning editor state.
 */

const ProjectListSchema = z.array(ProjectSchema);

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface StudioApi {
  readonly baseUrl: string;
  listProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project>;
  seedProject(project: Project): Promise<Project>;
  saveProject(project: Project): Promise<Project>;
  compile(id: string): Promise<WebManifest>;
}

/**
 * Resolve the API base URL. Fail fast (no silent localhost fallback) so a
 * missing build-time env is surfaced at construction, not as a confusing 404
 * later. Tests never construct this — they inject a Project directly.
 */
function resolveBaseUrl(explicit?: string): string {
  const url = explicit ?? import.meta.env.VITE_PUBLIC_API_URL;
  if (!url) {
    throw new ApiError(
      'VITE_PUBLIC_API_URL is not set. The studio cannot reach the API without it.',
    );
  }
  return url.replace(/\/+$/, '');
}

export function createApi(explicitBaseUrl?: string): StudioApi {
  const baseUrl = resolveBaseUrl(explicitBaseUrl);

  async function request<S extends z.ZodTypeAny>(
    path: string,
    schema: S,
    init?: RequestInit,
  ): Promise<z.output<S>> {
    const response = await fetch(`${baseUrl}${path}`, {
      headers: { 'content-type': 'application/json' },
      ...init,
    });
    if (!response.ok) {
      throw new ApiError(
        `API ${init?.method ?? 'GET'} ${path} failed: ${response.status} ${response.statusText}`,
        response.status,
      );
    }
    const json: unknown = await response.json();
    return schema.parse(json);
  }

  return {
    baseUrl,
    listProjects: () => request('/projects', ProjectListSchema),
    getProject: (id) => request(`/projects/${id}`, ProjectSchema),
    seedProject: (project) =>
      request('/projects', ProjectSchema, {
        method: 'POST',
        body: JSON.stringify(project),
      }),
    saveProject: (project) =>
      request(`/projects/${project.id}`, ProjectSchema, {
        method: 'PUT',
        body: JSON.stringify(project),
      }),
    compile: (id) =>
      request(`/projects/${id}/compile`, WebManifestSchema, { method: 'POST' }),
  };
}
