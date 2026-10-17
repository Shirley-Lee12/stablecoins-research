import { Router } from "express";
import { pool } from "@workspace/db";
import { loadPublicDirectory } from "../lib/publicDirectory";
const router = Router();
for (const kind of ["resources", "researchers"] as const)
  router.get(`/public-directory/${kind}`, async (req, res) => {
    try {
      res.json(await loadPublicDirectory((sql) => pool.query(sql), kind));
    } catch {
      req.log.warn({ directory: kind }, "Public directory query unavailable");
      res.status(503).json({
        version: "0.2",
        state: "UNAVAILABLE",
        error: "The public research directory is temporarily unavailable.",
      });
    }
  });
export default router;
