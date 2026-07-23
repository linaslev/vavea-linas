const weddingDate = new Date("2027-07-31T00:00:00+03:00");
const dayAfterWedding = new Date("2027-08-01T00:00:00+03:00");
const countdownIds = ["days", "hours", "minutes", "seconds"];

function updateCountdown() {
  const remaining = weddingDate.getTime() - Date.now();

  if (remaining <= 0) {
    document.getElementById("countdown-title").textContent = Date.now() < dayAfterWedding.getTime()
      ? "Today is the day"
      : "A day to remember";
    countdownIds.forEach((id) => {
      document.getElementById(id).textContent = "00";
    });
    return;
  }

  const units = [
    Math.floor(remaining / 86_400_000),
    Math.floor((remaining / 3_600_000) % 24),
    Math.floor((remaining / 60_000) % 60),
    Math.floor((remaining / 1_000) % 60),
  ];

  countdownIds.forEach((id, index) => {
    const value = units[index];
    document.getElementById(id).textContent = index === 0 ? String(value) : String(value).padStart(2, "0");
  });
}

updateCountdown();
setInterval(updateCountdown, 1_000);

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 },
);

document.querySelectorAll(".reveal").forEach((element, index) => {
  if (element.closest(".hero")) {
    element.style.transitionDelay = `${index * 120}ms`;
  }
  revealObserver.observe(element);
});

const form = document.getElementById("address-form");
const formMessage = document.getElementById("form-message");
const submitButton = form.querySelector("button[type='submit']");
const formEndpoint = form.dataset.endpoint;

function showMessage(message, type) {
  formMessage.textContent = message;
  formMessage.className = `form-message visible ${type}`;
  formMessage.focus();
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!form.reportValidity()) return;

  if (!formEndpoint || formEndpoint.includes("YOUR_FORM_ID")) {
    showMessage("This form is awaiting its secure submission connection. Please contact Vavea and Linas directly for now.", "error");
    return;
  }

  submitButton.disabled = true;
  submitButton.querySelector("span").textContent = "Sending…";

  try {
    const response = await fetch(formEndpoint, {
      method: "POST",
      body: new FormData(form),
      headers: { Accept: "application/json" },
    });

    if (!response.ok) throw new Error("Submission failed");

    form.reset();
    showMessage("Thank you! Your details are safely on their way to us.", "success");
  } catch {
    showMessage("We couldn't send your details just now. Please try again in a moment.", "error");
  } finally {
    submitButton.disabled = false;
    submitButton.querySelector("span").textContent = "Send my details";
  }
});
