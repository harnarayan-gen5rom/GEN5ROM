// Keep the 3D engine out of the page's startup dependency graph.
export function createSplineGate(React, loadRuntime, Scene) {
  const h = React.createElement;
  return function SplineGate() {
    const [status, setStatus] = React.useState('idle');
    const mounted = React.useRef(true);
    React.useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
    async function load() {
      setStatus('loading');
      try { await loadRuntime(); if (mounted.current) setStatus('ready'); }
      catch { if (mounted.current) setStatus('error'); }
    }
    if (status === 'ready') return h(Scene);
    return h('section', { id: 'interactive', className: 'spline-gate' },
      h('div', { className: 'spline-gate-inner' },
        h('p', { className: 'spline-eyebrow' }, 'A DIFFERENT DIMENSION'),
        h('h2', null, 'Explore my ', h('span', null, 'interactive 3D.')),
        h('p', null, 'Mechanical keyboard and cyber robot. Tap to explore, drag to rotate, and discover the details.'),
        h('div', { className: 'spline-gate-stage' },
          h('div', { className: 'spline-gate-orbit', 'aria-hidden': true }, h('span', null, '3D')),
          h('button', { type: 'button', onClick: load, disabled: status === 'loading', className: 'spline-load-button' },
            status === 'loading' ? 'Loading interactive 3D…' : status === 'error' ? 'Try loading again' : 'Load interactive 3D ↗'),
          h('p', { role: 'status' }, status === 'error' ? 'Could not load 3D. Check your connection and try again.' : 'Original scene quality · Loads only when you choose')
        )
      )
    );
  };
}

export function useSplineScene(React, Application, canvas, runtime, url, onLoaded, setLoading) {
  const [error, setError] = React.useState(false);
  const [attempt, setAttempt] = React.useState(0);
  React.useEffect(() => {
    let cancelled = false, app;
    setError(false); setLoading(true);
    async function start() {
      try {
        app = new Application(canvas.current);
        runtime.current = app;
        await app.load(url);
        if (!cancelled) { setLoading(false); onLoaded(); }
      } catch {
        if (!cancelled) { setError(true); setLoading(false); }
      }
    }
    start();
    return () => {
      cancelled = true;
      if (runtime.current === app) runtime.current = null;
      try { app?.dispose(); } catch { /* Partial WebGL initialization may fail. */ }
    };
  }, [Application, canvas, runtime, url, onLoaded, setLoading, attempt]);
  return { error, retry: () => setAttempt(value => value + 1) };
}
