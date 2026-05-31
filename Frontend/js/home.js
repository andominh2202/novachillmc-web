const serverIp = document.getElementById("serverIp");
const copyIpBtn = document.getElementById("copyIpBtn");

if (serverIp) {
  serverIp.textContent = APP_CONFIG.SERVER_IP;
}

if (copyIpBtn) {
  copyIpBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(APP_CONFIG.SERVER_IP);
      copyIpBtn.textContent = "✓ Đã copy";
      setTimeout(() => {
        copyIpBtn.textContent = "⧉ Copy IP";
      }, 1300);
    } catch (error) {
      alert("Copy lỗi rồi, IP là: " + APP_CONFIG.SERVER_IP);
    }
  });
}

const galleryImages = document.querySelectorAll(".gallery-grid img");

galleryImages.forEach((image) => {
  image.addEventListener("click", () => {
    const overlay = document.createElement("div");
    overlay.className = "image-popup";

    overlay.innerHTML = `
      <div class="popup-backdrop"></div>
      <img src="${image.src}" class="popup-image" alt="${image.alt || "NovaChillMC image"}">
      <button class="popup-close" type="button" aria-label="Đóng ảnh">✕</button>
    `;

    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";

    const handleEsc = (event) => {
      if (event.key === "Escape") {
        closePopup();
      }
    };

    const closePopup = () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
      overlay.remove();
    };

    document.addEventListener("keydown", handleEsc);

    overlay.querySelector(".popup-backdrop").addEventListener("click", closePopup);
    overlay.querySelector(".popup-close").addEventListener("click", closePopup);
  });
});
