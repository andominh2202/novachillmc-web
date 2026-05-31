const express = require("express");
const pool = require("../config/database");

const router = express.Router();

function checkPluginToken(req, res, next) {
  const token = req.headers["x-plugin-token"];

  if (!process.env.PLUGIN_TOKEN) {
    return res.status(500).json({
      error: "Backend chưa cấu hình PLUGIN_TOKEN",
    });
  }

  if (!token || token !== process.env.PLUGIN_TOKEN) {
    return res.status(401).json({
      error: "Plugin token không hợp lệ",
    });
  }

  next();
}

// Plugin lấy danh sách người đã duyệt nhưng chưa sync whitelist
router.get("/whitelist/jobs", checkPluginToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, ingame_name
      FROM players
      WHERE status = 'approved'
        AND (whitelist_synced = false OR whitelist_synced IS NULL)
      ORDER BY reviewed_at ASC NULLS LAST, created_at ASC
      LIMIT 20
    `);

    res.json({
      jobs: result.rows.map((player) => ({
        id: String(player.id),
        player: player.ingame_name,
        username: player.ingame_name,
        name: player.ingame_name,
        playerName: player.ingame_name,
        ingameName: player.ingame_name,
        action: "ADD",
      })),
    });
  } catch (error) {
    console.error("Plugin whitelist jobs error:", error);
    res.status(500).json({
      error: "Không thể lấy whitelist jobs",
    });
  }
});

// Plugin báo đã add whitelist xong
router.post("/whitelist/jobs/complete", checkPluginToken, async (req, res) => {
  try {
    console.log("=================================");
    console.log("WHITELIST COMPLETE CALLED");
    console.log("BODY:", JSON.stringify(req.body, null, 2));
    console.log("=================================");

    const ids =
      req.body.ids ||
      req.body.jobIds ||
      req.body.completedIds ||
      req.body.jobs ||
      [];

    if (!Array.isArray(ids) || ids.length === 0) {
      console.log("Không tìm thấy ids hợp lệ");

      return res.status(400).json({
        error: "ids không hợp lệ",
        received: req.body,
      });
    }

    console.log("SYNC IDS:", ids);

    await pool.query(
      `
      UPDATE players
      SET whitelist_synced = true,
          whitelist_synced_at = NOW()
      WHERE id = ANY($1::bigint[])
      `,
      [ids]
    );

    console.log("Đã sync thành công", ids.length, "player(s)");

    res.json({
      success: true,
      synced: ids.length,
    });
  } catch (error) {
    console.error("Plugin whitelist complete error:", error);

    res.status(500).json({
      error: "Không thể cập nhật whitelist synced",
      details: error.message,
    });
  }
});

module.exports = router;