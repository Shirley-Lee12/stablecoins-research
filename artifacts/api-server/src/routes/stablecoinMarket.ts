import { Router } from "express";
import { requireAdmin, requireAuth } from "./auth";
import { getStablecoinMarketSnapshot } from "../lib/stablecoinMarket";
import { getMacroContext } from "../lib/macroContext";
import { getStablecoinLiquidity } from "../lib/stablecoinLiquidity";
import { getDepegSnapshot } from "../lib/depegEvents";
import { getStablecoinOnchain } from "../lib/stablecoinOnchain";
import { refreshAllStablecoinData } from "../lib/stablecoinDataScheduler";

const router = Router();

router.get("/stablecoin-market", async (req, res) => {
  try {
    res.json(await getStablecoinMarketSnapshot());
  } catch (error) {
    req.log.error(error, "Unable to load stablecoin market data");
    res.status(502).json({ error: "Stablecoin market data is temporarily unavailable" });
  }
});

router.get("/stablecoin-macro", async (req, res) => {
  try {
    res.json(await getMacroContext());
  } catch (error) {
    req.log.error(error, "Unable to load stablecoin macro context");
    res.status(502).json({ error: "Macro context is temporarily unavailable" });
  }
});

router.get("/stablecoin-liquidity", async (req, res) => {
  try {
    res.json(await getStablecoinLiquidity());
  } catch (error) {
    req.log.error(error, "Unable to load stablecoin liquidity data");
    res.status(503).json({ error: "Stablecoin liquidity data is temporarily unavailable", dataStatus: { state: "unavailable" } });
  }
});

router.get("/stablecoin-depegs", async (req, res) => {
  try {
    res.json(await getDepegSnapshot());
  } catch (error) {
    req.log.error(error, "Unable to load stablecoin depeg events");
    res.status(503).json({ error: "Stablecoin depeg data is temporarily unavailable", dataStatus: { state: "unavailable" } });
  }
});

router.get("/stablecoin-onchain", async (req, res) => {
  try {
    res.json(await getStablecoinOnchain());
  } catch (error) {
    req.log.warn(error, "Unable to load stablecoin on-chain data");
    res.status(503).json({ error: "Stablecoin on-chain connector is not available", dataStatus: { state: "unavailable" } });
  }
});

router.post("/stablecoin-data/refresh", requireAuth, requireAdmin, async (_req, res) => {
  const results = await refreshAllStablecoinData();
  res.status(results.every((result) => result.refreshed) ? 200 : 207).json({ results });
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
