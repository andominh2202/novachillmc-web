document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  const formMessage = document.getElementById("formMessage");

  console.log("register.js loaded");

  if (!form || !formMessage) {
    console.error("Không tìm thấy registerForm hoặc formMessage");
    return;
  }

  function showMessage(text, type) {
    formMessage.textContent = text;
    formMessage.className = "";

    formMessage.classList.add(`${type}-message`);

    formMessage.style.display = "block";
    formMessage.style.marginTop = "18px";
    formMessage.style.padding = "14px 16px";
    formMessage.style.borderRadius = "14px";
    formMessage.style.fontWeight = "900";
    formMessage.style.textAlign = "center";

    if (type === "success") {
      formMessage.style.color = "#20e3ff";
      formMessage.style.background = "rgba(32, 227, 255, 0.12)";
      formMessage.style.border = "1px solid rgba(32, 227, 255, 0.35)";
    }

    if (type === "error") {
      formMessage.style.color = "#ff8fa0";
      formMessage.style.background = "rgba(255, 72, 100, 0.12)";
      formMessage.style.border = "1px solid rgba(255, 72, 100, 0.35)";
    }

    if (type === "info") {
      formMessage.style.color = "#d9e9ff";
      formMessage.style.background = "rgba(255, 255, 255, 0.08)";
      formMessage.style.border = "1px solid rgba(255, 255, 255, 0.14)";
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    console.log("submit clicked");

    showMessage("Đang gửi đăng ký...", "info");

    const player = {
      ingameName: document.getElementById("ingameName").value.trim(),
      facebookName: document.getElementById("facebookName").value.trim(),
      platform: document.getElementById("platform").value,
      note: document.getElementById("note").value.trim()
    };

    if (!player.ingameName || !player.facebookName || !player.platform) {
      showMessage("Cậu nhập thiếu thông tin rồi.", "error");
      return;
    }

    try {
      if (!window.APP_CONFIG || !APP_CONFIG.API_URL) {
        throw new Error("Chưa cấu hình APP_CONFIG.API_URL");
      }

      const response = await fetch(`${APP_CONFIG.API_URL}/players`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(player)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Đăng ký thất bại");
      }

      form.reset();

      showMessage("Bạn đã đăng ký thành công!", "success");

      console.log("success", data);

    } catch (error) {
      showMessage(error.message, "error");
      console.error("register error:", error);
    }
  });
});
