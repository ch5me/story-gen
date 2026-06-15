import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { ProjectSchema, type GenerationJob } from '@ch5me/storygen-schema';
import { sampleProject } from '@ch5me/storygen-schema';
import { compileAll } from '@ch5me/storygen-compiler';
import type { GenerationProvider, GenerationRequest } from '@ch5me/storygen-generation';

import type { StorageAdapter } from './storage';
import { parseGenerationJobRequest } from './generation-request';

export interface AppDeps {
  storage: StorageAdapter;
  generation: GenerationProvider;
}

/**
 * Build the StoryGen API. All collaborators are injected so the app is fully
 * exercisable in-process (tests use `app.request(...)` with no network). Bodies
 * are validated with the canonical Zod schemas; on failure we fail loud with a
 * 400 naming the validation issues rather than persisting malformed data.
 */
export function createApp(deps: AppDeps): Hono {
  const { storage, generation } = deps;
  const app = new Hono();

  app.use('*', cors());

  app.get('/health', (c) => c.json({ status: 'ok' as const }));

  app.get('/projects', async (c) => {
    const projects = await storage.listProjects();
    return c.json(projects);
  });

  app.post('/projects', async (c) => {
    const body = await c.req.json().catch(() => undefined);
    const parsed = ProjectSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'Invalid project', issues: parsed.error.issues }, 400);
    }
    const created = await storage.createProject(parsed.data);
    return c.json(created, 201);
  });

  app.get('/projects/:projectId', async (c) => {
    const project = await storage.getProject(c.req.param('projectId'));
    if (!project) return c.json({ error: 'Project not found' }, 404);
    return c.json(project);
  });

  app.put('/projects/:projectId', async (c) => {
    const projectId = c.req.param('projectId');
    const existing = await storage.getProject(projectId);
    if (!existing) return c.json({ error: 'Project not found' }, 404);

    const body = await c.req.json().catch(() => undefined);
    const parsed = ProjectSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'Invalid project', issues: parsed.error.issues }, 400);
    }
    const updated = await storage.updateProject(projectId, parsed.data);
    return c.json(updated);
  });

  app.post('/projects/:projectId/compile', async (c) => {
    const project = await storage.getProject(c.req.param('projectId'));
    if (!project) return c.json({ error: 'Project not found' }, 404);
    const outputs = compileAll(project);
    return c.json(outputs);
  });

  app.post('/projects/:projectId/seed', async (c) => {
    const projectId = c.req.param('projectId');
    const seeded = ProjectSchema.parse({ ...structuredClone(sampleProject), id: projectId });
    const existing = await storage.getProject(projectId);
    const saved = existing
      ? await storage.updateProject(projectId, seeded)
      : await storage.createProject(seeded);
    return c.json(saved);
  });

  app.post('/projects/:projectId/generation-jobs', async (c) => {
    const projectId = c.req.param('projectId');
    const project = await storage.getProject(projectId);
    if (!project) return c.json({ error: 'Project not found' }, 404);

    const body = await c.req.json().catch(() => undefined);
    const parsed = parseGenerationJobRequest(body);
    if (!parsed.ok) {
      return c.json({ error: 'Invalid generation request', issues: parsed.issues }, 400);
    }

    const request: GenerationRequest = parsed.value;
    const result = await generation.submit(request);

    const job: GenerationJob = {
      id: result.jobId,
      kind: request.kind,
      status: result.status,
      prompt: request.prompt ?? request.recipe?.basePrompt,
      negativePrompt: request.negativePrompt ?? request.recipe?.negativePrompt,
      resultAssetId: result.asset?.id,
      error: result.error,
    };
    await storage.saveGenerationJob(job);
    return c.json(job, 201);
  });

  app.get('/generation-jobs/:jobId', async (c) => {
    const job = await storage.getGenerationJob(c.req.param('jobId'));
    if (!job) return c.json({ error: 'Generation job not found' }, 404);
    return c.json(job);
  });

  return app;
}
