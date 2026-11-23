export interface GeminiPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

/**
 * Safely parses JSON returned by Gemini even when LaTeX commands
 * contain single unescaped backslashes (e.g. \in, \ge, \frac, \mathbb{R}).
 */
export function safeParseGeminiJson<T = Record<string, unknown>>(raw: string): T {
  let txt = String(raw || "").trim();
  txt = txt.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const firstBrace = txt.indexOf("{");
  const lastBrace = txt.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    txt = txt.slice(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(txt) as T;
  } catch {
    let out = "";
    let inStr = false;
    for (let i = 0; i < txt.length; i++) {
      const ch = txt[i];
      if (!inStr) {
        if (ch === '"') inStr = true;
        out += ch;
        continue;
      }
      if (ch === '"') {
        inStr = false;
        out += ch;
        continue;
      }
      if (ch === "\n") {
        out += "\\n";
        continue;
      }
      if (ch === "\r") {
        out += "\\r";
        continue;
      }
      if (ch === "\t") {
        out += "\\t";
        continue;
      }
      if (ch === "\\") {
        const next = txt[i + 1] || "";
        const next2 = txt[i + 2] || "";
        const isHexUnicode =
          next === "u" && /^[0-9a-fA-F]{4}$/.test(txt.slice(i + 2, i + 6));
        const isSimpleJsonEscape = next === '"' || next === "\\" || next === "/";
        const isControlEscape = /[bfnrt]/.test(next) && !/[a-zA-Z]/.test(next2);
        if (isSimpleJsonEscape || isHexUnicode || isControlEscape) {
          out += ch + next;
          i++;
        } else {
          out += "\\\\";
        }
        continue;
      }
      out += ch;
    }
    return JSON.parse(out) as T;
  }
}

/**
 * Calls Gemini REST API with automatic model fallback on 503/429 high-demand errors.
 */
export async function callGeminiJson<T = Record<string, unknown>>(
  parts: GeminiPart[],
  options?: { temperature?: number; preferredModel?: string }
): Promise<{ data: T; usedModel: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Chưa cấu hình GEMINI_API_KEY trên máy chủ. Vui lòng thêm biến môi trường trong Vercel hoặc .env.local."
    );
  }

  const preferred = options?.preferredModel || process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const models = Array.from(
    new Set([preferred, "gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash"])
  );

  let lastErr: Error | null = null;

  for (let i = 0; i < models.length; i++) {
    const modelName = models[i];
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      modelName
    )}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const resp = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          temperature: options?.temperature ?? 0.3,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!resp.ok) {
      const errJson = (await resp.json().catch(() => ({}))) as {
        error?: { message?: string };
      };
      const errMsg = errJson.error?.message || `HTTP ${resp.status}`;
      const isTransient =
        resp.status === 503 ||
        resp.status === 429 ||
        /high demand|overloaded|quota|unavailable/i.test(errMsg);
      lastErr = new Error(errMsg);
      if (isTransient && i < models.length - 1) {
        continue;
      }
      throw lastErr;
    }

    const payload = (await resp.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const rawText = payload.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      lastErr = new Error("Gemini không trả về nội dung JSON.");
      continue;
    }

    return {
      data: safeParseGeminiJson<T>(rawText),
      usedModel: modelName,
    };
  }

  throw lastErr || new Error("Không thể kết nối Gemini API.");
}
