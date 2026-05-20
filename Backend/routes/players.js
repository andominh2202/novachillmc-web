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

  const data = fs.readFileSync(dataPath, "utf8");
  return JSON.parse(data || "[]");
}

function savePlayers(players) {
  fs.writeFileSync(dataPath, JSON.stringify(players, null, 2));
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

router.post("/", (req, res) => {
  const { ingameName, facebookName, platform, note } = req.body;

  if (!ingameName || !facebookName || !platform) {
    return res.status(400).json({
      error: "Thiếu thông tin đăng ký"
    });
  }

  const cleanIngameName = ingameName.trim();
  const cleanFacebookName = facebookName.trim();
  const cleanPlatform = platform.trim();
  const cleanNote = note ? note.trim() : "";

  const players = getPlayers();

  const alreadyExists = players.find(player =>
    player.ingameName.toLowerCase() ===
    cleanIngameName.toLowerCase()
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

  res.status(201).json(newPlayer);
});

router.delete("/:id", (req, res) => {
  if (!isAdminRoute(req)) {
    return res.status(403).json({
      error: "Không có quyền xóa player"
    });
  }

  const id = Number(req.params.id);

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