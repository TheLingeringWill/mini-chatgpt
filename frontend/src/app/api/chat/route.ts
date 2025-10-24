// T013: Next.js API route to proxy requests to mock-llm backend

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    // Validate input
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message cannot be empty" },
        { status: 400 }
      );
    }

    if (message.length > 4000) {
      return NextResponse.json(
        { error: "Message too long (max 4000 characters)" },
        { status: 400 }
      );
    }

    // Proxy to mock-llm backend
    const backendUrl = process.env.MOCK_LLM_API_URL || "http://localhost:8080";
    const response = await fetch(`${backendUrl}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Backend error" },
        { status: response.status }
      );
    }

    return NextResponse.json({ completion: data.completion });
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: "Failed to reach backend service" },
      { status: 500 }
    );
  }
}
