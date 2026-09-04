const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const formularioRoutes = require("./routes/formularioRoutes");
const municipiosRoutes = require("./routes/municipiosRoutes");
const { isFeatureEnabled } = require("./config/featureFlags");

const app = express();

app.set("trust proxy", process.env.NODE_ENV === "production" ? 1 : false);
app.disable("x-powered-by");

const allowedOrigins = String(process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Origem não permitida pelo CORS"));
    },
  }),
);
app.use((req, res, next) => {
  res.set("X-Content-Type-Options", "nosniff");
  res.set("X-Frame-Options", "DENY");
  res.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (process.env.NODE_ENV === "production") {
    res.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
});
app.use(express.json({ limit: "32kb" }));
if (isFeatureEnabled(process.env.AI_ASSISTANT_ENABLED)) {
  // Carregamento tardio: com a flag desligada, a integração de IA permanece inativa.
  const assistenteRoutes = require("./routes/assistenteRoutes");
  app.use("/api", assistenteRoutes);
}
app.use("/api", authRoutes);
app.use("/api", formularioRoutes);
app.use("/api", municipiosRoutes);

module.exports = app;
