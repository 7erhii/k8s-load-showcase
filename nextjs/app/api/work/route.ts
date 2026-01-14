import { NextResponse } from "next/server";

const API_BASE = process.env.API_BASE ?? "http://api:3001";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const target = `${API_BASE}/work?${url.searchParams.toString()}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(target, {
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
    console.error("Work API route error:", error);

    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: "Request timeout", message: "API request took too long" },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error", message: "Failed to proxy request to API" },
      { status: 500 }
    );
  }
}
