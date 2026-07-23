// ---- Countdown to the wedding date ----
// Wedding date: July 31, 2027, Vilnius, Lithuania (EEST, UTC+3)
const WEDDING_DATE = new Date("2027-07-31T15:00:00+03:00");

const els = {
  days: document.getElementById("cd-days"),
  hours: document.getElementById("cd-hours"),
  minutes: document.getElementById("cd-minutes"),
  seconds: document.getElementById("cd-seconds"),
};

function updateCountdown() {
  const now = new Date();
  let diff = WEDDING_DATE.getTime() - now.getTime();

  if (diff <= 0) {
    els.days.textContent = "0";
    els.hours.textContent = "0";
    els.minutes.textContent = "0";
    els.seconds.textContent = "0";
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  diff -= days * (1000 * 60 * 60 * 24);
  const hours = Math.floor(diff / (1000 * 60 * 60));
  diff -= hours * (1000 * 60 * 60);
  const minutes = Math.floor(diff / (1000 * 60));
  diff -= minutes * (1000 * 60);
  const seconds = Math.floor(diff / 1000);

  els.days.textContent = String(days);
  els.hours.textContent = String(hours);
  els.minutes.textContent = String(minutes);
  els.seconds.textContent = String(seconds);
}

if (els.days) {
  updateCountdown();
  setInterval(updateCountdown, 1000);
}

// ---- RSVP form submission (Formspree via fetch, no page reload) ----
const form = document.getElementById("rsvp-form");
const successBox = document.getElementById("form-success");
const errorBox = document.getElementById("form-error");

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitBtn = form.querySelector(".submit-btn");
    const btnText = submitBtn.querySelector(".btn-text");
    submitBtn.disabled = true;
    const originalText = btnText.textContent;
    btnText.textContent = "Sending";

    errorBox.hidden = true;

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });

      if (response.ok) {
        form.hidden = true;
        successBox.hidden = false;
      } else {
        throw new Error("Form submission failed");
      }
    } catch (err) {
      errorBox.hidden = false;
      submitBtn.disabled = false;
      btnText.textContent = originalText;
    }
  });
}
