"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export default function Home() {
  const [rps, setRps] = useState(10);
  const [durationMs, setDurationMs] = useState(50);
  const [payloadKb, setPayloadKb] = useState(2);
  const [running, setRunning] = useState(false);
  const [sent, setSent] = useState(0);
  const [errors, setErrors] = useState(0);
  const [lastStatus, setLastStatus] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    totalRequests: number;
    uptimeSec: number;
    hostname: string;
    pid: number;
    loadavg: number[];
    memory: {
      rssMb: number;
      heapUsedMb: number;
      heapTotalMb: number;
    };
  } | null>(null);

  const safeRps = useMemo(() => Math.min(Math.max(rps, 1), 200), [rps]);
  const runningRef = useRef(running);

  useEffect(() => {
    runningRef.current = running;
  }, [running]);

  useEffect(() => {
    if (!running) {
      return;
    }

    const intervalMs = Math.max(1, Math.floor(1000 / safeRps));

    const fire = async () => {
      try {
        const params = new URLSearchParams({
          durationMs: String(durationMs),
          payloadKb: String(payloadKb),
        });
        const response = await fetch(`/api/work?${params.toString()}`, {
          cache: "no-store",
        });
        setLastStatus(response.ok ? "ok" : `error ${response.status}`);
        setSent((prev) => prev + 1);
      } catch (error) {
        setErrors((prev) => prev + 1);
        setLastStatus("network error");
      }
    };

    const id = setInterval(() => {
      if (!runningRef.current) {
        return;
      }
      fire();
    }, intervalMs);

    return () => clearInterval(id);
  }, [running, safeRps, durationMs, payloadKb]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await fetch("/api/stats", { cache: "no-store" });
        if (!response.ok) {
          return;
        }
        const data = await response.json();
        setStats(data);
      } catch {
        // ignore
      }
    };

    loadStats();
    const id = setInterval(loadStats, 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans text-zinc-900">
      <main className="flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
        <header className="flex flex-col gap-4">
          <h1 className="text-3xl font-semibold">Kubernetes Load Lab</h1>
          <p className="text-lg text-zinc-600">
            A small lab: frontend generates traffic, backend gets load, and
            Kubernetes reacts.
          </p>
        </header>

        <section className="grid gap-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm lg:grid-cols-[1.2fr_1fr]">
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold">Traffic generator</h2>
            <label className="flex flex-col gap-2 text-sm font-medium">
              Requests per second (1‑200)
              <input
                type="number"
                value={rps}
                min={1}
                max={200}
                onChange={(event) => setRps(Number(event.target.value))}
                className="rounded-lg border border-zinc-200 px-3 py-2 text-base"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium">
              Work duration (ms)
              <input
                type="number"
                value={durationMs}
                min={10}
                max={2000}
                onChange={(event) => setDurationMs(Number(event.target.value))}
                className="rounded-lg border border-zinc-200 px-3 py-2 text-base"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium">
              Payload size (KB)
              <input
                type="number"
                value={payloadKb}
                min={1}
                max={64}
                onChange={(event) => setPayloadKb(Number(event.target.value))}
                className="rounded-lg border border-zinc-200 px-3 py-2 text-base"
              />
            </label>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setRunning((prev) => !prev)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${
                  running ? "bg-rose-600" : "bg-emerald-600"
                }`}
              >
                {running ? "Stop" : "Start"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSent(0);
                  setErrors(0);
                }}
                className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700"
              >
                Reset counters
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 text-sm">
              <p className="text-zinc-500">Current mode</p>
              <p className="text-lg font-semibold">
                {safeRps} rps / {durationMs} ms / {payloadKb} KB
              </p>
              <p className="text-xs text-zinc-500">
                rps is capped at 200 to keep the browser stable.
              </p>
            </div>

            <div className="grid gap-3 text-sm">
              <div className="flex justify-between rounded-lg border border-zinc-100 px-4 py-2">
                <span>Requests sent</span>
                <span className="font-semibold">{sent}</span>
              </div>
              <div className="flex justify-between rounded-lg border border-zinc-100 px-4 py-2">
                <span>Errors</span>
                <span className="font-semibold">{errors}</span>
              </div>
              <div className="flex justify-between rounded-lg border border-zinc-100 px-4 py-2">
                <span>Last status</span>
                <span className="font-semibold">{lastStatus ?? "-"}</span>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-100 bg-white p-4 text-sm">
              <p className="text-zinc-500">Backend monitoring</p>
              {stats ? (
                <div className="mt-3 grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total requests</span>
                    <span className="font-semibold">{stats.totalRequests}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Uptime</span>
                    <span className="font-semibold">{stats.uptimeSec}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Host</span>
                    <span className="font-semibold">{stats.hostname}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>PID</span>
                    <span className="font-semibold">{stats.pid}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Load avg (1/5/15)</span>
                    <span className="font-semibold">
                      {stats.loadavg.map((value) => value.toFixed(2)).join(" / ")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Memory RSS</span>
                    <span className="font-semibold">{stats.memory.rssMb} MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Heap used / total</span>
                    <span className="font-semibold">
                      {stats.memory.heapUsedMb} / {stats.memory.heapTotalMb} MB
                    </span>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-sm text-zinc-500">Waiting for stats…</p>
              )}
            </div>
          </div>
        </section>

        <section className="text-sm text-zinc-600">
          Tip: open another terminal and run{" "}
          <span className="font-semibold">kubectl get pods -w</span>, then enable
          autoscaling.
        </section>
      </main>
    </div>
  );
}
