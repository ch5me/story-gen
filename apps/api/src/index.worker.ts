import { MockGenerationProvider } from '@ch5me/storygen-generation';

import { createApp } from './app';
import { InMemoryStorageAdapter } from './storage';

/**
 * Cloudflare Worker entrypoint. The first slice runs entirely in-memory: the
 * seeded `InMemoryStorageAdapter` + deterministic mock generation provider, so
 * the Worker boots without a live D1 binding. D1/R2 bindings are declared in
 * `wrangler.toml` for parity and wired in v2 (see `D1StorageAdapter`).
 */
const app = createApp({
  storage: new InMemoryStorageAdapter(),
  generation: new MockGenerationProvider(),
});

export default {
  fetch: app.fetch,
};
