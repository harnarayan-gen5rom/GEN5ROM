/* ===== NAVBAR SCROLL EFFECT ===== */
const navbar = document.querySelector('.navbar');

if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  });
}

/* ===== MOBILE MENU TOGGLE ===== */
const hamburger = document.querySelector('#hamburger');
const mobileMenu = document.querySelector('#mobileMenu');

if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => {
    const isOpen = !hamburger.classList.contains('active');
    hamburger.classList.toggle('active', isOpen);
    mobileMenu.classList.toggle('active', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
  });

  /* Close menu on link click */
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      mobileMenu.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
    });
  });
}

/* ===== WORK FILTERS & SEARCH ===== */
const filters = document.querySelectorAll('.filter');
const workCards = document.querySelectorAll('.work-card');
const searchInput = document.querySelector('.search');

filters.forEach(button => {
  button.addEventListener('click', () => {
    filters.forEach(b => b.classList.remove('active'));
    button.classList.add('active');

    const filter = button.dataset.filter;
    workCards.forEach(card => {
      card.style.display = filter === 'all' || card.classList.contains(filter) ? 'block' : 'none';
    });
  });
});

if (searchInput) {
  searchInput.addEventListener('input', e => {
    const value = e.target.value.toLowerCase();
    workCards.forEach(card => {
      card.style.display = card.innerText.toLowerCase().includes(value) ? 'block' : 'none';
    });
  });
}

/* ===== SERVICE CARDS HOVER ===== */
const serviceCards = document.querySelectorAll('.service-card');

serviceCards.forEach(card => {
  card.addEventListener('mouseenter', () => {
    card.style.transform = 'scale(1.04)';
    card.style.boxShadow = '0 30px 60px rgba(192, 132, 252, 0.25)';
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = 'scale(1)';
    card.style.boxShadow = 'none';
  });
});

/* ===== VIDEO MODAL ===== */
function openModal(videoId) {
  const modal = document.getElementById('videoModal');
  const iframe = document.getElementById('videoFrame');

  if (!modal || !iframe) return;

  iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const modal = document.getElementById('videoModal');
  const iframe = document.getElementById('videoFrame');

  if (!modal || !iframe) return;

  iframe.src = '';
  modal.classList.remove('active');
  document.body.style.overflow = 'auto';
}

/* Close modal on outside click */
document.addEventListener('click', e => {
  const modal = document.getElementById('videoModal');
  const content = document.querySelector('.modal-content');
  const imageModal = document.getElementById('imageModal');

  if (imageModal && imageModal.contains(e.target)) return;
  
  if (modal && modal.classList.contains('active') && !content.contains(e.target) && !e.target.closest('.work-card')) {
    closeModal();
  }
});

/* Close modal with Escape key */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeModal();
    if (typeof closeImageModal === 'function') closeImageModal();
  }
});

/* ===== IMAGE LIGHTBOX MODAL ===== */
const imageModal = document.getElementById('imageModal');
const modalImage = document.getElementById('modalImage');
const imageCaption = document.getElementById('imageCaption');
const closeImage = document.getElementById('closeImage');

function openImageModal(src, caption) {
  if (!imageModal || !modalImage) return;
  
  modalImage.src = src;
  imageCaption.textContent = caption || '';
  imageModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeImageModal() {
  if (!imageModal || !modalImage) return;
  
  imageModal.classList.remove('active');
  modalImage.src = '';
  document.body.style.overflow = 'auto';
}

/* Image click handlers */
document.querySelectorAll('.work-card img').forEach(img => {
  img.style.cursor = 'pointer';
  img.addEventListener('click', e => {
    const card = img.closest('.work-card');
    const isVideoCard = card && (card.dataset.video || card.classList.contains('video'));

    if (isVideoCard) return;

    e.stopPropagation();
    e.preventDefault();

    const caption = card ? (card.dataset.title || card.querySelector('h3')?.innerText || '') : '';
    openImageModal(img.src, caption);
  });
});

if (closeImage) {
  closeImage.addEventListener('click', closeImageModal);
}

if (imageModal) {
  imageModal.addEventListener('click', e => {
    if (e.target === imageModal) closeImageModal();
  });
}

/* ===== SMOOTH SCROLL FOR NAVIGATION ===== */
const navLinks = document.querySelectorAll('nav a[href^="#"]');
navLinks.forEach(link => {
  link.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }

    /* Close mobile menu after clicking */
    if (hamburger && mobileMenu && hamburger.classList.contains('active')) {
      hamburger.classList.remove('active');
      mobileMenu.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
    }
  });
});

/* ===== SCROLL REVEAL ANIMATION ===== */
document.addEventListener('DOMContentLoaded', () => {
  const elements = document.querySelectorAll('.reveal, .service-card, .work-card, .stat-card, .info-card');

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  elements.forEach(el => observer.observe(el));
});