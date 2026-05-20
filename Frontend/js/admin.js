const totalPlayers = document.getElementById("totalPlayers");
const playerList = document.getElementById("playerList");
const addPlayerForm = document.getElementById("addPlayerForm");

/*
 ADMIN LOGIN
*/

const ADMIN_KEY = prompt("Nhập mật khẩu admin:");

if (!ADMIN_KEY) {

  document.body.innerHTML = `
    <div style="
      display:flex;
      justify-content:center;
      align-items:center;
      height:100vh;
      background:#020712;
      color:white;
      font-size:32px;
      font-weight:900;
      font-family:sans-serif;
    ">
      Không có quyền truy cập
    </div>
  `;

  throw new Error("No admin key");
}

/*
 ESCAPE HTML
*/

function escapeHtml(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/*
 LOAD PLAYERS
*/

async function loadPlayers() {

  try {

    const response = await fetch(
      `${APP_CONFIG.API_URL}/admin/players`,
      {
        headers: {
          "x-admin-key": ADMIN_KEY
        }
      }
    );

    const players = await response.json();

    if (!response.ok) {

      throw new Error(
        players.error ||
        "Không tải được danh sách player"
      );

    }

    renderPlayers(players);

  } catch (error) {

    playerList.innerHTML = `
      <div class="empty">
        ${escapeHtml(error.message)}
      </div>
    `;

    totalPlayers.textContent = "0";
  }
}

/*
 RENDER PLAYERS
*/

function renderPlayers(players) {

  totalPlayers.textContent =
    players.length;

  if (players.length === 0) {

    playerList.innerHTML = `
      <div class="empty">
        Chưa có player nào.
      </div>
    `;

    return;
  }

  playerList.innerHTML =
    players.map(player => `

      <div class="player-item">

        <div>

          <h3>
            ${escapeHtml(player.ingameName)}
          </h3>

          <p>
            <b>Facebook:</b>
            ${escapeHtml(player.facebookName)}
          </p>

          <p>
            <b>Nền tảng:</b>
            ${escapeHtml(player.platform)}
          </p>

          <p>
            <b>Ghi chú:</b>
            ${escapeHtml(player.note || "Không có")}
          </p>

          <p>
            <b>Ngày đăng ký:</b>
            ${escapeHtml(
              formatDate(player.createdAt)
            )}
          </p>

        </div>

        <button
          class="delete-btn"
          onclick="deletePlayer(${player.id})">

          Xóa

        </button>

      </div>

    `).join("");
}

/*
 DELETE PLAYER
*/

async function deletePlayer(id) {

  const confirmDelete =
    confirm("Xóa player này nha?");

  if (!confirmDelete) return;

  try {

    const response = await fetch(
      `${APP_CONFIG.API_URL}/admin/players/${id}`,
      {
        method: "DELETE",

        headers: {
          "x-admin-key": ADMIN_KEY
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {

      throw new Error(
        data.error ||
        "Không xóa được player"
      );

    }

    await loadPlayers();

  } catch (error) {

    alert(error.message);

  }
}

/*
 ADD PLAYER
*/

addPlayerForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    const player = {

      ingameName:
        document.getElementById("adminIngame")
        .value
        .trim(),

      facebookName:
        document.getElementById("adminFacebook")
        .value
        .trim(),

      platform:
        document.getElementById("adminPlatform")
        .value,

      note:
        document.getElementById("adminNote")
        .value
        .trim()

    };

    try {

      const response = await fetch(
        `${APP_CONFIG.API_URL}/admin/players`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            "x-admin-key": ADMIN_KEY
          },

          body: JSON.stringify(player)
        }
      );

      const data = await response.json();

      if (!response.ok) {

        throw new Error(
          data.error ||
          "Không thêm được player"
        );

      }

      addPlayerForm.reset();

      await loadPlayers();

    } catch (error) {

      alert(error.message);

    }

  }
);

/*
 FORMAT DATE
*/

function formatDate(dateString) {

  if (!dateString)
    return "Không rõ";

  const date =
    new Date(dateString);

  if (
    Number.isNaN(date.getTime())
  ) {

    return dateString;

  }

  return date.toLocaleString("vi-VN");
}

loadPlayers();