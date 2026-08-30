import { Router } from "express";
import { requireAdmin, requireAuth } from "./auth";
import { getStablecoinMarketSnapshot } from "../lib/stablecoinMarket";

const router = Router();

router.get("/stablecoin-market", async (req, res) => {
  try {
    res.json(await getStablecoinMarketSnapshot());
  } catch (error) {
    req.log.error(error, "Unable to load stablecoin market data");
    res.status(502).json({ error: "Stablecoin market data is temporarily unavailable" });
  }
});

router.post("/stablecoin-market/refresh", requireAuth, requireAdmin, async (req, res) => {
  try {
    res.json(await getStablecoinMarketSnapshot(true));
  } catch (error) {
    req.log.error(error, "Unable to refresh stablecoin market data");
    res.status(502).json({ error: "Stablecoin market data refresh failed" });
  }
});

export default router;
