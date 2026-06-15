import { MockGenerationProvider } from '@ch5me/storygen-generation';

import { createApp, type AppDeps } from './app';
import { InMemoryStorageAdapter, type StorageAdapter } from './storage';

export { createApp } from './app';
export type { AppDeps } from './app';
export {
  D1StorageAdapter,
  InMemoryStorageAdapter,
  type StorageAdapter,
} from './storage';
export { parseGenerationJobRequest } from './generation-request';

/**
 * Default-wired app for the in-memory first slice: seeded in-memory storage and
 * the deterministic mock generation provider. Hosting entrypoints (the Worker,
 * the Node dev server) call this so wiring stays in one place.
 */
export function createDefaultApp(overrides?: Partial<AppDeps>) {
  const storage: StorageAdapter = overrides?.storage ?? new InMemoryStorageAdapter();
  const generation = overrides?.generation ?? new MockGenerationProvider();
  return createApp({ storage, generation });
}
