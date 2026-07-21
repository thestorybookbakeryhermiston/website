/* The Storybook Bakery shared behavior: mobile nav, gallery lightbox, contact form */

document.addEventListener("DOMContentLoaded", function () {
  /* ---------- Mobile navigation toggle ---------- */

  var navToggle = document.querySelector(".nav-toggle");
  var navLinks = document.querySelector(".nav-links");

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", function () {
      var isOpen = navLinks.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  }

  /* ---------- Gallery lightbox ---------- */

  var lightbox = document.querySelector(".lightbox");

  if (lightbox) {
    var lightboxImg = lightbox.querySelector("img");
    var lightboxClose = lightbox.querySelector(".lightbox-close");
    var lastFocused = null;

    function openLightbox(src, alt) {
      lastFocused = document.activeElement;
      lightboxImg.src = src;
      lightboxImg.alt = alt || "";
      lightbox.classList.add("open");
      lightboxClose.focus();
    }

    function closeLightbox() {
      lightbox.classList.remove("open");
      lightboxImg.src = "";
      if (lastFocused) {
        lastFocused.focus();
      }
    }

    document.querySelectorAll(".gallery-tile").forEach(function (tile) {
      tile.addEventListener("click", function () {
        // Placeholder tiles have no image yet; the lightbox only opens
        // once real photos are dropped into the tiles.
        var img = tile.querySelector("img");
        if (img) {
          openLightbox(img.src, img.alt);
        }
      });
    });

    lightboxClose.addEventListener("click", closeLightbox);

    lightbox.addEventListener("click", function (event) {
      if (event.target === lightbox) {
        closeLightbox();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && lightbox.classList.contains("open")) {
        closeLightbox();
      }
    });
  }

  /* ---------- Contact form (Netlify Forms via AJAX) ---------- */

  var contactForm = document.querySelector(".contact-form");

  if (contactForm) {
    var successMessage = document.querySelector(".form-message.success");
    var errorMessage = document.querySelector(".form-message.error");

    // Inline validation: we take over from the browser's submit-time bubbles.
    // Without JS the form keeps native validation, so only disable it here.
    contactForm.setAttribute("novalidate", "");

    var friendlyMessages = {
      name: "Please enter your name.",
      email: "Please enter a valid email address, like name@example.com.",
      "inquiry-type": "Please choose what we can help with.",
      message: "Please enter a message so we know what you need."
    };

    function messageFor(field) {
      if (!field.validity.valid) {
        return friendlyMessages[field.name] || field.validationMessage;
      }
      return "";
    }

    function errorElementFor(field) {
      var wrapper = field.closest(".form-field");
      if (!wrapper) {
        return null;
      }
      var el = wrapper.querySelector(".field-error");
      if (!el) {
        el = document.createElement("p");
        el.className = "field-error";
        el.id = field.id + "-error";
        wrapper.appendChild(el);
      }
      return el;
    }

    function showFieldState(field) {
      var el = errorElementFor(field);
      if (!el) {
        return;
      }
      var message = messageFor(field);
      if (message) {
        field.classList.add("invalid");
        field.setAttribute("aria-invalid", "true");
        field.setAttribute("aria-describedby", el.id);
        el.textContent = message;
        el.classList.add("visible");
      } else {
        field.classList.remove("invalid");
        field.removeAttribute("aria-invalid");
        field.removeAttribute("aria-describedby");
        el.textContent = "";
        el.classList.remove("visible");
      }
    }

    // The pickup date only matters when someone is asking for product,
    // so it stays hidden for wholesale and general questions.
    var inquiryType = contactForm.querySelector("#inquiry-type");
    var dateField = contactForm.querySelector("#event-date-field");

    if (inquiryType && dateField) {
      inquiryType.addEventListener("change", function () {
        var wantsDate = inquiryType.value === "Order Request" || inquiryType.value === "Dry Mix Inquiry";
        dateField.hidden = !wantsDate;
        if (!wantsDate) {
          dateField.querySelector("input").value = "";
        }
      });
    }

    var fields = contactForm.querySelectorAll("input:not([type='hidden']), select, textarea");

    fields.forEach(function (field) {
      // Validate when the user leaves a field; once a field has shown an
      // error, re-check on every keystroke so the message clears promptly.
      field.addEventListener("blur", function () {
        if (field.value !== "" || field.required) {
          showFieldState(field);
        }
      });

      field.addEventListener("input", function () {
        if (field.classList.contains("invalid")) {
          showFieldState(field);
        }
      });
    });

    contactForm.addEventListener("submit", function (event) {
      event.preventDefault();

      if (!contactForm.checkValidity()) {
        var firstInvalid = null;
        fields.forEach(function (field) {
          showFieldState(field);
          if (!firstInvalid && !field.validity.valid) {
            firstInvalid = field;
          }
        });
        if (firstInvalid) {
          firstInvalid.focus();
        }
        return;
      }

      successMessage.classList.remove("visible");
      errorMessage.classList.remove("visible");

      var submitButton = contactForm.querySelector("button[type='submit']");
      submitButton.disabled = true;
      submitButton.textContent = "Sending…";

      fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(new FormData(contactForm)).toString()
      })
        .then(function (response) {
          if (!response.ok) {
            throw new Error("Submission failed");
          }
          contactForm.reset();
          contactForm.style.display = "none";
          successMessage.classList.add("visible");
          successMessage.focus();
        })
        .catch(function () {
          errorMessage.classList.add("visible");
        })
        .finally(function () {
          submitButton.disabled = false;
          submitButton.textContent = "Send My Request";
        });
    });
  }
});
