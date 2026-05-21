function checkAdmin(req, res, next) {
  const adminKey = req.headers["x-admin-key"];

  if (!process.env.ADMIN_KEY) {
    return res.status(500).json({
      error: "Server chưa cấu hình ADMIN_KEY"
    });
  }

  if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({
      error: "Không có quyền admin"
    });
  }

  next();
}

module.exports = checkAdmin;