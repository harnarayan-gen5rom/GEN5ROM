const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
hamburger.addEventListener('click', () => {
  const open = hamburger.getAttribute('aria-expanded') !== 'true';
  hamburger.setAttribute('aria-expanded', String(open));
  mobileMenu.hidden = !open;
});
mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  mobileMenu.hidden = true;
  hamburger.setAttribute('aria-expanded', 'false');
}));

// Category and query are applied together, including after revealing more work.
const filters = [...document.querySelectorAll('.filter')];
const cards = [...document.querySelectorAll('.work-card')];
const search = document.querySelector('.search');
const showMore = document.getElementById('showMore');
let category = 'all';
let visibleLimit = 9;
function updateGallery() {
  const query = search.value.trim().toLocaleLowerCase();
  const matches = cards.filter(card => (category === 'all' || card.dataset.category === category) &&
    card.dataset.title.toLocaleLowerCase().includes(query));
  const visible = new Set(matches.slice(0, visibleLimit));
  cards.forEach(card => { card.hidden = !visible.has(card); });
  document.getElementById('projectCount').textContent = matches.length ?
    `Showing ${Math.min(visibleLimit, matches.length)} of ${matches.length} projects` : '0 projects found';
  document.getElementById('emptyState').hidden = matches.length > 0;
  showMore.hidden = matches.length <= visibleLimit;
  showMore.textContent = `Show more projects (${matches.length - visibleLimit}) ↓`;
}
filters.forEach(button => button.addEventListener('click', () => {
  category = button.dataset.filter;
  visibleLimit = 9;
  filters.forEach(filter => {
    const selected = filter === button;
    filter.classList.toggle('active', selected);
    filter.setAttribute('aria-pressed', String(selected));
  });
  updateGallery();
}));
search.addEventListener('input', () => { visibleLimit = 9; updateGallery(); });
showMore.addEventListener('click', () => { visibleLimit += 9; updateGallery(); });
updateGallery();

const videoModal = document.getElementById('videoModal');
const imageModal = document.getElementById('imageModal');
const videoFrame = document.getElementById('videoFrame');
const modalImage = document.getElementById('modalImage');
let modalTrigger;
function openProject(card) {
  modalTrigger = card;
  const video = card.dataset.video;
  const modal = video ? videoModal : imageModal;
  if (video) {
    document.getElementById('videoTitle').textContent = card.dataset.title;
    videoFrame.src = `https://www.youtube.com/embed/${video}?autoplay=1&rel=0`;
  } else {
    document.getElementById('imageCaption').textContent = card.dataset.title;
    modalImage.src = card.querySelector('img').src;
    modalImage.alt = card.dataset.title;
  }
  modal.hidden = false;
  syncScenePlayback();
  document.body.style.overflow = 'hidden';
  modal.querySelector('button').focus();
}
function closeProject() {
  const wasOpen = !videoModal.hidden || !imageModal.hidden;
  videoModal.hidden = true;
  imageModal.hidden = true;
  videoFrame.removeAttribute('src');
  modalImage.removeAttribute('src');
  syncScenePlayback();
  document.body.style.overflow = '';
  if (wasOpen) modalTrigger?.focus({ preventScroll: true });
}
cards.forEach(card => card.addEventListener('click', () => openProject(card)));
document.querySelectorAll('.project-trigger').forEach(card => card.addEventListener('click', () => openProject(card)));
document.querySelectorAll('.modal-bar button').forEach(button => button.addEventListener('click', closeProject));
[videoModal, imageModal].forEach(modal => modal.addEventListener('click', event => {
  if (event.target === modal) closeProject();
}));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    closeProject();
    mobileMenu.hidden = true;
    hamburger.setAttribute('aria-expanded', 'false');
  }
  // Keep keyboard focus inside the open dialog.
  if (event.key === 'Tab' && (!videoModal.hidden || !imageModal.hidden)) {
    const modal = videoModal.hidden ? imageModal : videoModal;
    const targets = [...modal.querySelectorAll('button, iframe')];
    const first = targets[0], last = targets[targets.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});

// Load the 3D component close to its section, keeping the initial page lightweight.
const stage = document.getElementById('splineStage');
const status = document.getElementById('splineStatus');
const reloadScene = document.getElementById('reloadScene');
let sceneLoaded = false;
let viewerImport;
let sceneTimeout;
let sceneInView = false;
let manuallyPaused = false;
let qualityMode = 'auto';
const sceneToggle = document.getElementById('toggleScene');
const qualityButtons = [...document.querySelectorAll('[data-quality]')];
function scenePixelRatio(mode, width, height, dpr, compact) {
  // Cap actual drawing pixels, especially on 3x mobile screens and expanded views.
  const cap = mode === 'smooth' ? 1 : mode === 'crisp' ? 2 : compact ? 1.25 : 1.5;
  const budget = mode === 'crisp' ? 3200000 : mode === 'smooth' ? 900000 : 1800000;
  const density = mode === 'crisp' ? 2 : dpr || 1;
  return Math.max(.75, Math.min(density, cap, Math.sqrt(budget / Math.max(1, width * height))));
}
function applySceneQuality() {
  const runtime = document.getElementById('splineViewer')?._spline;
  const renderer = runtime?._renderer;
  if (!sceneLoaded || typeof renderer?.setPixelRatio !== 'function') return;
  const ratio = scenePixelRatio(qualityMode, stage.clientWidth, stage.clientHeight,
    window.devicePixelRatio, window.matchMedia('(max-width: 760px)').matches);
  renderer.setPixelRatio(ratio);
  runtime.requestRender?.();
}
function syncScenePlayback() {
  const runtime = document.getElementById('splineViewer')?._spline;
  if (!sceneLoaded || !runtime) return;
  const paused = manuallyPaused || !sceneInView || document.hidden || !videoModal.hidden || !imageModal.hidden;
  if (paused) runtime.stop?.();
  else { runtime.play?.(); runtime.requestRender?.(); }
  sceneToggle.setAttribute('aria-pressed', String(manuallyPaused));
  sceneToggle.textContent = manuallyPaused ? 'Resume' : 'Pause';
}
qualityButtons.forEach(button => button.addEventListener('click', () => {
  qualityMode = button.dataset.quality;
  qualityButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  applySceneQuality();
}));
sceneToggle.addEventListener('click', () => { manuallyPaused = !manuallyPaused; syncScenePlayback(); });
document.addEventListener('visibilitychange', syncScenePlayback);
if ('ResizeObserver' in window) new ResizeObserver(applySceneQuality).observe(stage);
function showSceneProblem(message) {
  status.hidden = false;
  status.querySelector('span').textContent = message;
  reloadScene.hidden = false;
}
// Disable model Look At events before Spline constructs its event managers.
function disableSceneRotation(data) {
  const scene = data?.scene;
  if (!scene) return;
  // Start at 1x to avoid a large GPU allocation before the capped mode is applied.
  if (scene.publish?.settings?.web) {
    scene.publish.settings.web.pixelRatioMobile = 1;
    scene.publish.settings.web.pixelRatioDesktop = 1;
  }
  if (scene.publish?.orbitControls) {
    scene.publish.orbitControls.autoRotate = false;
    scene.publish.orbitControls.hoverRotatePanMode = 0;
    scene.publish.orbitControls.enableRotate = true;
  }
  scene.objects?.traverse?.((_id, object) => {
    const events = object.events;
    if (!events) return;
    const values = Array.isArray(events) ? events : Object.values(events);
    values.forEach(event => {
      const settings = event.data || event;
      if (settings.type === 'LookAt') settings.disabled = true;
    });
  });
}
const preparedRuntimes = new WeakSet();
function prepareSplineRuntime(runtime) {
  if (!runtime || preparedRuntimes.has(runtime)) return;
  // Viewer 2.0.75 assigns _data before creating controls, entities and events.
  const descriptor = Object.getOwnPropertyDescriptor(runtime, '_data');
  if (descriptor && !descriptor.configurable) return;
  let data = runtime._data;
  runtime.renderMode = 'auto';
  disableSceneRotation(data);
  Object.defineProperty(runtime, '_data', {
    configurable: true,
    enumerable: descriptor?.enumerable ?? true,
    get() { return data; },
    set(value) { disableSceneRotation(value); data = value; }
  });
  preparedRuntimes.add(runtime);
}
function prepareSplineViewer(viewer) {
  if (!viewer || viewer.dataset.runtimePrepared) return;
  viewer.dataset.runtimePrepared = 'true';
  // Wrap application creation, and handle an application already loading.
  const createApplication = viewer._createApplication;
  if (typeof createApplication === 'function') {
    viewer._createApplication = function (...args) {
      const runtime = createApplication.apply(this, args);
      prepareSplineRuntime(runtime);
      return runtime;
    };
  }
  prepareSplineRuntime(viewer._spline);
}

function observeViewer(viewer) {
  viewer.addEventListener('load-start', () => {
    queueMicrotask(() => prepareSplineViewer(viewer));
    sceneLoaded = false;
    sceneToggle.disabled = true;
    status.hidden = false;
    status.querySelector('span').textContent = 'Loading the interactive scene…';
    reloadScene.hidden = true;
    clearTimeout(sceneTimeout);
    sceneTimeout = setTimeout(() => {
      if (!sceneLoaded) showSceneProblem('The 3D scene is taking longer to load. You can try again.');
    }, 45000);
  });
  viewer.addEventListener('load-complete', () => {
    // Pinned Spline Viewer 2.0.75 exposes its Application here.
    // Keep the camera still until dragged; preserve clicks and scene events.
    const runtime = viewer._spline;
    const orbit = runtime?.controls?.orbitControls;
    if (orbit) {
      orbit.autoRotate = false;
      orbit.hoverRotatePanMode = 0;
      orbit.enableRotate = true;
      orbit.stopDamping?.();
    }
    const cameraSettings = runtime?.data?.scene?.publish?.orbitControls;
    if (cameraSettings) {
      cameraSettings.autoRotate = false;
      cameraSettings.hoverRotatePanMode = 0;
      cameraSettings.enableRotate = true;
    }
    sceneLoaded = true;
    sceneToggle.disabled = false;
    applySceneQuality();
    syncScenePlayback();
    status.hidden = true;
    clearTimeout(sceneTimeout);
  });
  viewer.addEventListener('context-loss', () => showSceneProblem('The 3D viewer needs to reload. Please try again.'));
}
observeViewer(document.getElementById('splineViewer'));
async function supports3D() {
  const canvas = document.createElement('canvas');
  try {
    const context = canvas.getContext('webgl2');
    if (context) { context.getExtension('WEBGL_lose_context')?.loseContext(); return true; }
  } catch {}
  try { if (navigator.gpu && await navigator.gpu.requestAdapter()) return true; } catch {}
  return false;
}
async function loadViewer() {
  try {
    if (!await supports3D()) {
      clearTimeout(sceneTimeout);
      stage.classList.add('graphics-unavailable');
      stage.querySelector('.stage-label').textContent = 'INTERACTIVE 3D PROJECT';
      showSceneProblem('Explore this project in a browser with graphics acceleration enabled.');
      return;
    }
    stage.classList.remove('graphics-unavailable');
    viewerImport ??= import('https://cdn.spline.design/@splinetool/viewer@2.0.75/build/spline-viewer.js');
    await viewerImport;
    await customElements.whenDefined('spline-viewer');
    prepareSplineViewer(document.getElementById('splineViewer'));
  } catch {
    viewerImport = null;
    showSceneProblem('The 3D viewer could not load. Check your connection and try again.');
  }
}
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    sceneInView = entries.some(entry => entry.isIntersecting);
    if (sceneInView && !viewerImport && !stage.classList.contains('graphics-unavailable')) loadViewer();
    syncScenePlayback();
  }, { threshold: .01 });
  observer.observe(stage);
} else { sceneInView = true; loadViewer(); }
reloadScene.addEventListener('click', async () => {
  status.querySelector('span').textContent = 'Loading the interactive scene…';
  reloadScene.hidden = true;
  sceneLoaded = false;
  sceneToggle.disabled = true;
  const oldViewer = document.getElementById('splineViewer');
  const replacement = oldViewer.cloneNode(false);
  delete replacement.dataset.runtimePrepared;
  observeViewer(replacement);
  oldViewer.replaceWith(replacement);
  await loadViewer();
});

// One-shot entrances: no continuous pointer or scroll animation loop.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const reveals = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('revealed'); reveals.unobserve(entry.target); }
  }), { threshold: .08 });
  document.querySelectorAll('.section-heading, .featured-card, .service-card, .process-grid li, .about-portrait, .about-copy').forEach(element => {
    element.classList.add('reveal'); reveals.observe(element);
  });
}
if ('IntersectionObserver' in window) {
  const activeSections = new Map();
  const navigation = new IntersectionObserver(entries => {
    entries.forEach(entry => activeSections.set(entry.target.id, entry.isIntersecting));
    const active = [...activeSections].find(([, visible]) => visible)?.[0];
    document.querySelectorAll('.desktop-nav a').forEach(link => {
      if (link.getAttribute('href') === `#${active}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }, { rootMargin: '-15% 0px -55% 0px' });
  document.querySelectorAll('#work, #interactive, #services, #about').forEach(section => navigation.observe(section));
}
document.getElementById('expandScene').addEventListener('click', event => {
  const project = document.querySelector('.spline-project');
  const expanded = project.classList.toggle('expanded');
  event.currentTarget.setAttribute('aria-expanded', String(expanded));
  event.currentTarget.textContent = expanded ? 'Compact viewer ↙' : 'Expand viewer ↗';
  stage.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
});
