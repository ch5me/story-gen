import '@testing-library/jest-dom';

/**
 * jsdom does not implement ResizeObserver, which @xyflow/react (Story Map)
 * constructs on mount. Provide a no-op shim so the graph component can mount
 * under test. This is a jsdom capability gap, not a masked app failure: the
 * Story Map's accessible scene index renders independently of measured size.
 */
class ResizeObserverStub implements ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

if (!('ResizeObserver' in globalThis)) {
  globalThis.ResizeObserver = ResizeObserverStub;
}
