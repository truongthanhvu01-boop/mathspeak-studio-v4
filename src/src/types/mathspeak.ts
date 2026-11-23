export type LineRole = "Teacher" | "Board" | "Expected Student";

export interface ScriptLine {
  id: string;
  role: LineRole;
  display_en: string;
  spoken_en: string;
  vi: string;
  ipa_tip?: string;
}

export interface ScriptStage {
  id: string;
  name_en: string;
  name_vi: string;
  lines: ScriptLine[];
}

export interface VocabItem {
  symbol_latex: string;
  term_en: string;
  spoken_how: string;
  ipa?: string;
  meaning_vi: string;
}

export interface LessonScript {
  id: string;
  grade: string;
  duration: string;
  title_en: string;
  title_vi: string;
  source: string;
  stages: ScriptStage[];
  vocab: VocabItem[];
  mastered_line_ids?: string[];
  created_at?: string;
  is_demo?: boolean;
}

export interface WordFeedbackItem {
  word: string;
  status: "ok" | "fix" | "missing";
  tip_vi?: string;
}

export interface PronunciationResult {
  score: number;
  verdict: "Tốt" | "Khá" | "Cần luyện thêm" | string;
  heard_text: string;
  word_feedback: WordFeedbackItem[];
  fixes_vi: string[];
  praise_vi: string;
}
