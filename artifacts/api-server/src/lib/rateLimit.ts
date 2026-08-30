import type { RequestHandler } from "express";

interface Bucket {
  count: number;
  resetAt: number;
}

const MAX_BUCKETS = 10_000;

export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  key?: (req: any) => string;
}): RequestHandler {
  const buckets = new Map<string, Bucket>();
  let lastCleanup = Date.now();

  return (req: any, res, next) => {
    const now = Date.now();
    if (now - lastCleanup > options.windowMs) {
      for (const [key, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(key);
      lastCleanup = now;
    }

    const key = options.key?.(req) ?? req.ip ?? req.socket?.remoteAddress ?? "unknown";
    const current = buckets.get(key);
    if (!current && buckets.size >= MAX_BUCKETS) {
      const oldestKey = buckets.keys().next().value;
      if (oldestKey !== undefined) buckets.delete(oldestKey);
    }
    const bucket = !current || current.resetAt <= now
      ? { count: 1, resetAt: now + options.windowMs }
      : { count: current.count + 1, resetAt: current.resetAt };
    buckets.set(key, bucket);

    res.setHeader("RateLimit-Limit", String(options.max));
    res.setHeader("RateLimit-Remaining", String(Math.max(0, options.max - bucket.count)));
    res.setHeader("RateLimit-Reset", String(Math.ceil(bucket.resetAt / 1000)));
    if (bucket.count > options.max) {
      res.setHeader("Retry-After", String(Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))));
      res.status(429).json({ error: "Too many requests. Please wait and try again." });
      return;
    }
    next();
  };
}

export function ipAndEmailKey(req: any): string {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "-";
  return `${req.ip ?? req.socket?.remoteAddress ?? "unknown"}:${email}`;
}
