# Vavea & Linas — Save the Date

A responsive static wedding website for **31 July 2027 in Vilnius, Lithuania**. It uses plain HTML, CSS, and JavaScript, so there is no build step and it can be hosted on any static hosting service.

## Preview locally

Open `index.html` directly in a browser, or run any simple static server from this directory (for example, VS Code's built-in preview or `python3 -m http.server 8000`).

## Connect the address form

A static website cannot store submissions by itself. The form is prepared for [Formspree](https://formspree.io/), which provides a submission endpoint while keeping this site fully static:

1. Create a Formspree form and choose the email address that should receive submissions.
2. Copy the form endpoint, which looks like `https://formspree.io/f/abcxyzde`.
3. In `index.html`, replace the `data-endpoint` value `https://formspree.io/f/YOUR_FORM_ID` with that endpoint.
4. Submit a test response and confirm that the first name, surname, and postal address arrive correctly.

Until the placeholder is replaced, the website deliberately does not attempt to submit personal data and displays a configuration message.

## Hosting

Upload the files in this directory to GitHub Pages, Netlify, Cloudflare Pages, or any standard web host. No install or build command is needed; publish the repository root.

## Privacy

Postal addresses are personal data. Limit access to the receiving inbox and Formspree account, keep the information only as long as needed for invitations, and publish a privacy notice suitable for your jurisdiction before collecting responses.
