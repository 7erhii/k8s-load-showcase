import { NextResponse } from "next/server";

const API_BASE = process.env.API_BASE ?? "http://api:3001";

export async function GET() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(`${API_BASE}/stats`, {
      cache: "no-store",
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const body = await response.text();

    return new NextResponse(body, {
      status: response.status,
      headers: {
        "content-type": response.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (error) {
    console.error("Stats API route error:", error);

    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: "Request timeout", message: "API request took too long" },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error", message: "Failed to fetch stats from API" },
      { status: 500 }
    );
  }
}
