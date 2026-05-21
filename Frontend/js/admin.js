const totalPlayers = document.getElementById("totalPlayers");
const playerList = document.getElementById("playerList");
const addPlayerForm = document.getElementById("addPlayerForm");

const adminModal = document.getElementById("admin-modal");
const adminPassword = document.getElementById("admin-password");
const adminLoginBtn = document.getElementById("admin-login-btn");

const searchInput = document.getElementById("searchInput");
const platformFilter = document.getElementById("platformFilter");
const fromDate = document.getElementById("fromDate");
const toDate = document.getElementById("toDate");
const sortSelect = document.getElementById("sortSelect");
const filterBtn = document.getElementById("filterBtn");
const resetFilterBtn = document.getElementById("resetFilterBtn");

const editModal = document.getElementById("edit-modal");
const editPlayerForm = document.getElementById("editPlayerForm");
const editPlayerId = document.getElementById("editPlayerId");
const editIngame = document.getElementById("editIngame");
const editFacebook = document.getElementById("editFacebook");
const editPlatform = document.getElementById("editPlatform");
const editNote = document.getElementById("editNote");
const closeEditBtn = document.getElementById("closeEditBtn");

let ADMIN_KEY = "";
let CURRENT_PLAYERS = [];

/*
  ADMIN LOGIN MODAL
*/

function lockAdminPage() {
  addPlayerForm.style.display = "none";
  playerList.innerHTML = `
    <div class="empty">
      Vui lòng nhập admin key để xem danh sách player.
    </div>
  `;
}

function unlockAdminPage() {
  adminModal.style.display = "none";
  addPlayerForm.style.display = "";
}

adminLoginBtn.addEventListener("click", async () => {
  const key = adminPassword.value.trim();

  if (!key) {
    alert("Nhập admin key đã cậu ơi 😭");
    adminPassword.focus();
    return;
  }

  ADMIN_KEY = key;
  unlockAdminPage();
  await loadPlayers();
});

adminPassword.addEventListener("keydown", async (event) => {
  if (event.key === "Enter") {
    adminLoginBtn.click();
  }
});

/*
 ESCAPE HTML
*/

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/*
 QUERY FILTERS
*/

function buildQueryString() {
  const params = new URLSearchParams();

  const search = searchInput.value.trim();
  const platform = platformFilter.value;
  const from = fromDate.value;
  const to = toDate.value;
  const sort = sortSelect.value || "newest";

  if (search) params.set("search", search);
  if (platform) params.set("platform", platform);
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  if (sort) params.set("sort", sort);

  const query = params.toString();
  return query ? `?${query}` : "";
}

/*
 LOAD PLAYERS
*/

async function loadPlayers() {
  try {
    const response = await fetch(
      `${APP_CONFIG.API_URL}/admin/players${buildQueryString()}`,
      {
        headers: {
          "x-admin-key": ADMIN_KEY
        }
      }
    );

    const players = await response.json();

    if (!response.ok) {
      throw new Error(players.error || "Không tải được danh sách player");
    }

    CURRENT_PLAYERS = players;
    renderPlayers(players);
  } catch (error) {
    adminModal.style.display = "flex";

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
  totalPlayers.textContent = players.length;

  if (players.length === 0) {
    playerList.innerHTML = `
      <div class="empty">
        Không tìm thấy player nào.
      </div>
    `;
    return;
  }

  playerList.innerHTML = players.map(player => `
    <div class="player-item">
      <div>
        <h3>${escapeHtml(player.ingameName)}</h3>

        <p>
          <b>Facebook:</b>
          ${escapeHtml(player.facebookName)}
        </p>

        <p>
          <b>Nền tảng:</b>
          ${escapeHtml(formatPlatform(player.platform))}
        </p>

        <p>
          <b>Ghi chú:</b>
          ${escapeHtml(player.note || "Không có")}
        </p>

        <p>
          <b>Ngày đăng ký:</b>
          ${escapeHtml(formatDate(player.createdAt))}
        </p>
      </div>

      <div class="player-actions">
        <button
          class="edit-btn"
          onclick="openEditPlayer(${player.id})">
          Sửa
        </button>

        <button
          class="delete-btn"
          onclick="deletePlayer(${player.id})">
          Xóa
        </button>
      </div>
    </div>
  `).join("");
}

/*
 FILTER EVENTS
*/

filterBtn.addEventListener("click", async () => {
  await loadPlayers();
});

resetFilterBtn.addEventListener("click", async () => {
  searchInput.value = "";
  platformFilter.value = "";
  fromDate.value = "";
  toDate.value = "";
  sortSelect.value = "newest";

  await loadPlayers();
});

searchInput.addEventListener("keydown", async (event) => {
  if (event.key === "Enter") {
    await loadPlayers();
  }
});

/*
 DELETE PLAYER
*/

async function deletePlayer(id) {
  const confirmDelete = confirm("Xóa player này nha?");

  if (!confirmDelete) return;

  try {
    const response = await fetch(`${APP_CONFIG.API_URL}/admin/players/${id}`, {
      method: "DELETE",
      headers: {
        "x-admin-key": ADMIN_KEY
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Không xóa được player");
    }

    await loadPlayers();
  } catch (error) {
    alert(error.message);
  }
}

/*
 ADD PLAYER
*/

addPlayerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const player = {
    ingameName: document.getElementById("adminIngame").value.trim(),
    facebookName: document.getElementById("adminFacebook").value.trim(),
    platform: document.getElementById("adminPlatform").value,
    note: document.getElementById("adminNote").value.trim()
  };

  try {
    const response = await fetch(`${APP_CONFIG.API_URL}/admin/players/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": ADMIN_KEY
      },
      body: JSON.stringify(player)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Không thêm được player");
    }

    addPlayerForm.reset();
    await loadPlayers();
  } catch (error) {
    alert(error.message);
  }
});

/*
 EDIT PLAYER
*/

function openEditPlayer(id) {
  const player = CURRENT_PLAYERS.find(item => Number(item.id) === Number(id));

  if (!player) {
    alert("Không tìm thấy player để sửa");
    return;
  }

  editPlayerId.value = player.id;
  editIngame.value = player.ingameName || "";
  editFacebook.value = player.facebookName || "";
  editPlatform.value = normalizePlatformForForm(player.platform);
  editNote.value = player.note || "";

  editModal.style.display = "flex";
}

function closeEditModal() {
  editModal.style.display = "none";
  editPlayerForm.reset();
}

closeEditBtn.addEventListener("click", closeEditModal);

editModal.addEventListener("click", (event) => {
  if (event.target === editModal) {
    closeEditModal();
  }
});

editPlayerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const id = editPlayerId.value;

  const player = {
    ingameName: editIngame.value.trim(),
    facebookName: editFacebook.value.trim(),
    platform: editPlatform.value,
    note: editNote.value.trim()
  };

  try {
    const response = await fetch(`${APP_CONFIG.API_URL}/admin/players/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": ADMIN_KEY
      },
      body: JSON.stringify(player)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Không sửa được player");
    }

    closeEditModal();
    await loadPlayers();
  } catch (error) {
    alert(error.message);
  }
});

/*
 HELPERS
*/

function normalizePlatformForForm(platform) {
  if (platform === "Java" || platform === "PC" || platform === "Windows") {
    return "Java";
  }

  if (platform === "Bedrock" || platform === "PE") {
    return "Bedrock";
  }

  return "Bedrock";
}

function formatPlatform(platform) {
  if (platform === "Java") return "PC / Java";
  if (platform === "Bedrock") return "PE / Bedrock";
  return platform || "Không rõ";
}

function formatDate(dateString) {
  if (!dateString) return "Không rõ";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleString("vi-VN");
}

lockAdminPage();
adminPassword.focus();