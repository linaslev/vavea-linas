# Vavea &amp; Linas — Save the Date 🌿

A static save-the-date website in **English, Lithuanian and French**.
**31st of July 2027 · Vilnius, Lithuania.**

No build step, no framework, no dependencies — just open `index.html`.

```
index.html                    everything on one page
css/style.css                 all styles + the colour palette
js/app.js                     countdown, language toggle, gallery, form
assets/favicon.svg
assets/og-image.svg           link preview card
assets/gallery/*.svg          placeholder photos — replace these
tools/google-apps-script.gs   the form backend (paste into Google)
tools/make-placeholders.mjs   regenerates the placeholder art (optional)
```

---

## 1. Preview it locally

Just double-click `index.html`, or run a tiny server so everything behaves
exactly like it will live:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

---

## 2. Collecting the answers (5 minutes, one time)

Guest submissions land as rows in a **Google Sheet** you own — easy to sort,
filter and export when it's time to print address labels.

1. Go to **[sheets.new](https://sheets.new)** and name the spreadsheet
   e.g. *Wedding guests*.
2. In the menu: **Extensions → Apps Script**. A code editor opens.
3. Delete the sample `function myFunction() {}` and paste in the **entire
   contents of `tools/google-apps-script.gs`**.
4. *(Optional)* At the top of that script, add one or more addresses to the
   `NOTIFY_EMAILS` list to get an email for every submission — e.g.
   `var NOTIFY_EMAILS = ['vavea@example.com', 'linas@example.com'];`
   Leave the list empty for no emails.
5. Click **Deploy → New deployment**.
   - Click the ⚙️ next to "Select type" → **Web app**
   - **Description:** anything, e.g. `guest form`
   - **Execute as:** *Me*
   - **Who has access:** **Anyone** ← important, guests aren't logged in
   - **Deploy** → approve the permission prompts
     (you'll see an "unverified app" warning — it's your own script, click
     *Advanced → Go to …* and allow it)
6. Copy the **Web app URL**. It looks like
   `https://script.google.com/macros/s/AKfy…long…/exec`
7. Open `js/app.js` and paste it into `CONFIG.endpoint` near the top:

   ```js
   var CONFIG = {
     weddingDate: new Date(2027, 6, 31, 15, 0, 0),
     endpoint: 'https://script.google.com/macros/s/AKfy…/exec'   // ← here
   };
   ```

That's it. A **Guests** tab appears in your spreadsheet with tidy headers the
first time someone submits.

> **Until you do step 7** the form runs in *demo mode*: it validates
> everything and shows a success message, but sends nothing (the data is
> logged to the browser console so you can still test the flow).

### Changed the script later?

Apps Script serves the *deployed* version, not the saved one. After editing:
**Deploy → Manage deployments → ✏️ edit → Version: New version → Deploy.**
The URL stays the same.

---

## 3. Adding your real photos

1. Put your images in `assets/gallery/`.
   Around **1600px on the long edge**, `.jpg` or `.webp`, is plenty.
2. In `index.html`, find the `<!-- GALLERY -->` section and for each item
   update **three** things:

   ```html
   <button type="button" class="shot" data-full="assets/gallery/YOUR-PHOTO.jpg">
     <img src="assets/gallery/YOUR-PHOTO.jpg" alt="" loading="lazy" decoding="async">
     <span class="shot-caption" data-i18n
           data-en="Your caption"
           data-lt="Tavo antraštė"
           data-fr="Votre légende">Your caption</span>
   </button>
   ```

   - `data-full` — the large version shown in the lightbox
   - `src` — the thumbnail (can be the same file)
   - `data-en` / `data-lt` / `data-fr` — the caption in each language

3. Want more or fewer photos? Add or delete `<li class="gallery-item">`
   blocks — the layout reflows on its own. Two optional modifiers control
   the mosaic:
   - `gallery-item--tall` → takes two rows (portrait)
   - `gallery-item--wide` → takes two columns (landscape)

You can delete `tools/make-placeholders.mjs` and the placeholder SVGs once
your own photos are in.

---

## 4. Editing text

The site is in **English, Lithuanian and French**. All copy lives directly in
`index.html`, and every translatable element carries all three languages:

```html
<p data-i18n
   data-en="English text"
   data-lt="Lietuviškas tekstas"
   data-fr="Texte français">English text</p>
```

Edit `data-en`, `data-lt` **and** `data-fr`, plus the visible text between the
tags (that's what shows before JavaScript runs). Input placeholders use the
same pattern with a `-placeholder` suffix:

```html
<textarea data-i18n-placeholder
  data-en-placeholder="Street and number"
  data-lt-placeholder="Gatvė ir numeris"
  data-fr-placeholder="Rue et numéro"
  placeholder="Street and number"></textarea>
```

The `EN / LT / FR` switch in the header remembers each guest's choice in
`localStorage`. On a first visit the language is picked from the browser's
preferred languages, falling back to English.

Messages that only appear at runtime — validation errors, the "sent"
confirmation, lightbox button labels — live in the `STRINGS` table at the top
of `js/app.js`. Add a key to all three blocks if you add a new message.

### Adding a fourth language

1. Add a `<button type="button" data-lang="xx">XX</button>` to `.lang` in
   `index.html`.
2. Add an `xx:` block to `STRINGS` in `js/app.js` (copy the `en` block and
   translate every value).
3. Add `data-xx="…"` to every `data-i18n` element, and
   `data-xx-placeholder="…"` to the address textarea.

Nothing else needs changing — the switcher and detection are generic.

---

## 5. Colours

Everything is driven by CSS custom properties at the top of `css/style.css`:

| Token | Value | Used for |
| --- | --- | --- |
| `--olive-800` | `#3d4a2c` | dark bands, headings |
| `--olive-600` | `#61713f` | stems, eyebrow text |
| `--sage-300` | `#b7c2a2` | labels on dark green |
| `--sage-200` | `#cfd7c0` | buttons, chips |
| `--cream-100` | `#f7f2e8` | page background |
| `--wine-700` | `#5c2230` | names, script headings |
| `--wine-600` | `#73303c` | accents, dividers |
| `--gold-500` | `#a98b52` | small highlights |

Change a value once and it updates everywhere.

---

## 6. Deploying

Any static host works — upload the whole folder as-is.

**GitHub Pages** (free, already a git repo):

```bash
git add -A
git commit -m "Save the date site"
git push
```

Then in the repo: **Settings → Pages → Source: Deploy from a branch →
`main` / `root` → Save.** Live in a minute at
`https://<user>.github.io/<repo>/`.

**Netlify / Cloudflare Pages:** drag the folder onto their dashboard, or
connect the repo and leave the build command empty with the publish
directory set to `/`. The included `_headers` file makes them serve the
`.ics` files as `text/calendar` — see below.

**Custom domain:** add it in your host's dashboard.

### Add-to-calendar files

The "Apple / Outlook" button links to a real file in
`assets/calendar/` (one per language). They're committed to the repo, so
there's nothing to do at deploy time — but if you change the date or the
event wording, regenerate them:

```bash
node tools/make-ics.mjs
```

Keep `DAY` / `TEXT` in that script in sync with `CONFIG.weddingDay` and the
`calTitle` / `calWhere` / `calNote` strings in `js/app.js`.

> **Why files and not generated in the browser?** In-app browsers (Messenger,
> Instagram, Facebook) ignore the `download` attribute and won't hand a
> `blob:` URL to the operating system, so guests saw the raw text of the
> file. A normal URL served as `text/calendar` gets passed to the Calendar
> app instead. On GitHub Pages this works out of the box; on
> Netlify/Cloudflare the `_headers` file takes care of it.

---

## 7. Odds and ends

- **The date** is in one place: `CONFIG.weddingDate` in `js/app.js`
  (months are 0-indexed, so `6` = July). The countdown reads it directly.
- **Spam** is handled by a hidden honeypot field; bots that fill it get a
  fake success message and nothing is stored.
- **Accessibility:** keyboard-navigable, focus-visible outlines, the
  lightbox traps focus and closes on <kbd>Esc</kbd>, and all motion is
  disabled for anyone with *reduce motion* enabled.
- **Illustrations** (the couple, Poppy, the leafy corners) are inline SVG in
  the sprite at the bottom of `index.html` — no image requests, and they
  recolour automatically with the palette.
