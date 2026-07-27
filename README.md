# Puppala and Associates — Chartered Accountants Website

<<<<<<< HEAD
Professional CA firm website for **Puppala and Associates** based in Amalapuram, Andhra Pradesh.  
Inspired by
=======
Professional CA firm website for **Puppala and Associates**, Amalapuram, Andhra Pradesh.
Static site — plain HTML, CSS and JavaScript, no build step, no dependencies to install.
>>>>>>> c56e648 (updated)

## 🚀 GitHub Pages Deployment

### Step 1: Create the repository
1. Go to [github.com](https://github.com) → **New repository**
2. Name it `puppalaandassociates.github.io`
3. Set it to **Public**

### Step 2: Push the files
Push the whole folder, keeping the structure below intact (the `assets/` folder must
come along — the site references the images from there).

### Step 3: Enable Pages
**Settings → Pages** → Source: **Deploy from a branch** → Branch: **main** / **/ (root)** → **Save**

Live at `https://puppalaandassociates.github.io/`

> `.nojekyll` is included so GitHub serves the files exactly as they are instead of
> running them through Jekyll.

### Step 4: (Optional) Custom domain
1. Add a `CNAME` file containing your domain (e.g. `puppalaandassociates.com`)
2. DNS records:
   - **A** → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - **CNAME** (for `www`) → `puppalaandassociates.github.io`
3. Set the domain in **Settings → Pages → Custom domain**
4. Update the absolute URLs in `index.html` (`canonical`, `og:url`, `og:image`,
   `twitter:image`, JSON-LD `url`/`image`) and in `sitemap.xml` / `robots.txt`

### Step 5: (Optional) Google Analytics
GA4 is **commented out** in `index.html` — an unreplaced `G-XXXXXXXXXX` placeholder
downloads the script and records nothing, so it is off by default. To enable:
uncomment the two lines in the GA block near the top of `index.html` and replace
`G-XXXXXXXXXX` with your real Measurement ID.

## 📁 File Structure
```
puppalaandassociates.github.io/
├── index.html                        ← Main page
├── style.css                         ← All styles (incl. 3D + modal)
├── script.js                         ← All interactivity
├── 404.html                          ← Custom 404 page
├── robots.txt                        ← Crawler rules
├── sitemap.xml                       ← Sitemap (update lastmod on changes)
├── .nojekyll                         ← Serve files as-is on GitHub Pages
├── README.md                         ← This file
└── assets/
    └── img/
        ├── about-advisory.svg        ← About-section illustration
        ├── ca-india-logo.png         ← Official CA India logo (site logo mark)
        └── og-cover.png              ← Social share preview (1200×630)
```

## 🔧 Features
- Fully responsive (mobile, tablet, desktop) with a proper mobile menu
- **3D effects**: pointer-tracked card tilt with specular glare, a rotating hero card
  stack, depth-lifted icons, 3D modal entrance (the CA logo itself is never rotated)
- **Working “Learn more”**: every service and the About section opens a detailed
  dialog — scope, due dates, documents required, who it suits, and a CTA that
  pre-selects that service in the contact form
- Shareable deep links: `/#learn-gst`, `/#learn-income-tax`, … open a service directly
- Animated counters and scroll reveals that replay every time a section scrolls into
  view — scrolling up as well as down — plus a scrolling service marquee
- WhatsApp handoff from the contact form, with validation and a spam honeypot
- Accessibility: skip link, focus-visible rings, focus-trapped dialog, `aria-expanded`
  on the menu, Esc to close, keyboard-reachable controls
- Respects `prefers-reduced-motion`; works with JavaScript disabled; print stylesheet
- SEO: canonical, Open Graph + Twitter cards with a real preview image, JSON-LD
  `AccountingService` schema with address, hours and service catalogue

## ✏️ Editing the content

| What | Where |
|------|-------|
| Phone / email / address | `index.html` (top bar, contact section, footer, JSON-LD) |
| WhatsApp number | `WHATSAPP_NUMBER` in `script.js` **and** the `wa.me/` links in `index.html` |
| Headline stats (4+, 300+, 2000+, 100%) | `data-target` attributes + visible text in `index.html` |
| “Learn more” content | `DETAILS` object in `script.js` — one entry per service |
| Colours / spacing / shadows | CSS custom properties in `:root` at the top of `style.css` |
| Images | `assets/img/` — keep the same filenames to avoid touching the HTML |

To add a service: copy a `.service-card` block in `index.html`, give it a new
`data-modal="your-key"`, then add a matching `your-key` entry to `DETAILS` in
`script.js` (and to `SERVICE_OPTION` if it should appear in the contact dropdown).

## 🧪 Testing locally
```bash
python3 -m http.server 8000
# then open http://localhost:8000
```
Use a server rather than opening `index.html` directly so relative asset paths and
the Google Maps embed behave the same as they will in production.

## 📞 Contact Details
- **Phone:** +91 70756 44785
- **WhatsApp:** [wa.me/917075644785](https://wa.me/917075644785)
- **Email:** info@puppalaandassociates.com
- **Address:** Main Road, Amalapuram, East Godavari, Andhra Pradesh 533201
- **Hours:** Mon – Sat, 9:30 AM – 6:30 PM

## ⚠️ Notes before going live
- The site logo is the **official CA India logo** (`assets/img/ca-india-logo.png`),
  cropped from ICAI's own logo banner. ICAI's usage rules are enforced in the CSS —
  the mark is **never rotated, tilted, distorted, recoloured, or stripped of its
  white background**; it only lifts on hover. If you replace the file, use the
  official artwork from ICAI's member portal and keep the same proportions.
  Note the logo may only be used by ICAI members in good standing.
- Update the **Google Maps embed** in `index.html` to the exact office pin, and the
  **social media URLs** if any handle differs.
- The **testimonials** are placeholders — replace them with real, consented quotes.
- The **stats** (4+ years, 300+ clients, 2000+ returns, 100% satisfaction) and the
  "practising since 2021" line in the About modal should be confirmed as accurate.
- The contact form has no server: it opens WhatsApp with the details pre-filled.
  For emailed submissions instead, add a [Formspree](https://formspree.io) endpoint
  and post to it in `script.js`.
