const express = require("express");
const os = require("os");

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3001;

const startedAt = Date.now();
let totalRequests = 0;

app.use((req, res, next) => {
  totalRequests += 1;
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:8081");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  return next();
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/stats", (req, res) => {
  const uptimeSec = Math.floor((Date.now() - startedAt) / 1000);
  const mem = process.memoryUsage();
  res.json({
    totalRequests,
    uptimeSec,
    hostname: os.hostname(),
    pid: process.pid,
    loadavg: os.loadavg(),
    memory: {
      rssMb: Math.round(mem.rss / 1024 / 1024),
      heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
    },
  });
});

const spinCpu = (durationMs) => {
  const endAt = Date.now() + durationMs;
  let value = 0;
  while (Date.now() < endAt) {
    value += Math.sqrt(Math.random() * 1000);
  }
  return value;
};

app.get("/work", (req, res) => {
  // Input validation
  const rawDurationMs = req.query.durationMs;
  const rawPayloadKb = req.query.payloadKb;

  if (rawDurationMs !== undefined && (isNaN(rawDurationMs) || rawDurationMs === '')) {
    return res.status(400).json({
      error: "Invalid durationMs parameter",
      message: "durationMs must be a valid number"
    });
  }

  if (rawPayloadKb !== undefined && (isNaN(rawPayloadKb) || rawPayloadKb === '')) {
    return res.status(400).json({
      error: "Invalid payloadKb parameter",
      message: "payloadKb must be a valid number"
    });
  }

  const durationMs = Math.min(
    Math.max(Number(rawDurationMs) || 50, 10),
    2000
  );
  const payloadKb = Math.min(
    Math.max(Number(rawPayloadKb) || 2, 1),
    64
  );

  try {
    const start = process.hrtime.bigint();
    const checksum = spinCpu(durationMs);
    const elapsedMs = Number(process.hrtime.bigint() - start) / 1e6;
    const payload = "x".repeat(payloadKb * 1024);

    res.json({
      ok: true,
      elapsedMs: Math.round(elapsedMs),
      durationMs,
      payloadKb,
      checksum: Math.round(checksum),
      payloadSample: payload.slice(0, 32),
    });
  } catch (error) {
    console.error("Work endpoint error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to process work request"
    });
  }
});

app.get("/metrics", (req, res) => {
  const uptimeSec = Math.floor((Date.now() - startedAt) / 1000);
  const hostname = os.hostname();
  const pid = process.pid;
  const memUsage = process.memoryUsage();
  const loadAvg = os.loadavg();

  res.type("text/plain").send(
    [
      "# HELP api_requests_total Total number of HTTP requests processed",
      "# TYPE api_requests_total counter",
      `api_requests_total{hostname="${hostname}",pid="${pid}"} ${totalRequests}`,
      "",
      "# HELP api_uptime_seconds Time since API started",
      "# TYPE api_uptime_seconds gauge",
      `api_uptime_seconds{hostname="${hostname}",pid="${pid}"} ${uptimeSec}`,
      "",
      "# HELP api_memory_usage_bytes Memory usage in bytes",
      "# TYPE api_memory_usage_bytes gauge",
      `api_memory_usage_bytes{type="rss",hostname="${hostname}",pid="${pid}"} ${memUsage.rss}`,
      `api_memory_usage_bytes{type="heap_used",hostname="${hostname}",pid="${pid}"} ${memUsage.heapUsed}`,
      `api_memory_usage_bytes{type="heap_total",hostname="${hostname}",pid="${pid}"} ${memUsage.heapTotal}`,
      "",
      "# HELP api_load_average System load average",
      "# TYPE api_load_average gauge",
      `api_load_average{period="1m",hostname="${hostname}",pid="${pid}"} ${loadAvg[0]}`,
      `api_load_average{period="5m",hostname="${hostname}",pid="${pid}"} ${loadAvg[1]}`,
      `api_load_average{period="15m",hostname="${hostname}",pid="${pid}"} ${loadAvg[2]}`,
      "",
    ].join("\n")
  );
});

app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
