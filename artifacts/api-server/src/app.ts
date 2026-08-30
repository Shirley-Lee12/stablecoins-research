import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { env } from "./config";

const app: Express = express();
app.disable("x-powered-by");

if (env.NODE_ENV === "production") app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
const developmentOrigins = new Set(["http://localhost:5173", "http://127.0.0.1:5173"]);
const configuredOrigins = new Set((env.CORS_ORIGIN ?? "").split(",").map((origin) => origin.trim()).filter(Boolean));

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) { callback(null, true); return; }
      const allowed = configuredOrigins.has(origin) || (env.NODE_ENV !== "production" && developmentOrigins.has(origin));
      callback(allowed ? null : new Error("Origin is not allowed by CORS"), allowed);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
  if (env.NODE_ENV === "production") res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  next();
});
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "256kb", parameterLimit: 200 }));

app.use("/api", router);

app.use((err: any, req: any, res: any, _next: any) => {
  req.log?.error(err);
  if (err?.type === "entity.too.large") {
    res.status(413).json({ error: "Request body is too large" });
    return;
  }
  if (err?.message === "Origin is not allowed by CORS") {
    res.status(403).json({ error: "Origin is not allowed" });
    return;
  }
  res.status(500).json({ error: "Internal server error" });
});

export default app;
