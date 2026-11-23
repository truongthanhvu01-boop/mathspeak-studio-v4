import { NextResponse } from "next/server";export const maxDuration = 60;
import { callGeminiJson } from "@/lib/gemini";
import { createServerSupabase } from "@/lib/supabase/server";
import type { LessonScript, ScriptStage, VocabItem } from "@/types/mathspeak";

interface GeneratedPayload {
  title_en?: string;
  title_vi?: string;
  grade?: string;
  duration?: string;
  stages?: ScriptStage[];
  vocab?: VocabItem[];
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      lessonText?: string;
      grade?: string;
      level?: string;
      style?: string;
    };

    const lessonText = (body.lessonText || "").trim();
    if (!lessonText) {
      return NextResponse.json(
        { error: "Nội dung Kế hoạch bài dạy đang trống." },
        { status: 400 }
      );
    }

    const grade = body.grade || "Lớp 12";
    const level = body.level || "friendly";
    const style = body.style || "interactive";

    const prompt = `You are an expert Vietnamese high school Mathematics teacher and bilingual STEM pedagogy coach.
Convert the following Vietnamese high school Math lesson plan (Kế hoạch bài dạy - ${grade}) into a complete, natural English classroom teaching script ready for speaking practice.

Preferences:
- English proficiency target: ${
      level === "friendly"
        ? "Clear, accessible classroom English (B1-B2) suitable for Vietnamese high school students"
        : "Academic bilingual high school Math English (B2-C1)"
    }
- Teaching style: ${
      style === "interactive"
        ? "Interactive with frequent comprehension-check questions and expected student responses"
        : "Concise, structured, clear teacher explanations"
    }

CRITICAL REQUIREMENT FOR MATH PRONUNCIATION:
For EVERY line, provide BOTH:
1. "display_en": Natural English with math expressions formatted in inline LaTeX using single dollar signs like $f'(x) > 0$, $x^2 - 3x + 2 = 0$.
2. "spoken_en": Pure English words with ALL math symbols spelled out naturally for Text-to-Speech (NO LaTeX, NO raw symbols like ^, \\, >=, <=). Example: "$f'(x) > 0$" -> "f prime of x is greater than zero".

Return ONLY valid JSON matching this exact schema:
{
  "title_en": "English lesson title",
  "title_vi": "Tiêu đề bài học tiếng Việt",
  "grade": "${grade}",
  "duration": "45 phút",
  "stages": [
    {
      "id": "st1",
      "name_en": "Activity 1: Warm-up",
      "name_vi": "Hoạt động 1: Khởi động",
      "lines": [
        {
          "id": "l1",
          "role": "Teacher",
          "display_en": "...",
          "spoken_en": "...",
          "vi": "Nghĩa tiếng Việt tương ứng",
          "ipa_tip": "1-2 key math terms with IPA"
        }
      ]
    }
  ],
  "vocab": [
    {
      "symbol_latex": "f'(x) > 0",
      "term_en": "Positive first derivative",
      "spoken_how": "f prime of x is greater than zero",
      "ipa": "/.../",
      "meaning_vi": "Đạo hàm cấp một dương"
    }
  ]
}

Rules:
- Keep role strictly one of: "Teacher", "Board", "Expected Student".
- Include 4 pedagogical stages (Warm-up, New Knowledge, Practice, Application & Wrap-up) with 12 to 18 total concise, speakable lines.
- Include 6 to 10 key math symbols/terms in "vocab".
- CRITICAL JSON ESCAPING: Always double-escape EVERY backslash in LaTeX inside JSON strings (for example write "\\in", "\\ge", "\\le", "\\frac{1}{2}", "\\sqrt{3}", "\\mathbb{R}", "\\infty"). Never output a single unescaped backslash.

Vietnamese Lesson Plan:
---
${lessonText.slice(0, 14000)}
---`;

    const { data: parsed, usedModel } = await callGeminiJson<GeneratedPayload>(
      [{ text: prompt }],
      { temperature: 0.3 }
    );

    const stages: ScriptStage[] = Array.isArray(parsed.stages) ? parsed.stages : [];
    let counter = 1;
    stages.forEach((st, idx) => {
      st.id = st.id || `st${idx + 1}`;
      st.lines = Array.isArray(st.lines) ? st.lines : [];
      st.lines.forEach((l) => {
        l.id = `l${counter++}`;
      });
    });

    const script: LessonScript = {
      id: `local-${Date.now()}`,
      grade: parsed.grade || grade,
      duration: parsed.duration || "45 phút",
      title_en: parsed.title_en || "English Math Teaching Script",
      title_vi: parsed.title_vi || "Kịch bản giảng dạy Toán THPT",
      source: `Gemini (${usedModel})`,
      stages,
      vocab: Array.isArray(parsed.vocab) ? parsed.vocab : [],
      mastered_line_ids: [],
      created_at: new Date().toISOString(),
    };

    const supabase = await createServerSupabase();
    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: inserted } = await supabase
          .from("lessons")
          .insert({
            user_id: user.id,
            grade: script.grade,
            duration: script.duration,
            title_en: script.title_en,
            title_vi: script.title_vi,
            source: script.source,
            stages: script.stages,
            vocab: script.vocab,
            mastered_line_ids: [],
          })
          .select("id, created_at")
          .single();

        if (inserted) {
          script.id = inserted.id;
          script.created_at = inserted.created_at;
        }
      }
    }

    return NextResponse.json({ script, usedModel });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lỗi sinh kịch bản.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
