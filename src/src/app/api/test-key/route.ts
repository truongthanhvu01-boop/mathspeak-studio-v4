export const maxDuration = 30;

import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { apiKey?: string; model?: string };
    const apiKey = (body.apiKey || "").trim();
    const model = (body.model || "gemini-3.8-flash").trim() || "gemini-3.8-flash";

    if (!apiKey) {
      return NextResponse.json({ ok: false, error: "Vui lòng nhập chuỗi API Key trước khi kiểm tra." }, { status: 400 });
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
    )}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const resp = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Reply with OK" }] }],
        generationConfig: { maxOutputTokens: 8 },
      }),
    });

    if (!resp.ok) {
      const err = (await resp.json().catch(() => ({}))) as { error?: { message?: string } };
      return NextResponse.json(
        { ok: false, error: err.error?.message || `Lỗi HTTP ${resp.status}` },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, model });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Không thể kiểm tra kết nối." },
      { status: 500 }
    );
  }
}
