import { serve } from '@hono/node-server';
import { MockGenerationProvider } from '@ch5me/storygen-generation';

import { createApp } from './app';
import { InMemoryStorageAdapter } from './storage';

const PORT = 48787;
const HOST = '127.0.0.1';

const app = createApp({
  storage: new InMemoryStorageAdapter(),
  generation: new MockGenerationProvider(),
});

serve({ fetch: app.fetch, port: PORT, hostname: HOST }, (info) => {
  // eslint-disable-next-line no-console
  console.log(`storygen-api dev server listening on http://${HOST}:${info.port}`);
});
