// Browsers refuse a view transition while the tab is in the background: the
// update still applies, but `ready` and `finished` reject with
// "InvalidStateError: Transition was aborted because of invalid state.
// Document hidden", and React reports that as a recoverable error.
//
// It happens whenever a <ViewTransition> update commits in a hidden tab:
// a page that finishes streaming in a background tab, a navigation started
// just before switching away, or a dev hot reload while you're in the editor.
// Nobody can see an animation in a hidden tab, so skip it there: run the
// update directly and hand back an already-settled transition.

type Update = (() => void | Promise<void>) | { update?: () => void | Promise<void> };

const install = () => {
  if (typeof document === "undefined" || !document.startViewTransition) return;
  // Guard against double installation (HMR re-evaluates modules)
  if ((document.startViewTransition as { __hiddenGuard?: boolean }).__hiddenGuard) return;
  const native = document.startViewTransition.bind(document);

  const guarded = ((arg?: Update) => {
    if (!document.hidden) return native(arg as never);

    const update = typeof arg === "function" ? arg : arg?.update;
    const done = Promise.resolve().then(() => update?.());
    return {
      updateCallbackDone: done,
      ready: done.then(() => undefined),
      finished: done.then(() => undefined),
      skipTransition: () => {},
      types: new Set<string>(),
    } as unknown as ViewTransition;
  }) as typeof document.startViewTransition;

  (guarded as { __hiddenGuard?: boolean }).__hiddenGuard = true;
  document.startViewTransition = guarded;
};

install();

export {};
