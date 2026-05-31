console.log("NovaChillMC Rules Loaded ✨");

/* hover glow nhẹ */

const cards = document.querySelectorAll(".rule-card");

cards.forEach(card => {

  card.addEventListener("mousemove", e => {

    const rect = card.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    card.style.background = `
      radial-gradient(
        circle at ${x}px ${y}px,
        rgba(59,130,246,.18),
        rgba(15,23,42,.96) 45%
      )
    `;
  });

  card.addEventListener("mouseleave", () => {

    card.style.background = `
      linear-gradient(
        180deg,
        rgba(15,23,42,.95),
        rgba(9,14,28,.95)
      )
    `;
  });

});