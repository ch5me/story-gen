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

/**
 * jsdom lacks window.matchMedia, which the ch5-ui-web components (via Radix /
 * the sidebar's mobile hook) read on mount. Provide a stub that reports no
 * media match so components mount in their default desktop layout under test.
 */
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
}

/**
 * jsdom does not implement Element.getAnimations (Web Animations API), which the
 * ch5-ui-web ScrollArea (@base-ui) calls from a deferred timer to settle scroll
 * animations. Without it, the post-render timer throws an unhandled error that
 * fails the run even though assertions pass. Return an empty animation list —
 * there are no real animations to await in jsdom.
 */
if (typeof Element !== 'undefined' && typeof Element.prototype.getAnimations !== 'function') {
  Element.prototype.getAnimations = function getAnimations(): Animation[] {
    return [];
  };
}
