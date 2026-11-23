import { NextResponse } from "next/server";export const maxDuration = 60;
import { callGeminiJson } from "@/lib/gemini";
import { createServerSupabase } from "@/lib/supabase/server";
import type { PronunciationResult } from "@/types/mathspeak";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audio = formData.get("audio");
    const targetText = String(formData.get("targetText") || "").trim();
    const lessonId = String(formData.get("lessonId") || "").trim();
    const lineId = String(formData.get("lineId") || "").trim();

    if (!audio || !(audio instanceof File)) {
      return NextResponse.json({ error: "Thiếu dữ liệu ghi âm." }, { status: 400 });
    }
    if (!targetText) {
      return NextResponse.json({ error: "Thiếu câu mẫu để đối chiếu." }, { status: 400 });
    }

    const buffer = Buffer.from(await audio.arrayBuffer());
    const base64Audio = buffer.toString("base64");
    const cleanMime = (audio.type || "audio/webm").split(";")[0].trim() || "audio/webm";

    const evalPrompt = `You are a supportive, precise English pronunciation coach for a Vietnamese high school Mathematics teacher.
Listen carefully to the teacher's audio recording and compare it with the target English teaching sentence below.

Target sentence (spoken form):
"${targetText}"

Evaluate accurately (do not flatter if words were skipped or mispronounced; if audio is silent or unintelligible, give a low score and explain clearly).
Return ONLY valid JSON with this exact schema:
{
  "score": 82,
  "verdict": "Khá",
  "heard_text": "Exact transcript of what you actually heard in English",
  "word_feedback": [
    { "word": "monotonicity", "status": "fix", "tip_vi": "Nhấn trọng âm vào âm tiết thứ 4: mo-no-to-NI-ci-ty" },
    { "word": "derivative", "status": "ok", "tip_vi": "Phát âm rõ" }
  ],
  "fixes_vi": [
    "Cụ thể từ/âm nào bị sai hoặc thiếu âm cuối (/s/, /z/, /t/, /d/) và cách đọc lại cho chuẩn."
  ],
  "praise_vi": "1 câu ngắn gọn khen điểm thầy đã đọc tốt."
}

Rules:
- "score": integer 0 to 100.
- "verdict": strictly one of "Tốt" (>=85), "Khá" (65-84), or "Cần luyện thêm" (<65).
- "word_feedback": 4 to 8 key words from the sentence (especially Math terms, mispronounced words, or skipped words). "status" must be "ok", "fix", or "missing".
- "fixes_vi": 1 to 4 concise, actionable bullet points in Vietnamese.
- All feedback fields MUST be in clear Vietnamese.`;

    const { data: parsed } = await callGeminiJson<PronunciationResult>(
      [
        { inlineData: { mimeType: cleanMime, data: base64Audio } },
        { text: evalPrompt },
      ],
      { temperature: 0.2 }
    );

    const result: PronunciationResult = {
      score:
        typeof parsed.score === "number"
          ? Math.max(0, Math.min(100, Math.round(parsed.score)))
          : 0,
      verdict: parsed.verdict || "Cần luyện thêm",
      heard_text: parsed.heard_text || "",
      word_feedback: Array.isArray(parsed.word_feedback) ? parsed.word_feedback : [],
      fixes_vi: Array.isArray(parsed.fixes_vi) ? parsed.fixes_vi : [],
      praise_vi: parsed.praise_vi || "",
    };

    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lessonId);
    const supabase = await createServerSupabase();
    if (supabase && lineId) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("pronunciation_logs").insert({
          user_id: user.id,
          lesson_id: isUuid ? lessonId : null,
          line_id: lineId,
          target_text: targetText,
          heard_text: result.heard_text,
          score: result.score,
          verdict: result.verdict,
          feedback: result,
        });
      }
    }

    return NextResponse.json({ result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lỗi chấm phát âm.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
