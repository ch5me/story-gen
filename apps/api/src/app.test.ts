import { describe, expect, it } from 'vitest';

import { MockGenerationProvider } from '@ch5me/storygen-generation';
import { WebManifestSchema, sampleProject, type Project } from '@ch5me/storygen-schema';

import { createApp } from './app';
import { InMemoryStorageAdapter } from './storage';

function buildApp() {
  return createApp({
    storage: new InMemoryStorageAdapter(),
    generation: new MockGenerationProvider(),
  });
}

/** A second valid project derived from the fixture under a fresh id. */
function makeProject(id: string): Project {
  return { ...structuredClone(sampleProject), id, name: `Project ${id}` };
}

describe('storygen-api', () => {
  it('GET /health returns ok', async () => {
    const app = buildApp();
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
  });

  it('GET /projects returns the seeded sample project', async () => {
    const app = buildApp();
    const res = await app.request('/projects');
    expect(res.status).toBe(200);
    const projects = (await res.json()) as Project[];
    expect(Array.isArray(projects)).toBe(true);
    expect(projects.length).toBeGreaterThanOrEqual(1);
    expect(projects.some((p) => p.id === sampleProject.id)).toBe(true);
  });

  it('POST /projects then GET roundtrips the new project', async () => {
    const app = buildApp();
    const project = makeProject('proj_roundtrip');

    const createRes = await app.request('/projects', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(project),
    });
    expect(createRes.status).toBe(201);
    const created = (await createRes.json()) as Project;
    expect(created.id).toBe('proj_roundtrip');

    const getRes = await app.request('/projects/proj_roundtrip');
    expect(getRes.status).toBe(200);
    const fetched = (await getRes.json()) as Project;
    expect(fetched.id).toBe('proj_roundtrip');
    expect(fetched.name).toBe('Project proj_roundtrip');
  });

  it('POST /projects rejects an invalid body with 400', async () => {
    const app = buildApp();
    const res = await app.request('/projects', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: 'bad' }),
    });
    expect(res.status).toBe(400);
  });

  it('PUT /projects/:id updates an existing project', async () => {
    const app = buildApp();
    const updated = { ...structuredClone(sampleProject), name: 'Renamed Rooftop' };

    const res = await app.request(`/projects/${sampleProject.id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(updated),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as Project;
    expect(body.name).toBe('Renamed Rooftop');

    const getRes = await app.request(`/projects/${sampleProject.id}`);
    expect(((await getRes.json()) as Project).name).toBe('Renamed Rooftop');
  });

  it('PUT /projects/:id returns 404 for a missing project', async () => {
    const app = buildApp();
    const res = await app.request('/projects/proj_does_not_exist', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(makeProject('proj_does_not_exist')),
    });
    expect(res.status).toBe(404);
  });

  it('POST /projects/:id/compile returns outputs whose .web parses as a WebManifest', async () => {
    const app = buildApp();
    const res = await app.request(`/projects/${sampleProject.id}/compile`, {
      method: 'POST',
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { web: unknown; renpy: unknown; ink: unknown };
    expect(typeof body.renpy).toBe('string');
    expect(typeof body.ink).toBe('string');
    const parsed = WebManifestSchema.safeParse(body.web);
    expect(parsed.success).toBe(true);
  });

  it('POST /projects/:id/seed overwrites the project with sample content under the path id', async () => {
    const app = buildApp();
    const res = await app.request('/projects/proj_seed_target/seed', { method: 'POST' });
    expect(res.status).toBe(200);
    const seeded = (await res.json()) as Project;
    expect(seeded.id).toBe('proj_seed_target');
    expect(seeded.name).toBe(sampleProject.name);

    const getRes = await app.request('/projects/proj_seed_target');
    expect(getRes.status).toBe(200);
  });

  it('POST generation-jobs then GET /generation-jobs/:jobId roundtrips the job', async () => {
    const app = buildApp();
    const submitRes = await app.request(`/projects/${sampleProject.id}/generation-jobs`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ kind: 'panel', prompt: 'a rooftop at dusk', seed: 7 }),
    });
    expect(submitRes.status).toBe(201);
    const job = (await submitRes.json()) as { id: string; status: string; kind: string };
    expect(job.kind).toBe('panel');
    expect(job.status).toBe('succeeded');
    expect(typeof job.id).toBe('string');

    const getRes = await app.request(`/generation-jobs/${job.id}`);
    expect(getRes.status).toBe(200);
    const fetched = (await getRes.json()) as { id: string };
    expect(fetched.id).toBe(job.id);
  });

  it('GET /projects/:id returns 404 for a missing project', async () => {
    const app = buildApp();
    const res = await app.request('/projects/proj_missing');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'Project not found' });
  });

  it('GET /generation-jobs/:id returns 404 for a missing job', async () => {
    const app = buildApp();
    const res = await app.request('/generation-jobs/job_missing');
    expect(res.status).toBe(404);
  });
});
