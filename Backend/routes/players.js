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

router.get("/whitelist-pending", checkPluginToken, async (req, res) => {
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
      players: result.rows,
    });
  } catch (error) {
    console.error("Plugin whitelist-pending error:", error);
    res.status(500).json({
      error: "Không thể lấy danh sách whitelist pending",
    });
  }
});

router.post("/whitelist-synced", checkPluginToken, async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        error: "ids không hợp lệ",
      });
    }

    await pool.query(
      `
      UPDATE players
      SET whitelist_synced = true,
          whitelist_synced_at = NOW()
      WHERE id = ANY($1::bigint[])
      `,
      [ids],
    );

    res.json({
      success: true,
      synced: ids.length,
    });
  } catch (error) {
    console.error("Plugin whitelist-synced error:", error);
    res.status(500).json({
      error: "Không thể cập nhật whitelist synced",
    });
  }
});

module.exports = router;