const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const dotenv = require("dotenv");

dotenv.config();

const playersRoute = require("./routes/players");
const checkAdmin = require("./middleware/auth");

const app = express();

app.use(helmet());

app.use(cors({
  origin: [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "http://localhost:3000",

    "https://novachillmc.netlify.app",
    "https://novachillmc-web.netlify.app",

    "https://novachillmc-web.vercel.app",

    "https://novachillmc.site",
    "https://www.novachillmc.site"
  ],

  methods: ["GET", "POST", "DELETE", "PUT", "PATCH", "OPTIONS"],

  allowedHeaders: ["Content-Type", "x-admin-key"]
}));

app.use(express.json({ limit: "20kb" }));

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: {
    error: "Quá nhiều request, thử lại sau 1 phút"
  }
});

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

app.get("/api", (req, res) => {
  res.json({
    status: "online",
    api: "NovaChillMC API"
  });
});

app.use("/api", apiLimiter);

// PUBLIC ROUTE
app.use("/api/players", registerLimiter, playersRoute);

// ADMIN ROUTE
app.use("/api/admin/players", checkAdmin, playersRoute);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`NovaChillMC backend running on port ${PORT}`);
});