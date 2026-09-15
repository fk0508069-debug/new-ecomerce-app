import { NextRequest, NextResponse } from "next/server";

const FASTAPI_URL =
  process.env.FASTAPI_URL || "http://127.0.0.1:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.question || typeof body.question !== "string") {
      return NextResponse.json(
        { error: "Question is required." },
        { status: 400 }
      );
    }

    const response = await fetch(`${FASTAPI_URL}/ask`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.FASTAPI_API_KEY || "",
      },
      body: JSON.stringify({
        question: body.question,
        session_id: body.session_id || null,
      }),
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: data.detail || "AI server request failed.",
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Chat API error:", error);

    return NextResponse.json(
      { error: "Could not connect to AI server." },
      { status: 500 }
    );
  }
}