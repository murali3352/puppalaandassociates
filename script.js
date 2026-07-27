/* ============================================
   PUPPALA AND ASSOCIATES — Main JavaScript
   ============================================
   Contents
     1.  Helpers & environment flags
     2.  Preloader (with hard fallback so it can never hang)
     3.  Header scroll state + back to top
     4.  Mobile navigation (single panel, keyboard accessible)
     5.  Scroll reveal + animated counters (IntersectionObserver)
     6.  3D tilt / glare / scene parallax
     7.  "Learn more" content + modal dialog
     8.  Contact form → WhatsApp handoff
     9.  Newsletter form
     10. Misc (footer year, deep links)
   ============================================ */

(function () {
  'use strict';

  /* ── 1. Helpers & environment flags ───────── */
  const qs = (sel, ctx = document) => ctx.querySelector(sel);
  const qsa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarsePointer = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  const WHATSAPP_NUMBER = '917075644785';

  const smoothScrollTo = (top) => {
    window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  /* ── 2. Preloader ─────────────────────────── */
  (function preloader() {
    const el = qs('#preloader');
    if (!el) return;

    let done = false;
    const hide = () => {
      if (done) return;
      done = true;
      el.classList.add('loaded');
      setTimeout(() => el.remove(), 700);
    };

    // `load` waits for the map iframe and web fonts, which can stall on a slow
    // connection — so hide on load *and* on a hard timeout, whichever is first.
    if (document.readyState === 'complete') {
      setTimeout(hide, 400);
    } else {
      window.addEventListener('load', () => setTimeout(hide, 400), { once: true });
    }
    setTimeout(hide, 3500);
  })();

  /* ── 3. Header scroll state + back to top ── */
  (function scrollUi() {
    const header = qs('#header');
    const backToTop = qs('#back-to-top');
    let ticking = false;

    const update = () => {
      const y = window.scrollY;
      if (header) header.classList.toggle('scrolled', y > 50);
      if (backToTop) backToTop.classList.toggle('visible', y > 400);
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }, { passive: true });

    update();

    if (backToTop) {
      backToTop.addEventListener('click', () => smoothScrollTo(0));
    }
  })();

  /* ── 4. Mobile navigation ─────────────────── */
  (function mobileNav() {
    const toggle = qs('#mobile-toggle');
    const panel = qs('#nav-panel');
    if (!toggle || !panel) return;

    const setOpen = (open) => {
      toggle.classList.toggle('active', open);
      panel.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
      document.body.style.overflow = open ? 'hidden' : '';
    };

    toggle.addEventListener('click', () => {
      setOpen(!panel.classList.contains('open'));
    });

    // Any link inside the panel closes it
    qsa('a', panel).forEach((link) => link.addEventListener('click', () => setOpen(false)));

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && panel.classList.contains('open')) {
        setOpen(false);
        toggle.focus();
      }
    });

    // Resizing to desktop must never leave the body scroll-locked
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768 && panel.classList.contains('open')) setOpen(false);
    });
  })();

  /* ── 5. Scroll reveal + counters ──────────── */
  (function revealAndCount() {
    const revealTargets = qsa('.reveal, .reveal-left, .reveal-right, .stagger-children');

    if (!('IntersectionObserver' in window)) {
      revealTargets.forEach((el) => el.classList.add('active'));
      qsa('.counter').forEach((el) => { el.textContent = formatCount(el); });
      return;
    }

    // Nothing is unobserved: the animation plays again every time a section
    // enters the viewport, scrolling down *or* back up.
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle('active', entry.isIntersecting);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    revealTargets.forEach((el) => revealObserver.observe(el));

    // Counters — recount on every re-entry, in either scroll direction
    const countObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) animateCounter(entry.target);
        else cancelCounter(entry.target);
      });
    }, { threshold: 0.4 });

    qsa('.counter').forEach((el) => countObserver.observe(el));

    function formatCount(el) {
      const target = parseInt(el.dataset.target, 10) || 0;
      return target.toLocaleString('en-IN') + (el.dataset.suffix || '');
    }

    const running = new WeakMap();

    function cancelCounter(el) {
      const id = running.get(el);
      if (id) { cancelAnimationFrame(id); running.delete(el); }
    }

    function animateCounter(el) {
      const target = parseInt(el.dataset.target, 10);
      if (!Number.isFinite(target)) return;
      const suffix = el.dataset.suffix || '';

      if (reduceMotion) {
        el.textContent = target.toLocaleString('en-IN') + suffix;
        return;
      }

      cancelCounter(el); // restart cleanly if it re-enters mid-count
      const duration = 1800;
      const start = performance.now();
      el.textContent = '0' + suffix;

      const step = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(eased * target).toLocaleString('en-IN') + suffix;
        if (progress < 1) running.set(el, requestAnimationFrame(step));
        else { running.delete(el); el.textContent = target.toLocaleString('en-IN') + suffix; }
      };

      running.set(el, requestAnimationFrame(step));
    }
  })();

  /* ── 6. 3D tilt / glare / scene parallax ─── */
  (function threeD() {
    if (reduceMotion || coarsePointer) return;

    const MAX_TILT = 9;

    qsa('.tilt-3d').forEach((card) => {
      let frame = null;

      const onMove = (e) => {
        if (frame) return;
        frame = requestAnimationFrame(() => {
          frame = null;
          const rect = card.getBoundingClientRect();
          const px = (e.clientX - rect.left) / rect.width;
          const py = (e.clientY - rect.top) / rect.height;
          card.style.setProperty('--tilt-y', ((px - 0.5) * 2 * MAX_TILT).toFixed(2) + 'deg');
          card.style.setProperty('--tilt-x', ((0.5 - py) * 2 * MAX_TILT).toFixed(2) + 'deg');
          card.style.setProperty('--mouse-x', (px * 100).toFixed(1) + '%');
          card.style.setProperty('--mouse-y', (py * 100).toFixed(1) + '%');
        });
      };

      const reset = () => {
        if (frame) cancelAnimationFrame(frame);
        frame = null;
        card.style.setProperty('--tilt-x', '0deg');
        card.style.setProperty('--tilt-y', '0deg');
      };

      card.addEventListener('pointermove', onMove);
      card.addEventListener('pointerleave', reset);
      card.addEventListener('blur', reset, true);
    });

    // Hero: rotate the whole card stack + drift the background shapes
    const stack = qs('.hero-stack');
    const shapes = qsa('.hero-bg-shapes .shape');
    let heroFrame = null;

    window.addEventListener('pointermove', (e) => {
      if (heroFrame) return;
      heroFrame = requestAnimationFrame(() => {
        heroFrame = null;
        const nx = (e.clientX / window.innerWidth - 0.5) * 2;
        const ny = (e.clientY / window.innerHeight - 0.5) * 2;

        if (stack) {
          stack.style.setProperty('--scene-y', (nx * 8).toFixed(2) + 'deg');
          stack.style.setProperty('--scene-x', (-ny * 6).toFixed(2) + 'deg');
        }
        shapes.forEach((shape, i) => {
          const speed = (i + 1) * 8;
          shape.style.translate = `${(nx * speed).toFixed(1)}px ${(ny * speed).toFixed(1)}px`;
        });
      });
    }, { passive: true });

    // About illustration reacts to the pointer instead of sitting at a fixed angle
    const aboutWrap = qs('#about-scene');
    const aboutImg = qs('.about-image', aboutWrap || document);
    if (aboutWrap && aboutImg) {
      let aFrame = null;
      aboutWrap.addEventListener('pointermove', (e) => {
        if (aFrame) return;
        aFrame = requestAnimationFrame(() => {
          aFrame = null;
          const rect = aboutWrap.getBoundingClientRect();
          const px = (e.clientX - rect.left) / rect.width;
          const py = (e.clientY - rect.top) / rect.height;
          aboutImg.style.setProperty('--about-y', ((px - 0.5) * 14 - 3).toFixed(2) + 'deg');
          aboutImg.style.setProperty('--about-x', ((0.5 - py) * 10 + 1).toFixed(2) + 'deg');
        });
      });
      aboutWrap.addEventListener('pointerleave', () => {
        aboutImg.style.setProperty('--about-y', '-6deg');
        aboutImg.style.setProperty('--about-x', '3deg');
      });
    }
  })();

  /* ── 7. "Learn more" content + modal ──────── */

  // Service option values must match the <select> in the contact form.
  const SERVICE_OPTION = {
    'income-tax': 'Income Tax Advisory',
    'gst': 'GST Services',
    'audit': 'Auditing & Assurance',
    'registration': 'Company Registration',
    'bookkeeping': 'Accounting & Bookkeeping',
    'tds': 'TDS/TCS Returns',
    'project-finance': 'Project Finance',
    'compliance': 'Regulatory Compliance',
    'financial-advisory': 'Financial Advisory'
  };

  const DETAILS = {
    /* ── Why choose us ── */
    'why-experts': {
      icon: '🎓',
      eyebrow: 'Why choose us',
      title: 'Qualified Experts',
      tagline: 'Your file is handled by qualified people, not passed down to whoever is free.',
      lead: 'A Chartered Accountant signs off on everything that leaves this office. Tax, GST, audit and company law each move at their own pace under changing law, so work is allocated by domain rather than by who happens to be available — and the person who understands your case is the person who does the work.',
      meta: [
        { label: 'Sign-off', value: 'Every return and report reviewed by a CA' },
        { label: 'Domains', value: 'Direct tax · GST · Audit · Company law' },
        { label: 'Your contact', value: 'One named person owns your file' }
      ],
      sections: [
        {
          title: 'What this means for you',
          list: [
            'Qualified Chartered Accountants, not unsupervised junior staff',
            'Work allocated by specialisation instead of by availability',
            'Continuing professional education kept current with amendments',
            'Positions taken are backed by section references you can check',
            'Second-opinion review on complex or high-value matters',
            'Representation experience in assessments, appeals and departmental audits'
          ]
        },
        { title: 'Areas we cover in depth', chips: ['Income tax', 'GST', 'Statutory & tax audit', 'Company law / ROC', 'TDS', 'Project finance', 'Valuations'] }
      ]
    },

    'why-client-first': {
      icon: '🤝',
      eyebrow: 'Why choose us',
      title: 'Client-Centric Approach',
      tagline: 'Advice built around your actual business, not a template applied to everyone.',
      lead: 'A rice mill, an aqua exporter and a salaried professional have almost nothing in common in how they should be structured or taxed. We start by understanding how money actually moves through your business, then design the compliance and advisory work around that — which often means telling you a service you asked for is not the one you need.',
      meta: [
        { label: 'First step', value: 'Free discovery conversation' },
        { label: 'Engagement', value: 'Scope written in plain language' },
        { label: 'Reviews', value: 'Periodic check-ins, not once a year' }
      ],
      sections: [
        {
          title: 'How we work',
          list: [
            'We map your business before recommending anything',
            'Structure advice based on your numbers, not on a standard checklist',
            'Explanations in plain Telugu or English — no jargon walls',
            'We will tell you when a service is unnecessary for you',
            'Flexible engagement — one-off, seasonal or full-year retainer',
            'Your preferences on communication and reporting are respected'
          ]
        },
        { title: 'Who we work with', chips: ['Salaried individuals', 'Traders & shops', 'Aqua & agri', 'Rice mills', 'Firms & LLPs', 'Companies', 'Trusts & NGOs', 'NRIs'] }
      ]
    },

    'why-timely': {
      icon: '⏰',
      eyebrow: 'Why choose us',
      title: 'Timely Delivery',
      tagline: 'Deadlines tracked for you — and worked to a buffer, not to the last hour.',
      lead: 'Late compliance is the most avoidable expense a business carries: ₹200 a day for a late TDS return, ₹100 per day per form for late ROC filings, interest under 234A/234B, and blocked input credit. We maintain a due-date calendar for every client and work to internal deadlines set ahead of the statutory ones.',
      meta: [
        { label: 'Internal target', value: 'Filed ahead of the statutory due date' },
        { label: 'Reminders', value: 'Sent well before, not on the deadline' },
        { label: 'Track record', value: 'Every deadline met to date' }
      ],
      sections: [
        {
          title: 'How we stay ahead of dates',
          list: [
            'A per-client compliance calendar covering every applicable filing',
            'Document requests sent early, with a clear checklist',
            'Internal cut-offs set before the statutory date to absorb surprises',
            'Escalation call if information we need has not arrived',
            'Portal downtime and last-day rush planned around, not discovered',
            'Acknowledgements shared with you as proof of every filing'
          ]
        },
        {
          title: 'Dates we track for clients',
          list: [
            'GSTR-1 by the 11th · GSTR-3B by the 20th, every month',
            'TDS deposit by the 7th; quarterly returns 31 Jul / Oct / Jan / May',
            'Advance tax 15 Jun · 15 Sep · 15 Dec · 15 Mar',
            'ITR 31 July (non-audit) · 31 October (audit cases)',
            'Tax audit report by 30 September',
            'ROC AOC-4 and MGT-7 after the AGM · DIR-3 KYC by 30 September'
          ]
        }
      ]
    },

    'why-confidential': {
      icon: '🔒',
      eyebrow: 'Why choose us',
      title: 'Confidentiality',
      tagline: 'Your numbers stay between you and your CA — as a professional obligation, not a promise.',
      lead: 'Client confidentiality is binding on us under the Chartered Accountants Act and the ICAI Code of Ethics, and breaching it is a disciplinary matter. Practically, that means access to your records is limited to the people working on your file, and nothing about your affairs is discussed outside this office.',
      meta: [
        { label: 'Bound by', value: 'ICAI Code of Ethics' },
        { label: 'Access', value: 'Restricted to your engagement team' },
        { label: 'On request', value: 'NDA signed before we start' }
      ],
      sections: [
        {
          title: 'How your information is handled',
          list: [
            'Access limited to the people actually working on your engagement',
            'Portal credentials never shared outside the engagement team',
            'Physical records kept locked; digital records on protected storage',
            'No client name or data used as a reference without your consent',
            'Separate handling where family members or partners are also clients',
            'Non-disclosure agreement signed on request, before onboarding'
          ]
        }
      ]
    },

    'why-proactive': {
      icon: '💡',
      eyebrow: 'Why choose us',
      title: 'Proactive Advisory',
      tagline: 'Tax is decided during the year — not in July when the return is due.',
      lead: 'By the time a return is filed, most opportunities to reduce tax legitimately have already passed. We review your position during the year, while decisions on investments, asset purchases, salary structure and billing timing can still be changed — and we flag exposures before the department does.',
      meta: [
        { label: 'Cadence', value: 'Reviews through the year, before year-end' },
        { label: 'Focus', value: 'Planning first, filing second' },
        { label: 'Alerts', value: 'You hear from us before a deadline or notice' }
      ],
      sections: [
        {
          title: 'What we flag without being asked',
          list: [
            'Old vs new regime (Sec 115BAC) comparison before it is locked in',
            'Advance tax shortfalls before 234B/234C interest builds up',
            'Input tax credit sitting unclaimed or mismatched in GSTR-2B',
            'Capital gains timing and exemption options on property or shares',
            'Salary and director remuneration structuring within the rules',
            'Depreciation and capex timing decisions before year-end',
            'Turnover crossing audit, e-invoicing or registration thresholds',
            'Amendments in law that change something you are already doing'
          ]
        }
      ]
    },

    'why-support': {
      icon: '📞',
      eyebrow: 'Why choose us',
      title: 'Accessible Support',
      tagline: 'A real person answers — usually the one who knows your file.',
      lead: 'Most client frustration with accountants is not about expertise, it is about silence. You will always know who is handling your matter, and questions get an answer the same working day — even when the full answer needs a day or two of work, you hear that instead of nothing.',
      meta: [
        { label: 'Response', value: 'Same working day' },
        { label: 'Reach us on', value: 'Phone · WhatsApp · Email · In person' },
        { label: 'Office hours', value: 'Mon – Sat, 9:30 AM – 6:30 PM' }
      ],
      sections: [
        {
          title: 'What you can expect',
          list: [
            'A named contact for your file, not a general enquiry queue',
            'Same-day acknowledgement of calls, WhatsApp messages and email',
            'Status updates at each milestone, without you having to chase',
            'Notices explained in plain language, with the options and the risk',
            'Walk-in meetings at the Amalapuram office when you prefer face to face',
            'Extended availability through peak filing season'
          ]
        }
      ]
    },

    'why-fees': {
      icon: '🧾',
      eyebrow: 'Why choose us',
      title: 'Transparent Fixed Fees',
      tagline: 'Scope and fee agreed in writing before any work starts.',
      lead: 'You should never open an invoice and find a number you were not expecting. Before we begin, you get the deliverables, the documents we need from you, the timeline and a fixed fee — in writing. If something outside that scope comes up, we quote it and wait for your approval rather than billing you afterwards.',
      meta: [
        { label: 'Quote', value: 'Fixed fee, in writing, before work starts' },
        { label: 'Out of scope', value: 'Quoted and approved before we proceed' },
        { label: 'Consultation', value: 'First discussion is free' }
      ],
      sections: [
        {
          title: 'How our fees work',
          list: [
            'Fixed fee per engagement, not open-ended hourly billing',
            'A written scope listing exactly what is and is not included',
            'Government fees, stamp duty and portal charges shown separately at actuals',
            'Nothing outside the agreed scope is billed without prior approval',
            'Annual retainers available where the work is predictable',
            'Fees set to the actual size of your business, not a city rate card'
          ]
        },
        { title: 'Engagement options', chips: ['One-off filing', 'Seasonal (return season)', 'Monthly retainer', 'Annual retainer', 'Virtual CFO'] }
      ]
    },

    'why-digital': {
      icon: '💻',
      eyebrow: 'Why choose us',
      title: 'Digital & Paperless',
      tagline: 'Send a photo of a bill from your shop counter and it is handled.',
      lead: 'You should not have to close your shop and travel to hand over paperwork. Documents can be shared from your phone, approvals can happen over WhatsApp, and every filing acknowledgement is stored and retrievable years later — which matters the day a notice arrives asking about an old return.',
      meta: [
        { label: 'Share documents', value: 'WhatsApp · Email · Drive' },
        { label: 'Records kept', value: 'Filing history retrievable on request' },
        { label: 'Remote clients', value: 'Full onboarding without an office visit' }
      ],
      sections: [
        {
          title: 'What this makes easier',
          list: [
            'Send invoices and bank statements as phone photos or PDFs',
            'Approve returns over WhatsApp instead of travelling to sign',
            'Digital signature (DSC) set up for company and LLP filings',
            'Every acknowledgement, challan and report archived and searchable',
            'Books maintained in Tally or Zoho Books, accessible when you need them',
            'Onboarding and year-round service for NRIs and out-of-station clients'
          ]
        }
      ]
    },

    'about': {
      icon: '🏛',
      eyebrow: 'About the firm',
      title: 'Puppala and Associates',
      tagline: 'A Chartered Accountancy practice built on precision, plain speaking and deadlines that are never missed.',
      lead: 'We are a Chartered Accountancy firm based on Main Road, Amalapuram, serving individuals, proprietors, partnership firms, LLPs, private limited companies, trusts and societies across the East Godavari region. In four-plus years we have completed more than 2,000 filings for over 300 clients — with a 100% client satisfaction record and not a single missed statutory deadline.',
      meta: [
        { label: 'Established', value: 'Practising since 2021' },
        { label: 'Clients served', value: '300+ across AP' },
        { label: 'Filings completed', value: '2,000+ returns' },
        { label: 'Client satisfaction', value: '100%' }
      ],
      sections: [
        {
          title: 'What we do',
          list: [
            'Income tax planning, return filing, assessments and appeals',
            'End-to-end GST registration, returns, refunds and notices',
            'Statutory, tax, internal and stock audits',
            'Company, LLP and firm incorporation with ROC compliance',
            'Book-keeping, payroll and monthly MIS reporting',
            'Project reports, CMA data and bank loan documentation'
          ]
        },
        {
          title: 'How we work with you',
          steps: [
            { title: 'Free first consultation', text: 'A no-obligation call or office meeting to understand your situation and what compliance actually applies to you.' },
            { title: 'Written scope and fees', text: 'You get the deliverables, the documents we need and a fixed fee in writing before any work starts. No surprise billing.' },
            { title: 'Execution with a named contact', text: 'One person owns your file end to end. You always know who to call, and you get a status update at every milestone.' },
            { title: 'Deadline calendar', text: 'We track every due date that applies to you — GST, TDS, advance tax, ROC — and remind you well before, not after.' }
          ]
        },
        {
          title: 'Who we work with',
          chips: ['Salaried individuals', 'Traders & shop owners', 'Aqua and agri businesses', 'Rice mills', 'Proprietorships', 'Partnership firms & LLPs', 'Private limited companies', 'Trusts, societies & NGOs', 'Doctors & professionals', 'NRIs with Indian income']
        }
      ]
    },

    'income-tax': {
      icon: '📋',
      eyebrow: 'Service',
      title: 'Income Tax Advisory',
      tagline: 'Correct returns, lower legitimate tax outgo, and calm, documented handling of every notice.',
      lead: 'Income tax is not just the annual return — it is regime selection, advance tax timing, capital gains planning and clean documentation that holds up if the department asks questions. We handle the full cycle for salaried individuals, professionals, businesses, firms, companies and NRIs with Indian income.',
      meta: [
        { label: 'Typical turnaround', value: 'ITR filed in 2–3 working days of receiving documents' },
        { label: 'Key due dates', value: '31 July (non-audit) · 31 Oct (audit cases)' },
        { label: 'Advance tax', value: '15 Jun · 15 Sep · 15 Dec · 15 Mar' }
      ],
      sections: [
        {
          title: "What's included",
          list: [
            'Return filing across ITR-1 to ITR-7, whichever applies to you',
            'Old vs new regime (Sec 115BAC) comparison before we file',
            'Deduction planning — 80C, 80D, 80G, HRA, home loan interest',
            'Capital gains computation on property, shares, mutual funds and gold',
            'Advance tax and self-assessment tax computation with challan support',
            'Form 26AS, AIS and TIS reconciliation so no credit is lost',
            'Response to notices u/s 139(9), 143(1), 142(1) and 148',
            'Representation in faceless assessments and appeals before CIT(A)',
            'Form 15CA/15CB certification for foreign remittances',
            'Revised, belated and updated (ITR-U) return filing'
          ]
        },
        {
          title: 'What we need from you',
          list: [
            'PAN, Aadhaar and bank account details',
            'Form 16 / salary statements, or books of account for business income',
            'Interest certificates, capital gains statements, rent receipts',
            'Investment and insurance proofs for deductions',
            'Last year\'s acknowledgement, if you are switching to us'
          ]
        },
        { title: 'Ideal for', chips: ['Salaried employees', 'Business owners', 'Professionals', 'Capital gains cases', 'NRIs', 'Notice & scrutiny cases'] }
      ]
    },

    'gst': {
      icon: '📊',
      eyebrow: 'Service',
      title: 'GST Services',
      tagline: 'Registration to annual return — filed on time, input credit reconciled, notices answered.',
      lead: 'Most GST trouble comes from two things: input tax credit that does not match GSTR-2B, and returns filed late. We take ownership of the monthly calendar, reconcile credit before filing rather than after, and keep your compliance rating clean.',
      meta: [
        { label: 'Registration time', value: '7–10 working days, subject to department approval' },
        { label: 'Monthly due dates', value: 'GSTR-1 by 11th · GSTR-3B by 20th' },
        { label: 'Annual return', value: 'GSTR-9 / 9C by 31 December' }
      ],
      sections: [
        {
          title: "What's included",
          list: [
            'New GST registration, amendment, and additional place of business',
            'Monthly and quarterly returns — GSTR-1, GSTR-3B and QRMP scheme',
            'Annual return GSTR-9 and reconciliation statement GSTR-9C',
            'Input tax credit reconciliation against GSTR-2B every month',
            'E-invoicing and e-way bill setup, plus staff walkthrough',
            'LUT filing for exporters and zero-rated supply advisory',
            'Refund applications — exports, inverted duty, excess cash ledger',
            'Composition scheme evaluation, opt-in and CMP-08 filing',
            'Reply to ASMT-10, DRC-01 and departmental audit queries',
            'Cancellation, final return GSTR-10 and revocation of cancellation'
          ]
        },
        {
          title: 'What we need from you',
          list: [
            'PAN, Aadhaar, photograph and proof of business premises',
            'Bank account proof and constitution documents',
            'Monthly sales and purchase registers (Tally, Excel or bills)',
            'GST portal credentials or a one-time OTP for filing'
          ]
        },
        { title: 'Ideal for', chips: ['Traders & retailers', 'Manufacturers', 'Service providers', 'Exporters', 'E-commerce sellers', 'Works contractors'] }
      ]
    },

    'audit': {
      icon: '🔍',
      eyebrow: 'Service',
      title: 'Auditing & Assurance',
      tagline: 'Independent, evidence-backed audits that satisfy regulators, banks and boards alike.',
      lead: 'An audit should tell you something useful, not just tick a box. Alongside the signed report, you get a management letter that names the weak controls we found and what to do about them — the part that actually reduces risk next year.',
      meta: [
        { label: 'Tax audit report', value: 'Form 3CA/3CB-3CD by 30 September' },
        { label: 'Tax audit applies', value: 'Turnover above ₹1 crore (₹10 crore if ≥95% digital)' },
        { label: 'Typical field time', value: '3–7 working days depending on volume' }
      ],
      sections: [
        {
          title: 'Audits we conduct',
          list: [
            'Statutory audit of companies under the Companies Act, 2013',
            'Tax audit u/s 44AB with Form 3CA / 3CB and 3CD',
            'Internal and concurrent audits with control recommendations',
            'Stock, fixed asset and physical verification audits',
            'Trust, society and NGO audits, including 12A/80G requirements',
            'Bank branch and revenue audits',
            'Due diligence reviews for acquisitions and investments',
            'Special purpose certifications required by banks and departments'
          ]
        },
        {
          title: 'What you receive',
          list: [
            'Signed audit report and audited financial statements',
            'Management letter listing control gaps, ranked by risk',
            'Schedule III compliant Balance Sheet and P&L',
            'Ratio analysis and year-on-year variance commentary',
            'A written action plan for the next financial year'
          ]
        },
        { title: 'Ideal for', chips: ['Private limited companies', 'LLPs', 'Firms crossing 44AB limits', 'Trusts & societies', 'Businesses seeking funding'] }
      ]
    },

    'registration': {
      icon: '🏢',
      eyebrow: 'Service',
      title: 'Company Registration',
      tagline: 'Pick the right structure first, then get incorporated without a single rejected form.',
      lead: 'The structure you choose decides your tax rate, your compliance cost and how easily you can raise money later. We start with that conversation — proprietorship vs LLP vs private limited — and only then file. Incorporation includes everything you need to legally start operating.',
      meta: [
        { label: 'Pvt Ltd / LLP', value: 'Typically 10–15 working days end to end' },
        { label: 'Proprietorship / GST', value: 'Typically 7–10 working days' },
        { label: 'Included', value: 'DSC, DIN, PAN, TAN and bank account documents' }
      ],
      sections: [
        {
          title: 'Structures we set up',
          list: [
            'Private Limited Company via SPICe+ (INC-32) with MOA and AOA',
            'Limited Liability Partnership via FiLLiP, with LLP agreement',
            'One Person Company (OPC) for single founders',
            'Partnership firm — deed drafting and registration',
            'Proprietorship setup with GST, Udyam and Shop Act registration',
            'Section 8 company / trust / society for non-profits',
            'Producer company and farmer collectives'
          ]
        },
        {
          title: 'Registrations we add on',
          list: [
            'PAN, TAN and GST registration',
            'MSME / Udyam and Shop & Establishment licence',
            'Import Export Code (IEC) and FSSAI licence',
            'Professional tax, PF and ESI enrolment',
            'Trademark filing for your brand name and logo',
            'Digital Signature Certificates for all directors or partners'
          ]
        },
        { title: 'Ideal for', chips: ['First-time founders', 'Family businesses formalising', 'Startups raising funds', 'Firms converting to LLP', 'NGOs'] }
      ]
    },

    'bookkeeping': {
      icon: '📒',
      eyebrow: 'Service',
      title: 'Accounting & Bookkeeping',
      tagline: 'Books that are current, reconciled and ready for any filing, audit or bank query.',
      lead: 'Books maintained only at year-end cost you money — missed input credit, unnoticed leakage, and a scramble every deadline. We keep your accounts current monthly, reconcile every bank and GST figure, and hand you a short MIS you can actually read.',
      meta: [
        { label: 'Reporting cycle', value: 'Monthly MIS by the 10th of the following month' },
        { label: 'Software', value: 'Tally, Zoho Books, Busy or your existing setup' },
        { label: 'Engagement', value: 'Monthly retainer or annual write-up' }
      ],
      sections: [
        {
          title: "What's included",
          list: [
            'Day-to-day voucher entry — sales, purchases, expenses, journals',
            'Bank, cash and credit card reconciliation every month',
            'GST output and input reconciliation with the returns filed',
            'Receivables and payables ageing, with follow-up lists',
            'Fixed asset register and depreciation as per Companies Act / IT Act',
            'Payroll processing with PF, ESI and professional tax workings',
            'Monthly MIS — P&L, balance sheet, cash flow and key ratios',
            'Year-end financial statements in Schedule III format',
            'Audit-ready schedules and ledger scrutiny before the auditor arrives'
          ]
        },
        {
          title: 'What we need from you',
          list: [
            'Bank statements in PDF or Excel',
            'Sales and purchase invoices (physical, scanned or via Drive)',
            'Expense vouchers and petty cash records',
            'Salary details and attendance data for payroll'
          ]
        },
        { title: 'Ideal for', chips: ['Growing SMEs', 'Businesses without an in-house accountant', 'Companies needing audit-ready books', 'Startups'] }
      ]
    },

    'tds': {
      icon: '💰',
      eyebrow: 'Service',
      title: 'TDS / TCS Returns',
      tagline: 'Deduct the right amount, deposit on time, and keep TRACES free of defaults.',
      lead: 'TDS defaults are expensive and quietly cumulative — interest, late fee of ₹200 per day under 234E, and disallowance of the expense itself. We compute correctly at source, deposit before the 7th, file every quarter, and clear existing defaults on TRACES.',
      meta: [
        { label: 'Monthly deposit', value: 'By the 7th of the following month' },
        { label: 'Quarterly returns', value: '31 Jul · 31 Oct · 31 Jan · 31 May' },
        { label: 'Form 16 issue', value: 'By 15 June for the previous financial year' }
      ],
      sections: [
        {
          title: "What's included",
          list: [
            'TAN application and registration on TRACES',
            'Correct section and rate determination before payment',
            'Quarterly returns — 24Q (salary), 26Q, 27Q (non-resident), 27EQ (TCS)',
            'Form 16 and Form 16A generation and issue to deductees',
            'Challan preparation, payment support and OLTAS verification',
            'Correction statements for PAN, challan and amount mismatches',
            'Clearing short deduction, short payment and late fee defaults',
            'Lower / nil deduction certificates u/s 197',
            'TDS on property (26QB), rent (26QC) and contractor payments (194C)',
            'Compliance for 194Q, 194R, 194O and 206AB higher-rate cases'
          ]
        },
        {
          title: 'What we need from you',
          list: [
            'TAN and TRACES credentials',
            'Party-wise payment details with PAN',
            'Challans already paid for the quarter',
            'Salary structure details for 24Q filings'
          ]
        },
        { title: 'Ideal for', chips: ['Employers', 'Companies & LLPs', 'Contractors', 'Property buyers', 'Anyone with a TDS default notice'] }
      ]
    },

    'project-finance': {
      icon: '📈',
      eyebrow: 'Service',
      title: 'Project Finance',
      tagline: 'Bank-ready project reports and CMA data that get sanctioned, not sent back.',
      lead: 'Banks reject proposals for predictable reasons — projections that ignore working capital cycles, ratios outside acceptable bands, and missing supporting documents. We build the numbers the way a credit officer reads them, and stay with you through queries until sanction.',
      meta: [
        { label: 'Report delivery', value: 'Typically 4–7 working days after data is received' },
        { label: 'Covers', value: 'Term loans, working capital, MSME and subsidy schemes' },
        { label: 'Support', value: 'Through appraisal, queries and disbursement' }
      ],
      sections: [
        {
          title: "What's included",
          list: [
            'Detailed Project Report (DPR) with technical and market sections',
            'CMA data in the format your bank requires',
            'Financial projections — P&L, balance sheet, cash flow, DSCR, break-even',
            'Working capital assessment and drawing power computation',
            'Loan application compilation and document checklist',
            'Ratio analysis benchmarked to what lenders expect',
            'Support for MSME, Mudra, PMEGP and Stand-Up India schemes',
            'Subsidy and incentive identification, including state schemes',
            'Response to banker queries and credit appraisal follow-up',
            'Post-sanction stock statements and periodic monitoring returns'
          ]
        },
        {
          title: 'What we need from you',
          list: [
            'Business plan or a clear description of the project',
            'Cost of project — quotations for machinery, civil work, land',
            'Last 3 years financials and IT returns, if an existing unit',
            'Bank statements for the last 12 months',
            'Promoter KYC, net worth details and collateral particulars'
          ]
        },
        { title: 'Ideal for', chips: ['New manufacturing units', 'Aqua & agri projects', 'Rice mills', 'Working capital enhancement', 'MSME loan applicants'] }
      ]
    },

    'compliance': {
      icon: '⚖️',
      eyebrow: 'Service',
      title: 'Regulatory Compliance',
      tagline: 'Every ROC, FEMA and secretarial deadline tracked, filed and documented for you.',
      lead: 'Company law penalties run daily and do not lapse — ₹100 per day per form with no ceiling for late annual filings, and directors risk disqualification. We maintain a compliance calendar per entity, file ahead of the due date, and keep your statutory records in order.',
      meta: [
        { label: 'Annual filings', value: 'AOC-4 within 30 days · MGT-7 within 60 days of AGM' },
        { label: 'Director KYC', value: 'DIR-3 KYC by 30 September every year' },
        { label: 'Deposits return', value: 'DPT-3 by 30 June' }
      ],
      sections: [
        {
          title: "What's included",
          list: [
            'Annual ROC filings — AOC-4, MGT-7 / 7A, and LLP Forms 8 and 11',
            'Board and general meeting minutes, notices and resolutions',
            'Director appointment, resignation and DIN compliance (DIR-12)',
            'DIR-3 KYC for all directors, every year',
            'DPT-3 return of deposits and loans from directors',
            'Share allotment, transfer and share certificate maintenance',
            'Charge creation, modification and satisfaction (CHG-1, CHG-4)',
            'Registered office change and MOA / AOA amendments',
            'FEMA reporting — FC-GPR, FC-TRS and the annual FLA return',
            'Statutory register maintenance and condonation / compounding support'
          ]
        },
        {
          title: 'What we need from you',
          list: [
            'Certificate of incorporation, MOA / AOA or LLP agreement',
            'Audited financials for the year',
            'Director / partner KYC and DSCs',
            'Details of any changes during the year'
          ]
        },
        { title: 'Ideal for', chips: ['Private limited companies', 'LLPs', 'Companies with FDI', 'Dormant companies', 'Entities with pending filings'] }
      ]
    },

    'financial-advisory': {
      icon: '🎯',
      eyebrow: 'Service',
      title: 'Financial Advisory',
      tagline: 'Decisions taken with numbers in front of you — pricing, funding, structure, succession.',
      lead: 'Compliance tells you what happened. Advisory decides what happens next: whether a price increase or a cost cut fixes your margin, whether to lease or buy, how to bring the next generation in without a family dispute. We work with your actual numbers, not templates.',
      meta: [
        { label: 'Format', value: 'One-off engagement or monthly virtual CFO retainer' },
        { label: 'Reviews', value: 'Monthly or quarterly, with a written action list' },
        { label: 'First step', value: 'A free 30-minute scoping discussion' }
      ],
      sections: [
        {
          title: "What's included",
          list: [
            'Business valuation for sale, fundraising, or family settlement',
            'Budgeting, forecasting and monthly variance analysis',
            'Cash flow planning and working capital cycle improvement',
            'Costing, pricing and product-wise profitability analysis',
            'Business restructuring, mergers and demergers',
            'Succession and family settlement planning, with tax impact',
            'Investment structuring and tax-efficient wealth planning',
            'Insurance adequacy and retirement corpus review',
            'Virtual CFO support — dashboards, reviews, banker interaction',
            'Internal control and process design as you scale'
          ]
        },
        {
          title: 'What we need from you',
          list: [
            'Last 2–3 years financial statements and tax returns',
            'Current management accounts, if available',
            'A clear statement of the decision you are trying to make',
            'Existing loan, investment and insurance particulars'
          ]
        },
        { title: 'Ideal for', chips: ['Family businesses', 'Growing SMEs', 'Founders planning exit', 'Second-generation transitions', 'High-net-worth individuals'] }
      ]
    }
  };

  const modalApi = (function modal() {
    const overlay = qs('#modal-overlay');
    const dialog = qs('#modal');
    const closeBtn = qs('#modal-close');
    const scroll = qs('#modal-scroll');
    const iconEl = qs('#modal-icon');
    const eyebrowEl = qs('#modal-eyebrow');
    const titleEl = qs('#modal-title');
    const taglineEl = qs('#modal-tagline');
    const bodyEl = qs('#modal-body');

    if (!overlay || !dialog || !bodyEl) return { open() {}, close() {} };

    let lastFocused = null;
    let openKey = null;

    const escapeHtml = (str) => String(str).replace(/[&<>"']/g, (c) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));

    function renderSection(section) {
      let inner = '';
      if (section.list) {
        inner = '<ul class="modal-list">' +
          section.list.map((item) => `<li>${escapeHtml(item)}</li>`).join('') +
          '</ul>';
      } else if (section.chips) {
        inner = '<div class="modal-chips">' +
          section.chips.map((chip) => `<span class="modal-chip">${escapeHtml(chip)}</span>`).join('') +
          '</div>';
      } else if (section.steps) {
        inner = '<div class="modal-steps">' +
          section.steps.map((step) => `
            <div class="modal-step">
              <div class="modal-step-body">
                <h4>${escapeHtml(step.title)}</h4>
                <p>${escapeHtml(step.text)}</p>
              </div>
            </div>`).join('') +
          '</div>';
      }
      return `<section class="modal-section"><h3>${escapeHtml(section.title)}</h3>${inner}</section>`;
    }

    function render(key, data) {
      iconEl.textContent = data.icon;
      eyebrowEl.textContent = data.eyebrow;
      titleEl.textContent = data.title;
      taglineEl.textContent = data.tagline;

      const meta = data.meta && data.meta.length
        ? '<div class="modal-meta">' + data.meta.map((m) => `
            <div class="modal-meta-item">
              <h5>${escapeHtml(m.label)}</h5>
              <p>${escapeHtml(m.value)}</p>
            </div>`).join('') + '</div>'
        : '';

      const serviceName = SERVICE_OPTION[key];
      const waText = serviceName
        ? `Hello Puppala & Associates, I would like to know more about your ${serviceName} service.`
        : 'Hello Puppala & Associates, I would like to know more about your services.';
      const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waText)}`;

      bodyEl.innerHTML = `
        <p class="modal-lead">${escapeHtml(data.lead)}</p>
        ${meta}
        ${(data.sections || []).map(renderSection).join('')}
        <div class="modal-cta">
          <button type="button" class="btn btn-primary" data-modal-action="enquire">
            ${serviceName ? 'Enquire about this service' : 'Book a free consultation'}
            <svg class="btn-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
          <a class="btn btn-ghost" href="${waUrl}" target="_blank" rel="noopener">Chat on WhatsApp</a>
          <a class="btn btn-ghost" href="tel:+91${WHATSAPP_NUMBER.slice(2)}">Call +91 70756 44785</a>
        </div>`;
    }

    function focusables() {
      return qsa('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])', dialog)
        .filter((el) => el.offsetParent !== null || el === closeBtn);
    }

    function open(key) {
      const data = DETAILS[key];
      if (!data) return;

      lastFocused = document.activeElement;
      openKey = key;
      render(key, data);

      overlay.hidden = false;
      document.body.classList.add('modal-open');
      // Next frame so the transition actually runs
      requestAnimationFrame(() => overlay.classList.add('open'));
      if (scroll) scroll.scrollTop = 0;
      closeBtn && closeBtn.focus();
    }

    function close() {
      if (overlay.hidden) return;
      overlay.classList.remove('open');
      document.body.classList.remove('modal-open');
      openKey = null;

      const finish = () => { overlay.hidden = true; };
      if (reduceMotion) finish();
      else setTimeout(finish, 340);

      if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    }

    // Close interactions
    closeBtn && closeBtn.addEventListener('click', close);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });

    document.addEventListener('keydown', (e) => {
      if (overlay.hidden) return;
      if (e.key === 'Escape') { close(); return; }
      if (e.key === 'Tab') {
        const items = focusables();
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      }
    });

    // "Enquire" jumps to the contact form with the right service preselected
    bodyEl.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-modal-action="enquire"]');
      if (!btn) return;
      const service = SERVICE_OPTION[openKey];
      close();
      const select = qs('#contact-service');
      if (select && service) {
        const match = Array.from(select.options).find((o) => o.value === service);
        if (match) select.value = service;
      }
      const contact = qs('#contact');
      if (contact) {
        const offset = parseInt(getComputedStyle(document.documentElement)
          .getPropertyValue('--header-offset'), 10) || 96;
        smoothScrollTo(contact.getBoundingClientRect().top + window.scrollY - offset);
        setTimeout(() => { const n = qs('#contact-name'); n && n.focus({ preventScroll: true }); }, 700);
      }
    });

    return { open, close };
  })();

  // Anything with data-modal opens the dialog: service buttons, cards, footer links
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-modal]');
    if (!trigger) return;
    // Let a real link inside a card (phone, email) behave normally
    if (e.target.closest('a[href^="tel:"], a[href^="mailto:"], a[target="_blank"]')) return;
    e.preventDefault();
    modalApi.open(trigger.dataset.modal);
  });

  // Keyboard: cards are not focusable, but their Learn more buttons are —
  // Enter/Space on those is handled natively by <button>.

  /* ── 8. Contact form → WhatsApp ───────────── */
  (function contactForm() {
    const form = qs('#contact-form');
    if (!form) return;

    const submitBtn = qs('#contact-submit-btn');
    const status = qs('#form-status');
    const honeypot = qs('#contact-website');

    const setStatus = (msg, type) => {
      if (!status) return;
      status.textContent = msg;
      status.className = 'form-status' + (type ? ' ' + type : '');
    };

    const markInvalid = (field, invalid) => {
      if (field) field.classList.toggle('invalid', invalid);
    };

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const nameEl = qs('#contact-name');
      const phoneEl = qs('#contact-phone');
      const emailEl = qs('#contact-email');
      const serviceEl = qs('#contact-service');
      const messageEl = qs('#contact-message');

      const name = nameEl.value.trim();
      const phoneDigits = phoneEl.value.replace(/\D/g, '');
      const email = emailEl.value.trim();
      const service = serviceEl.value || 'Not specified';
      const message = messageEl.value.trim();

      // Bots fill hidden fields; humans never see this one.
      if (honeypot && honeypot.value) {
        setStatus('Thank you — your message has been received.', 'success');
        form.reset();
        return;
      }

      const errors = [];
      const nameBad = name.length < 2;
      const phoneBad = !(phoneDigits.length === 10 || (phoneDigits.length === 12 && phoneDigits.startsWith('91')));
      const emailBad = email !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
      const messageBad = message.length < 5;

      markInvalid(nameEl, nameBad);
      markInvalid(phoneEl, phoneBad);
      markInvalid(emailEl, emailBad);
      markInvalid(messageEl, messageBad);

      if (nameBad) errors.push('your name');
      if (phoneBad) errors.push('a valid 10-digit phone number');
      if (emailBad) errors.push('a valid email address');
      if (messageBad) errors.push('a short message');

      if (errors.length) {
        setStatus('Please enter ' + errors.join(', ') + '.', 'error');
        const firstBad = [nameEl, phoneEl, emailEl, messageEl].find((el) => el.classList.contains('invalid'));
        firstBad && firstBad.focus();
        return;
      }

      const whatsappMessage =
        '*New enquiry — Puppala & Associates website*\n\n' +
        'Name: ' + name + '\n' +
        'Phone: ' + phoneEl.value.trim() + '\n' +
        'Email: ' + (email || '—') + '\n' +
        'Service required: ' + service + '\n\n' +
        'Message:\n' + message;

      const url = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(whatsappMessage);

      const originalHtml = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Opening WhatsApp…';
      setStatus('');

      const opened = window.open(url, '_blank', 'noopener');
      if (!opened) window.location.href = url; // popup blocked — navigate instead

      setStatus('WhatsApp opened with your details. If nothing happened, call us on +91 70756 44785.', 'success');
      form.reset();
      [nameEl, phoneEl, emailEl, messageEl].forEach((el) => markInvalid(el, false));

      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHtml;
      }, 2500);
    });

    // Clear the error styling as soon as the visitor starts fixing it
    qsa('input, textarea, select', form).forEach((el) => {
      el.addEventListener('input', () => markInvalid(el, false));
    });
  })();

  /* ── 9. Newsletter ────────────────────────── */
  (function newsletter() {
    const form = qs('#newsletter-form');
    if (!form) return;

    const input = qs('#newsletter-email');
    const status = qs('#newsletter-status');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = input.value.trim();

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        if (status) status.textContent = 'Please enter a valid email address.';
        input.focus();
        return;
      }

      // A static site cannot store subscribers, so hand off to email instead of
      // pretending it was saved.
      const subject = encodeURIComponent('Subscribe me to tax & compliance updates');
      const body = encodeURIComponent(
        'Please add this email to your updates list:\n\n' + email + '\n'
      );
      window.location.href =
        'mailto:puppalaandassociates31@gmail.com?subject=' + subject + '&body=' + body;

      if (status) status.textContent = 'Opening your email app to confirm the subscription…';
      input.value = '';
    });
  })();

  /* ── 10. Misc ─────────────────────────────── */

  // Footer year — no more stale copyright
  const yearEl = qs('#footer-year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Active nav link follows the section in view
  (function activeNav() {
    const links = qsa('.nav-links a[href^="#"]');
    if (!links.length || !('IntersectionObserver' in window)) return;

    const map = new Map();
    links.forEach((link) => {
      const section = document.querySelector(link.getAttribute('href'));
      if (section) map.set(section, link);
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const link = map.get(entry.target);
        if (!link) return;
        links.forEach((l) => l.classList.remove('active'));
        link.classList.add('active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    map.forEach((_, section) => observer.observe(section));
  })();

  // Deep link: index.html#learn-gst opens that service straight away
  (function deepLink() {
    const match = /^#learn-(.+)$/.exec(window.location.hash);
    if (match && DETAILS[match[1]]) {
      setTimeout(() => modalApi.open(match[1]), 600);
    }
  })();
})();
