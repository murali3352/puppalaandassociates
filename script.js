/* ============================================
   PUPPALA AND ASSOCIATES — Main JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // ── Preloader ──────────────────────────────
  const preloader = document.getElementById('preloader');
  window.addEventListener('load', () => {
    setTimeout(() => {
      preloader.classList.add('loaded');
      // Remove from DOM after transition
      setTimeout(() => preloader.remove(), 600);
    }, 800);
  });

  // ── Header scroll effect ──────────────────
  const header = document.getElementById('header');
  const backToTop = document.getElementById('back-to-top');

  function onScroll() {
    const scrollY = window.scrollY;

    // Sticky header shadow
    if (scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    // Back to top visibility
    if (scrollY > 400) {
      backToTop.classList.add('visible');
    } else {
      backToTop.classList.remove('visible');
    }

    // Active nav link based on scroll position
    updateActiveNavLink();
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // Initial check

  // ── Back to Top ───────────────────────────
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ── Mobile Navigation ─────────────────────
  const mobileToggle = document.getElementById('mobile-toggle');
  const navLinks = document.getElementById('nav-links');
  const navCta = document.getElementById('nav-cta');

  mobileToggle.addEventListener('click', () => {
    mobileToggle.classList.toggle('active');
    navLinks.classList.toggle('open');
    navCta.classList.toggle('open');
    document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
  });

  // Close mobile nav when a link is clicked
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileToggle.classList.remove('active');
      navLinks.classList.remove('open');
      navCta.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // ── Active Nav Link ───────────────────────
  function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const scrollPos = window.scrollY + 120;

    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');
      const navLink = document.querySelector(`.nav-links a[href="#${id}"]`);

      if (navLink) {
        if (scrollPos >= top && scrollPos < top + height) {
          document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
          navLink.classList.add('active');
        }
      }
    });
  }

  // ── Smooth scroll for anchor links ────────
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // ── Scroll Reveal Animation ───────────────
  function revealOnScroll() {
    const reveals = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .stagger-children');
    const windowHeight = window.innerHeight;

    reveals.forEach(el => {
      const elementTop = el.getBoundingClientRect().top;
      const revealPoint = 100;

      if (elementTop < windowHeight - revealPoint) {
        el.classList.add('active');
      }
    });
  }

  window.addEventListener('scroll', revealOnScroll, { passive: true });
  // Trigger once on load
  setTimeout(revealOnScroll, 200);

  // ── Counter Animation ─────────────────────
  function animateCounters() {
    const counters = document.querySelectorAll('.counter');

    counters.forEach(counter => {
      if (counter.dataset.animated) return;

      const rect = counter.getBoundingClientRect();
      if (rect.top > window.innerHeight || rect.bottom < 0) return;

      counter.dataset.animated = 'true';
      const target = parseInt(counter.getAttribute('data-target'), 10);
      const duration = 2000;
      const startTime = performance.now();

      function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease-out quad
        const eased = 1 - (1 - progress) * (1 - progress);
        const current = Math.floor(eased * target);

        counter.textContent = current.toLocaleString();

        if (progress < 1) {
          requestAnimationFrame(updateCounter);
        } else {
          counter.textContent = target.toLocaleString();
        }
      }

      requestAnimationFrame(updateCounter);
    });
  }

  window.addEventListener('scroll', animateCounters, { passive: true });
  setTimeout(animateCounters, 500);

  // ── Hero Stats Counter (simplified) ───────
  function animateHeroStats() {
    const heroStats = document.querySelectorAll('.hero-stat-number');

    heroStats.forEach(stat => {
      if (stat.dataset.animated) return;
      stat.dataset.animated = 'true';

      const count = parseInt(stat.getAttribute('data-count'), 10);
      const suffix = stat.textContent.replace(/[0-9]/g, '');
      const duration = 1800;
      const startTime = performance.now();

      function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - (1 - progress) * (1 - progress);
        const current = Math.floor(eased * count);

        stat.textContent = current + suffix;

        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          stat.textContent = count + suffix;
        }
      }

      requestAnimationFrame(update);
    });
  }

  setTimeout(animateHeroStats, 1200);

  // ── Contact Form ──────────────────────────
  const contactForm = document.getElementById('contact-form');

  contactForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const submitBtn = document.getElementById('contact-submit-btn');
    const originalText = submitBtn.innerHTML;

    // Show loading state
    submitBtn.innerHTML = `
      <span style="display:inline-flex;align-items:center;gap:8px;">
        Sending to WhatsApp...
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 1s linear infinite">
          <circle cx="12" cy="12" r="10" stroke-dasharray="31.42" stroke-dashoffset="10"/>
        </svg>
      </span>`;
    submitBtn.disabled = true;

    // Get form values
    const name = document.getElementById('contact-name').value.trim();
    const phone = document.getElementById('contact-phone').value.trim();
    const email = document.getElementById('contact-email').value.trim();
    const service = document.getElementById('contact-service').value;
    const message = document.getElementById('contact-message').value.trim();

    // Build WhatsApp message
    const whatsappMessage = `🎯 *New Inquiry from Puppala & Associates Website*

👤 *Name:* ${name}
📱 *Phone:* ${phone}
✉️ *Email:* ${email}
🛠️ *Service Required:* ${service}
💬 *Message:* ${message}

---
Sent via Puppala & Associates website`;

    // WhatsApp URL
    const whatsappUrl = `https://wa.me/7075644785?text=${encodeURIComponent(whatsappMessage)}`;

    // Redirect to WhatsApp
    setTimeout(() => {
      window.location.href = whatsappUrl;

      // After a short delay, show success and reset form
      setTimeout(() => {
        submitBtn.innerHTML = `
          <span style="display:inline-flex;align-items:center;gap:8px;">
            ✓ WhatsApp Opened!
          </span>`;
        submitBtn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';

        // Reset form
        contactForm.reset();

        // Restore button after delay
        setTimeout(() => {
          submitBtn.innerHTML = originalText;
          submitBtn.style.background = '';
          submitBtn.disabled = false;
        }, 3000);
      }, 1000);
    }, 1500);
  });

  // ── Newsletter Form ───────────────────────
  const newsletterForm = document.getElementById('newsletter-form');

  newsletterForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const emailInput = document.getElementById('newsletter-email');
    const submitBtn = document.getElementById('newsletter-submit');

    submitBtn.textContent = 'Subscribed ✓';
    submitBtn.style.background = '#22c55e';
    emailInput.value = '';

    setTimeout(() => {
      submitBtn.textContent = 'Subscribe';
      submitBtn.style.background = '';
    }, 3000);
  });

  // ── Service card hover ripple effect ──────
  document.querySelectorAll('.service-card').forEach(card => {
    card.addEventListener('mouseenter', function (e) {
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      this.style.setProperty('--mouse-x', `${x}px`);
      this.style.setProperty('--mouse-y', `${y}px`);
    });
  });

  // ── Parallax effect on hero shapes ────────
  let rafId = null;
  window.addEventListener('mousemove', (e) => {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      const shapes = document.querySelectorAll('.hero-bg-shapes .shape');
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;

      shapes.forEach((shape, i) => {
        const speed = (i + 1) * 8;
        shape.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
      });
      rafId = null;
    });
  });

  // ── Typed effect on hero (subtle) ─────────
  // Just add a blinking cursor to the badge for visual flair
  const heroBadge = document.querySelector('.hero-badge');
  if (heroBadge) {
    const cursor = document.createElement('span');
    cursor.style.cssText = 'display:inline-block;width:2px;height:14px;background:var(--accent);margin-left:4px;animation:blink-cursor .8s infinite;vertical-align:middle;';
    const style = document.createElement('style');
    style.textContent = '@keyframes blink-cursor{0%,100%{opacity:1}50%{opacity:0}} @keyframes spin{to{transform:rotate(360deg)}}';
    document.head.appendChild(style);
    heroBadge.appendChild(cursor);

    // Remove cursor after 3 seconds
    setTimeout(() => cursor.remove(), 3000);
  }
});
