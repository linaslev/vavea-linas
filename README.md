# Vavea & Linas — Save the Date

A simple static "save the date" website for Vavea & Linas's wedding —
**July 31, 2027, Vilnius, Lithuania**.

Includes a live countdown and a form for guests to submit their name and
mailing address so invitations can be sent later.

## Project structure

```
index.html        Main page (hero, details, RSVP/address form)
css/style.css      All styling
js/script.js       Countdown timer + form submission logic
```

No build tools, frameworks, or dependencies — just plain HTML/CSS/JS, so it
can be hosted anywhere that serves static files.

## 1. Set up the form backend (Formspree)

The form currently posts to a placeholder URL. To make it actually deliver
submissions to you:

1. Go to [formspree.io](https://formspree.io) and create a free account.
2. Create a new form and copy the endpoint it gives you, e.g.
   `https://formspree.io/f/abcd1234`.
3. Open `index.html` and replace the placeholder in the form's `action`
   attribute:

   ```html
   <form id="rsvp-form" class="rsvp-form" action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
   ```

4. Submit a test entry from the live site — Formspree requires one
   confirmation submission the first time before it starts forwarding
   emails.
5. In the Formspree dashboard you can view/export all submissions (name,
   surname, address, email, guest count) as CSV at any time — handy for
   building your invitation mailing list.

The included `_gotcha` hidden field is Formspree's built-in honeypot for
basic spam protection — no action needed.

> Alternative: [Getform](https://getform.io) works the same way — just swap
> the `action` URL.

## 2. Customize content

- Wedding date/time used for the countdown is set in `js/script.js`:
  ```js
  const WEDDING_DATE = new Date("2027-07-31T15:00:00+03:00");
  ```
  Adjust the time if you'd like the countdown to target a specific ceremony
  time.
- Colors and fonts are defined as CSS variables at the top of
  `css/style.css` (`:root { ... }`).
- Add a couple photo to the hero by dropping an image into a new `img/`
  folder and referencing it in `index.html`/`style.css`.

## 3. Hosting (free static hosting options)

Any static host works. A few easy free choices:

### GitHub Pages
1. Push this repo to GitHub.
2. In the repo settings, go to **Pages** → set source to the `main` branch
   (root folder).
3. Your site will be live at `https://<username>.github.io/<repo>/`.

### Netlify
1. Drag-and-drop this folder into [app.netlify.com/drop](https://app.netlify.com/drop), or
2. Connect the GitHub repo for automatic deploys on every push.

### Vercel / Cloudflare Pages
Both support "no framework / static site" deployments — just point them at
this folder with no build command.

## 4. Local preview

Open `index.html` directly in a browser, or serve it locally:

```sh
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.
