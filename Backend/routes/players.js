const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const dataPath = path.join(__dirname, "../data/players.json");

function isAdminRoute(req) {
  return req.baseUrl.includes("/admin");
}

function getPlayers() {
  if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, "[]");
  }

  try {
    const data = fs.readFileSync(dataPath, "utf8");
    return JSON.parse(data || "[]");
  } catch {
    return [];
  }
}

function savePlayers(players) {
  fs.writeFileSync(dataPath, JSON.stringify(players, null, 2));
}

function isValidMcName(name) {
  return /^[a-zA-Z0-9_]{3,16}$/.test(name);
}

router.get("/", (req, res) => {
  if (!isAdminRoute(req)) {
    return res.status(403).json({
      error: "Không có quyền xem danh sách player"
    });
  }

  const players = getPlayers();
  res.json(players);
});

router.post("/register", (req, res) => {
  const { ingameName, facebookName, platform, note } = req.body;

  if (!ingameName || !facebookName || !platform) {
    return res.status(400).json({
      error: "Thiếu thông tin đăng ký"
    });
  }

  const cleanIngameName = String(ingameName).trim();
  const cleanFacebookName = String(facebookName).trim();
  const cleanPlatform = String(platform).trim();
  const cleanNote = note ? String(note).trim() : "";

  if (!isValidMcName(cleanIngameName)) {
    return res.status(400).json({
      error: "Tên Minecraft chỉ được gồm chữ, số, dấu _, dài 3-16 ký tự"
    });
  }

  if (cleanFacebookName.length < 2 || cleanFacebookName.length > 50) {
    return res.status(400).json({
      error: "Tên Facebook không hợp lệ"
    });
  }

  if (!["Java", "Bedrock", "PE", "Windows"].includes(cleanPlatform)) {
    return res.status(400).json({
      error: "Nền tảng không hợp lệ"
    });
  }

  if (cleanNote.length > 200) {
    return res.status(400).json({
      error: "Ghi chú quá dài"
    });
  }

  const players = getPlayers();

  const alreadyExists = players.find(player =>
    player.ingameName.toLowerCase() === cleanIngameName.toLowerCase()
  );

  if (alreadyExists) {
    return res.status(400).json({
      error: "Tên ingame này đã đăng ký rồi"
    });
  }

  const newPlayer = {
    id: Date.now(),
    ingameName: cleanIngameName,
    facebookName: cleanFacebookName,
    platform: cleanPlatform,
    note: cleanNote,
    createdAt: new Date().toISOString()
  };

  players.push(newPlayer);
  savePlayers(players);

  res.status(201).json({
    message: "Đăng ký thành công",
    player: newPlayer
  });
});

router.delete("/:id", (req, res) => {
  if (!isAdminRoute(req)) {
    return res.status(403).json({
      error: "Không có quyền xóa player"
    });
  }

  const id = Number(req.params.id);

  if (!Number.isFinite(id)) {
    return res.status(400).json({
      error: "ID không hợp lệ"
    });
  }

  let players = getPlayers();
  const oldLength = players.length;

  players = players.filter(player => player.id !== id);

  if (players.length === oldLength) {
    return res.status(404).json({
      error: "Không tìm thấy player"
    });
  }

  savePlayers(players);

  res.json({
    message: "Đã xoá player"
  });
});

module.exports = router;