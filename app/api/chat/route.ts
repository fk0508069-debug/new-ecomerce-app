import { NextRequest, NextResponse } from "next/server";

const FASTAPI_URL =
  process.env.FASTAPI_URL || "https://ai-lang-grpgh-system.vercel.app";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("FASTAPI_URL:", FASTAPI_URL);
    console.log("Sending question:", body.question);

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

    const responseText = await response.text();

    console.log("FastAPI status:", response.status);
    console.log("FastAPI response:", responseText);

    let data;

    try {
      data = JSON.parse(responseText);
    } catch {
      data = { raw: responseText };
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "FastAPI returned an error",
          status: response.status,
          details: data,
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("CHAT CONNECTION ERROR:", error);

    return NextResponse.json(
      {
        error: "Could not connect to AI server.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}