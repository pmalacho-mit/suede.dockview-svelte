// jsdom has no ResizeObserver, which dockview needs to watch its container.
// It also has no layout, so nothing is ever reported as resized: tests that
// assert on geometry do so through `layout` in support.svelte.ts, which only
// asserts in a real browser (`npm run report`).
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
