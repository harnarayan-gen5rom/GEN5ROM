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
  document.body.style.overflow = 'hidden';
  modal.querySelector('button').focus();
}
function closeProject() {
  const wasOpen = !videoModal.hidden || !imageModal.hidden;
  videoModal.hidden = true;
  imageModal.hidden = true;
  videoFrame.removeAttribute('src');
  modalImage.removeAttribute('src');
  document.body.style.overflow = '';
  if (wasOpen) modalTrigger?.focus({ preventScroll: true });
}
cards.forEach(card => card.addEventListener('click', () => openProject(card)));
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
function showSceneProblem(message) {
  status.hidden = false;
  status.querySelector('span').textContent = message;
  reloadScene.hidden = false;
}
function observeViewer(viewer) {
  viewer.addEventListener('load-start', () => {
    sceneLoaded = false;
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
    // Turn off the camera turntable while retaining drag, hover and scene events.
    const runtime = viewer._spline;
    const orbit = runtime?.controls?.orbitControls;
    if (orbit) {
      orbit.autoRotate = false;
      orbit.stopDamping();
    }
    const cameraSettings = runtime?.data?.scene?.publish?.orbitControls;
    if (cameraSettings) cameraSettings.autoRotate = false;
    sceneLoaded = true;
    status.hidden = true;
    clearTimeout(sceneTimeout);
  });
  viewer.addEventListener('context-loss', () => showSceneProblem('The 3D viewer needs to reload. Please try again.'));
}
observeViewer(document.getElementById('splineViewer'));
async function supports3D() {
  const canvas = document.createElement('canvas');
  try { if (canvas.getContext('webgl2')) return true; } catch {}
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
  } catch {
    viewerImport = null;
    showSceneProblem('The 3D viewer could not load. Check your connection and try again.');
  }
}
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) { loadViewer(); observer.disconnect(); }
  }, { rootMargin: '400px' });
  observer.observe(stage);
} else { loadViewer(); }
reloadScene.addEventListener('click', async () => {
  status.querySelector('span').textContent = 'Loading the interactive scene…';
  reloadScene.hidden = true;
  sceneLoaded = false;
  const oldViewer = document.getElementById('splineViewer');
  const replacement = oldViewer.cloneNode(false);
  observeViewer(replacement);
  oldViewer.replaceWith(replacement);
  await loadViewer();
});
document.getElementById('expandScene').addEventListener('click', event => {
  const project = document.querySelector('.spline-project');
  const expanded = project.classList.toggle('expanded');
  event.currentTarget.setAttribute('aria-expanded', String(expanded));
  event.currentTarget.textContent = expanded ? 'Compact viewer ↙' : 'Expand viewer ↗';
  stage.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
});
