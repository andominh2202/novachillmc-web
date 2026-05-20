const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const playersRoute = require("./routes/players");

const app = express();

app.use(cors({
  origin: [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "http://localhost:3000",
    "https://ten-web-cua-cau.netlify.app"
  ]
}));

app.use(express.json({ limit: "20kb" }));

const registerLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: {
    error: "Gửi quá nhiều lần, thử lại sau 1 phút"
  }
});

app.get("/", (req, res) => {
  res.json({
    status: "online",
    server: "NovaChillMC Backend"
  });
});

function checkAdmin(req, res, next) {
  const adminKey = req.headers["x-admin-key"];

  if (!process.env.ADMIN_KEY) {
    return res.status(500).json({
      error: "Server chưa cấu hình ADMIN_KEY"
    });
  }

  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({
      error: "Không có quyền admin"
    });
  }

  next();
}

app.use("/api/players", registerLimiter, playersRoute);
app.use("/api/admin/players", checkAdmin, playersRoute);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`NovaChillMC backend running on port ${PORT}`);
});