const totalPlayers = document.getElementById("totalPlayers");
const playerList = document.getElementById("playerList");
const addPlayerForm = document.getElementById("addPlayerForm");

const adminModal = document.getElementById("admin-modal");
const adminPassword = document.getElementById("admin-password");
const adminLoginBtn = document.getElementById("admin-login-btn");

const searchInput = document.getElementById("searchInput");
const platformFilter = document.getElementById("platformFilter");
const statusFilter = document.getElementById("statusFilter");
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

const pageSizeSelect = document.getElementById("pageSize");
const prevPageBtn = document.getElementById("prevPage");
const nextPageBtn = document.getElementById("nextPage");
const currentPageText = document.getElementById("currentPage");

let ADMIN_KEY = "";
let CURRENT_PLAYERS = [];
let currentPage = 1;
let searchTimeout;

/* ADMIN LOGIN */

function lockAdminPage() {
  addPlayerForm.style.display = "none";
  playerList.innerHTML = `
    <tr>
      <td colspan="9" class="empty-row">
        Vui lòng nhập admin key để xem danh sách player.
      </td>
    </tr>
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
  if (event.key === "Enter") adminLoginBtn.click();
});

/* HELPERS */

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildQueryString() {
  const params = new URLSearchParams();

  if (searchInput.value.trim()) params.set("search", searchInput.value.trim());
  if (platformFilter.value) params.set("platform", platformFilter.value);
  if (statusFilter && statusFilter.value) params.set("status", statusFilter.value);
  if (fromDate.value) params.set("from", fromDate.value);
  if (toDate.value) params.set("to", toDate.value);
  if (sortSelect.value) params.set("sort", sortSelect.value);

  const query = params.toString();
  return query ? `?${query}` : "";
}

function formatPlatform(platform) {
  if (platform === "Java") return "PC / Java";
  if (platform === "Bedrock") return "PE / Bedrock";
  return platform || "Không rõ";
}

function normalizePlatformForForm(platform) {
  if (platform === "Java" || platform === "PC" || platform === "Windows") return "Java";
  if (platform === "Bedrock" || platform === "PE") return "Bedrock";
  return "Bedrock";
}

function formatDate(dateString) {
  if (!dateString) return "Không rõ";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleString("vi-VN");
}

function formatStatus(status) {
  const map = {
    pending: "Chờ duyệt",
    approved: "Đã duyệt",
    rejected: "Từ chối",
    blacklisted: "Blacklist"
  };

  return map[status] || "Chờ duyệt";
}

function getStatusClass(status) {
  const value = ["pending", "approved", "rejected", "blacklisted"].includes(status)
    ? status
    : "pending";

  return `status-pill status-${value}`;
}

function getWhitelistCommand(player) {
  return `whitelist add ${player.ingameName}`;
}

function copyText(text) {
  navigator.clipboard.writeText(text)
    .then(() => alert("Đã copy lệnh whitelist"))
    .catch(() => prompt("Copy lệnh này:", text));
}

/* LOAD */

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
    currentPage = 1;
    renderPlayers();
  } catch (error) {
    adminModal.style.display = "flex";
    totalPlayers.textContent = "0";

    playerList.innerHTML = `
      <tr>
        <td colspan="9" class="empty-row">
          ${escapeHtml(error.message)}
        </td>
      </tr>
    `;
  }
}

/* RENDER */

function getPaginatedPlayers() {
  const pageSize = Number(pageSizeSelect.value || 10);
  const start = (currentPage - 1) * pageSize;
  return CURRENT_PLAYERS.slice(start, start + pageSize);
}

function renderPlayers() {
  totalPlayers.textContent = CURRENT_PLAYERS.length;

  const pageSize = Number(pageSizeSelect.value || 10);
  const totalPages = Math.max(1, Math.ceil(CURRENT_PLAYERS.length / pageSize));

  if (currentPage > totalPages) currentPage = totalPages;

  currentPageText.textContent = currentPage;
  prevPageBtn.disabled = currentPage <= 1;
  nextPageBtn.disabled = currentPage >= totalPages;

  const players = getPaginatedPlayers();

  if (players.length === 0) {
    playerList.innerHTML = `
      <tr>
        <td colspan="9" class="empty-row">
          Không tìm thấy player nào.
        </td>
      </tr>
    `;
    return;
  }

  const offset = (currentPage - 1) * pageSize;

  playerList.innerHTML = players.map((player, index) => {
    const command = getWhitelistCommand(player);
    const status = player.status || "pending";

    return `
      <tr>
        <td>${offset + index + 1}</td>
        <td>
          <span class="player-name">
            ${escapeHtml(player.ingameName)}
          </span>
        </td>
        <td>${escapeHtml(player.facebookName)}</td>
        <td>
          <span class="platform-pill">
            ${escapeHtml(formatPlatform(player.platform))}
          </span>
        </td>
        <td>
          <span class="${player.note ? "" : "note-muted"}">
            ${escapeHtml(player.note || "Không có")}
          </span>
          ${player.adminNote ? `<div class="admin-note">Admin: ${escapeHtml(player.adminNote)}</div>` : ""}
        </td>
        <td>
          <span class="${getStatusClass(status)}">
            ${escapeHtml(formatStatus(status))}
          </span>
        </td>
        <td>
          ${status === "approved" ? `
            <button class="copy-command-btn" onclick="copyText('${escapeHtml(command)}')">
              ${escapeHtml(command)}
            </button>
          ` : `<span class="note-muted">Chưa duyệt</span>`}
        </td>
        <td>${escapeHtml(formatDate(player.createdAt))}</td>
        <td>
          <div class="player-actions">
            ${status !== "approved" ? `
              <button class="approve-btn" onclick="updatePlayerStatus(${player.id}, 'approved')">
                ✓ Duyệt
              </button>
            ` : ""}
            ${status !== "rejected" ? `
              <button class="reject-btn" onclick="updatePlayerStatus(${player.id}, 'rejected')">
                ✕ Từ chối
              </button>
            ` : ""}
            ${status !== "blacklisted" ? `
              <button class="blacklist-btn" onclick="updatePlayerStatus(${player.id}, 'blacklisted')">
                ⚠ Blacklist
              </button>
            ` : ""}
            <button class="edit-btn" onclick="openEditPlayer(${player.id})">
              ✎ Sửa
            </button>
            <button class="delete-btn" onclick="deletePlayer(${player.id})">
              🗑 Xóa
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

/* FILTER */

filterBtn.addEventListener("click", loadPlayers);

resetFilterBtn.addEventListener("click", async () => {
  searchInput.value = "";
  platformFilter.value = "";
  if (statusFilter) statusFilter.value = "";
  fromDate.value = "";
  toDate.value = "";
  sortSelect.value = "newest";
  await loadPlayers();
});

searchInput.addEventListener("input", () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(loadPlayers, 350);
});

platformFilter.addEventListener("change", loadPlayers);
if (statusFilter) statusFilter.addEventListener("change", loadPlayers);
sortSelect.addEventListener("change", loadPlayers);

pageSizeSelect.addEventListener("change", () => {
  currentPage = 1;
  renderPlayers();
});

prevPageBtn.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    renderPlayers();
  }
});

nextPageBtn.addEventListener("click", () => {
  const pageSize = Number(pageSizeSelect.value || 10);
  const totalPages = Math.max(1, Math.ceil(CURRENT_PLAYERS.length / pageSize));

  if (currentPage < totalPages) {
    currentPage++;
    renderPlayers();
  }
});

/* ADD PLAYER */

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

/* STATUS */

async function updatePlayerStatus(id, status) {
  const label = formatStatus(status);
  const adminNote = prompt(`Ghi chú cho trạng thái "${label}". Có thể bỏ trống:`) || "";

  try {
    const response = await fetch(`${APP_CONFIG.API_URL}/admin/players/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": ADMIN_KEY
      },
      body: JSON.stringify({
        status,
        adminNote
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Không cập nhật được trạng thái");
    }

    if (data.command) {
      prompt("Copy lệnh này rồi dán vào console server:", data.command);
    } else if (status === "blacklisted") {
      prompt("Nên chạy thêm lệnh này trong console server:", `whitelist remove ${data.player.ingameName}`);
    }

    await loadPlayers();
  } catch (error) {
    alert(error.message);
  }
}

/* EDIT */

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

editModal.addEventListener("click", event => {
  if (event.target === editModal) closeEditModal();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeEditModal();
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

/* DELETE */

async function deletePlayer(id) {
  const player = CURRENT_PLAYERS.find(item => Number(item.id) === Number(id));
  const name = player ? player.ingameName : `ID ${id}`;

  if (!confirm(`Xóa player ${name}?`)) return;

  try {
    const response = await fetch(`${APP_CONFIG.API_URL}/admin/players/${id}`, {
      method: "DELETE",
      headers: {
        "x-admin-key": ADMIN_KEY
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Không xoá được player");
    }

    await loadPlayers();
  } catch (error) {
    alert(error.message);
  }
}

lockAdminPage();
