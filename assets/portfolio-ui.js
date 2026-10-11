// Shared viewport modal for both the gallery and featured reel.
export function lockPage(doc = document, win = window) {
  const body = doc.body, html = doc.documentElement;
  const x = win.scrollX, y = win.scrollY;
  const savedBody = body.style.cssText;
  const savedOverflow = html.style.overflow;
  const root = doc.getElementById('root');
  const wasInert = root?.inert;
  const gap = Math.max(0, win.innerWidth - html.clientWidth);
  const padding = parseFloat(win.getComputedStyle(body).paddingRight) || 0;
  Object.assign(body.style, { position: 'fixed', top: `-${y}px`, left: `-${x}px`, width: '100%', overflow: 'hidden', paddingRight: `${padding + gap}px` });
  html.style.overflow = 'hidden';
  if (root) root.inert = true;
  win.dispatchEvent(new Event('portfolio-modal-change'));
  return () => {
    body.style.cssText = savedBody;
    html.style.overflow = savedOverflow;
    if (root) root.inert = wasInert;
    const behavior = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';
    win.scrollTo(x, y);
    html.style.scrollBehavior = behavior;
    win.dispatchEvent(new Event('portfolio-modal-change'));
  };
}

export function createPortfolioModal(React, ReactDOM) {
  return function PortfolioModal(props) {
    const ref = React.useRef(null);
    React.useLayoutEffect(() => {
      const trigger = document.activeElement;
      const unlock = lockPage();
      const modal = ref.current;
      const close = () => modal.querySelector('button[aria-label="Close modal"]')?.click();
      const keydown = event => {
        if (event.key === 'Escape') { event.preventDefault(); close(); }
        if (event.key !== 'Tab') return;
        const nodes = [...modal.querySelectorAll('button:not([disabled]), a[href], iframe, [tabindex="0"]')];
        const first = nodes[0], last = nodes[nodes.length - 1];
        if (!first) { event.preventDefault(); return; }
        if (event.shiftKey && (document.activeElement === first || document.activeElement === modal)) {
          event.preventDefault(); last.focus({ preventScroll: true });
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault(); first.focus({ preventScroll: true });
        }
      };
      document.addEventListener('keydown', keydown);
      (modal.querySelector('button') || modal).focus({ preventScroll: true });
      return () => {
        document.removeEventListener('keydown', keydown);
        unlock();
        if (trigger?.isConnected) trigger.focus({ preventScroll: true });
      };
    }, []);
    return ReactDOM.createPortal(React.createElement('div', {
      ...props, ref, className: 'portfolio-modal', role: 'dialog',
      'aria-modal': 'true', 'aria-label': 'Project preview', tabIndex: -1
    }), document.body);
  };
}

// Stop GPU work when the stage is offscreen, a modal is open, or the tab is hidden.
export function useSplinePlayback(React, stage, runtime, loading, paused) {
  React.useEffect(() => {
    const node = stage.current, app = runtime.current;
    if (!node || !app || loading) return;
    let visible = false;
    const sync = () => {
      if (!visible || paused || document.hidden || document.getElementById('root')?.inert) app.stop?.();
      else app.play?.();
    };
    const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting; sync();
    }) : null;
    if (observer) observer.observe(node); else visible = true;
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('portfolio-modal-change', sync);
    sync();
    return () => {
      observer?.disconnect();
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('portfolio-modal-change', sync);
    };
  }, [loading, paused, stage, runtime]);
}

export function createClickVideo(React) {
  return function ClickVideo({ videoId, title }) {
    const [playing, setPlaying] = React.useState(false);
    if (playing) return React.createElement('iframe', {
      src: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0`,
      title, className: 'w-full h-full border-0', allowFullScreen: true,
      allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
    });
    return React.createElement('button', {
      type: 'button', className: 'video-load-poster', onClick: () => setPlaying(true),
      'aria-label': `Play ${title}`
    }, React.createElement('img', {
      src: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`, alt: '', loading: 'lazy', decoding: 'async'
    }), React.createElement('span', null, '▶ Play color grading comparison'));
  };
}
