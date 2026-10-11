// Mobile navigation
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => {
    const open = hamburger.getAttribute('aria-expanded') !== 'true';
    hamburger.setAttribute('aria-expanded', String(open));
    mobileMenu.hidden = !open;
  });
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.hidden = true;
      hamburger.setAttribute('aria-expanded', 'false');
    });
  });
}

// Gallery Filtering & Search
const filterButtons = document.querySelectorAll('.filter-btn');
const workCards = [...document.querySelectorAll('.work-card')];
const searchInput = document.getElementById('projectSearch');
let activeCategory = 'all';

function filterGallery() {
  const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
  workCards.forEach(card => {
    const cardCat = card.dataset.category || '';
    const cardTitle = (card.dataset.title || card.textContent || '').toLowerCase();
    const matchesCat = activeCategory === 'all' || cardCat === activeCategory;
    const matchesQuery = !query || cardTitle.includes(query);
    card.hidden = !(matchesCat && matchesQuery);
  });
}

filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    activeCategory = btn.dataset.filter || 'all';
    filterButtons.forEach(b => b.classList.toggle('active', b === btn));
    filterGallery();
  });
});

if (searchInput) {
  searchInput.addEventListener('input', filterGallery);
}

// Video & Image Modals
const videoModal = document.getElementById('videoModal');
const videoFrame = document.getElementById('videoFrame');
const videoTitle = document.getElementById('videoTitle');
const imageModal = document.getElementById('imageModal');
const modalImage = document.getElementById('modalImage');
const imageCaption = document.getElementById('imageCaption');

function openVideo(videoId, title) {
  if (!videoModal || !videoFrame) return;
  videoTitle.textContent = title || 'Video Project';
  videoFrame.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
  videoModal.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeVideoModal() {
  if (!videoModal || !videoFrame) return;
  videoModal.hidden = true;
  videoFrame.src = '';
  document.body.style.overflow = '';
}

function openImage(src, alt) {
  if (!imageModal || !modalImage) return;
  imageCaption.textContent = alt || 'Artwork';
  modalImage.src = src;
  imageModal.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeImageModal() {
  if (!imageModal || !modalImage) return;
  imageModal.hidden = true;
  modalImage.src = '';
  document.body.style.overflow = '';
}

document.querySelectorAll('.project-trigger, .work-card').forEach(card => {
  card.addEventListener('click', () => {
    const videoId = card.dataset.video;
    const title = card.dataset.title;
    if (videoId) {
      openVideo(videoId, title);
    } else {
      const img = card.querySelector('img');
      if (img) openImage(img.src, title || img.alt);
    }
  });
});

document.querySelector('.close-video')?.addEventListener('click', closeVideoModal);
document.querySelector('.close-image')?.addEventListener('click', closeImageModal);

[videoModal, imageModal].forEach(modal => {
  modal?.addEventListener('click', e => {
    if (e.target === modal) {
      closeVideoModal();
      closeImageModal();
    }
  });
});

window.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeVideoModal();
    closeImageModal();
  }
});

// Interactive Before / After Color Grading Slider
(function initSlider() {
  const container = document.getElementById('comparisonContainer');
  const beforeLayer = document.getElementById('comparisonBefore');
  const handle = document.getElementById('comparisonHandle');
  const presets = document.querySelectorAll('.preset-btn');
  if (!container || !beforeLayer || !handle) return;

  let isDragging = false;

  function updateSliderPosition(percent) {
    const clamped = Math.max(0, Math.min(100, percent));
    beforeLayer.style.clipPath = `inset(0 calc(100% - ${clamped}%) 0 0)`;
    handle.style.left = `${clamped}%`;
    handle.setAttribute('aria-valuenow', Math.round(clamped));

    presets.forEach(btn => {
      const presetVal = parseFloat(btn.dataset.preset);
      btn.classList.toggle('active', Math.abs(presetVal - clamped) < 8);
    });
  }

  function handlePointer(event) {
    const rect = container.getBoundingClientRect();
    const clientX = event.clientX !== undefined ? event.clientX : (event.touches && event.touches[0]?.clientX);
    if (clientX === undefined) return;
    const x = clientX - rect.left;
    const percent = (x / rect.width) * 100;
    updateSliderPosition(percent);
  }

  function startDrag(event) {
    isDragging = true;
    container.classList.add('active');
    handlePointer(event);
  }

  function stopDrag() {
    if (!isDragging) return;
    isDragging = false;
    container.classList.remove('active');
  }

  container.addEventListener('mousedown', startDrag);
  window.addEventListener('mousemove', e => { if (isDragging) handlePointer(e); });
  window.addEventListener('mouseup', stopDrag);

  container.addEventListener('touchstart', startDrag, { passive: true });
  window.addEventListener('touchmove', e => { if (isDragging) handlePointer(e); }, { passive: true });
  window.addEventListener('touchend', stopDrag);

  presets.forEach(btn => {
    btn.addEventListener('click', () => {
      const val = parseFloat(btn.dataset.preset);
      updateSliderPosition(val);
    });
  });

  handle.addEventListener('keydown', e => {
    const current = parseFloat(handle.getAttribute('aria-valuenow') || '50');
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      updateSliderPosition(current - 5);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      updateSliderPosition(current + 5);
    }
  });

  updateSliderPosition(50);
})();

// Spline 3D Viewer lazy loader & quality controls
(function initSplineViewer() {
  const viewer = document.getElementById('splineViewer');
  const stage = document.getElementById('splineStage');
  if (!viewer || !stage) return;

  let viewerImport;
  async function loadViewer() {
    try {
      viewerImport ??= import('https://cdn.spline.design/@splinetool/viewer@2.0.75/build/spline-viewer.js');
      await viewerImport;
      await customElements.whenDefined('spline-viewer');
    } catch (e) {
      console.warn('Spline viewer failed to load', e);
    }
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) {
        loadViewer();
        observer.disconnect();
      }
    }, { rootMargin: '200px' });
    observer.observe(stage);
  } else {
    loadViewer();
  }

  // Quality controls
  document.querySelectorAll('.quality-group button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.quality-group button').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
      const runtime = viewer._spline;
      const renderer = runtime?._renderer;
      if (typeof renderer?.setPixelRatio === 'function') {
        const mode = btn.dataset.quality;
        const dpr = window.devicePixelRatio || 1;
        const ratio = mode === 'crisp' ? Math.min(2, dpr) : mode === 'smooth' ? 0.85 : 1.2;
        renderer.setPixelRatio(ratio);
        runtime.requestRender?.();
      }
    });
  });
})();

// Scroll Spy for navigation links
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
  document.querySelectorAll('#work, #comparison, #interactive, #experience, #skills, #services, #about').forEach(s => navigation.observe(s));
}
