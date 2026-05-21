const express = require("express");
const pool = require("../config/database");

const router = express.Router();

function isAdminRoute(req) {
  return req.baseUrl.includes("/admin");
}

function isValidMcName(name) {
  return /^[a-zA-Z0-9_]{3,16}$/.test(name);
}

function normalizePlatform(platform) {
  const value = String(platform || "").trim();

  if (["Java", "PC", "Windows"].includes(value)) return "Java";
  if (["Bedrock", "PE"].includes(value)) return "Bedrock";

  return null;
}

function mapPlayer(row) {
  return {
    id: Number(row.id),
    ingameName: row.ingame_name,
    facebookName: row.facebook_name,
    platform: row.platform,
    note: row.note || "",
    createdAt: row.created_at
  };
}

router.get("/", async (req, res) => {
  if (!isAdminRoute(req)) {
    return res.status(403).json({
      error: "Không có quyền xem danh sách player"
    });
  }

  try {
    const { search, from, to, platform, sort } = req.query;

    const conditions = [];
    const values = [];

    if (search) {
      values.push(`%${String(search).trim()}%`);
      conditions.push(
        `(ingame_name ILIKE $${values.length} OR facebook_name ILIKE $${values.length})`
      );
    }

    if (from) {
      values.push(from);
      conditions.push(`created_at >= $${values.length}`);
    }

    if (to) {
      values.push(to);
      conditions.push(`created_at <= $${values.length}`);
    }

    const cleanPlatform = platform ? normalizePlatform(platform) : null;

    if (platform && !cleanPlatform) {
      return res.status(400).json({
        error: "Nền tảng không hợp lệ"
      });
    }

    if (cleanPlatform) {
      values.push(cleanPlatform);
      conditions.push(`platform = $${values.length}`);
    }

    const order = sort === "oldest" ? "ASC" : "DESC";

    const sql = `
      SELECT id, ingame_name, facebook_name, platform, note, created_at
      FROM players
      ${conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""}
      ORDER BY created_at ${order}
    `;

    const result = await pool.query(sql, values);

    res.json(result.rows.map(mapPlayer));
  } catch (error) {
    console.error("GET players error:", error);
    res.status(500).json({
      error: "Lỗi server khi lấy danh sách player"
    });
  }
});

router.post("/register", async (req, res) => {
  try {
    const { ingameName, facebookName, platform, note } = req.body;

    if (!ingameName || !facebookName || !platform) {
      return res.status(400).json({
        error: "Thiếu thông tin đăng ký"
      });
    }

    const cleanIngameName = String(ingameName).trim();
    const cleanFacebookName = String(facebookName).trim();
    const cleanPlatform = normalizePlatform(platform);
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

    if (!cleanPlatform) {
      return res.status(400).json({
        error: "Nền tảng không hợp lệ"
      });
    }

    if (cleanNote.length > 200) {
      return res.status(400).json({
        error: "Ghi chú quá dài"
      });
    }

    const result = await pool.query(
      `
        INSERT INTO players (ingame_name, facebook_name, platform, note)
        VALUES ($1, $2, $3, $4)
        RETURNING id, ingame_name, facebook_name, platform, note, created_at
      `,
      [cleanIngameName, cleanFacebookName, cleanPlatform, cleanNote]
    );

    res.status(201).json({
      message: "Đăng ký thành công",
      player: mapPlayer(result.rows[0])
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(400).json({
        error: "Tên ingame này đã đăng ký rồi"
      });
    }

    console.error("Register player error:", error);
    res.status(500).json({
      error: "Lỗi server khi đăng ký player"
    });
  }
});

router.put("/:id", async (req, res) => {
  if (!isAdminRoute(req)) {
    return res.status(403).json({
      error: "Không có quyền sửa player"
    });
  }

  try {
    const id = Number(req.params.id);
    const { ingameName, facebookName, platform, note } = req.body;

    if (!Number.isFinite(id)) {
      return res.status(400).json({
        error: "ID không hợp lệ"
      });
    }

    if (!ingameName || !facebookName || !platform) {
      return res.status(400).json({
        error: "Thiếu thông tin cập nhật"
      });
    }

    const cleanIngameName = String(ingameName).trim();
    const cleanFacebookName = String(facebookName).trim();
    const cleanPlatform = normalizePlatform(platform);
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

    if (!cleanPlatform) {
      return res.status(400).json({
        error: "Nền tảng không hợp lệ"
      });
    }

    if (cleanNote.length > 200) {
      return res.status(400).json({
        error: "Ghi chú quá dài"
      });
    }

    const result = await pool.query(
      `
        UPDATE players
        SET ingame_name = $1,
            facebook_name = $2,
            platform = $3,
            note = $4
        WHERE id = $5
        RETURNING id, ingame_name, facebook_name, platform, note, created_at
      `,
      [cleanIngameName, cleanFacebookName, cleanPlatform, cleanNote, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: "Không tìm thấy player"
      });
    }

    res.json({
      message: "Đã cập nhật player",
      player: mapPlayer(result.rows[0])
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(400).json({
        error: "Tên ingame này đã tồn tại"
      });
    }

    console.error("Update player error:", error);
    res.status(500).json({
      error: "Lỗi server khi cập nhật player"
    });
  }
});

router.delete("/:id", async (req, res) => {
  if (!isAdminRoute(req)) {
    return res.status(403).json({
      error: "Không có quyền xóa player"
    });
  }

  try {
    const id = Number(req.params.id);

    if (!Number.isFinite(id)) {
      return res.status(400).json({
        error: "ID không hợp lệ"
      });
    }

    const result = await pool.query(
      `
        DELETE FROM players
        WHERE id = $1
        RETURNING id
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: "Không tìm thấy player"
      });
    }

    res.json({
      message: "Đã xoá player"
    });
  } catch (error) {
    console.error("Delete player error:", error);
    res.status(500).json({
      error: "Lỗi server khi xoá player"
    });
  }
});

module.exports = router;