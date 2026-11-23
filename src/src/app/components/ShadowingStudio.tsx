"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Play,
  Square,
  Volume2,
  Repeat,
  Mic,
  Check,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { renderMathInText } from "@/lib/math-format";
import type { LessonScript, PronunciationResult, ScriptLine } from "@/types/mathspeak";

interface ShadowingStudioProps {
  script: LessonScript;
  onToggleMastered: (lineId: string) => void;
  onNotify: (msg: string) => void;
}

interface EvalState {
  loading?: boolean;
  error?: string;
  data?: PronunciationResult;
}

export function ShadowingStudio({
  script,
  onToggleMastered,
  onNotify,
}: ShadowingStudioProps) {
  const [selectedStageId, setSelectedStageId] = useState<string>("all");
  const [showVi, setShowVi] = useState(true);
  const [showSpoken, setShowSpoken] = useState(true);
  const [teacherOnly, setTeacherOnly] = useState(false);

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState("");
  const [rate, setRate] = useState(0.85);
  const [repeatCount, setRepeatCount] = useState(1);
  const [pauseMs, setPauseMs] = useState(2000);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLineId, setCurrentLineId] = useState<string | null>(null);
  const [loopLineId, setLoopLineId] = useState<string | null>(null);

  const [recordingLineId, setRecordingLineId] = useState<string | null>(null);
  const [recordings, setRecordings] = useState<Record<string, { url: string; blob: Blob; mime: string }>>({});
  const [evaluations, setEvaluations] = useState<Record<string, EvalState>>({});

  const playRef = useRef({ active: false, loopId: null as string | null, timer: null as ReturnType<typeof setTimeout> | null });
  const recorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    setSelectedStageId("all");
    stopSpeech();
  }, [script.id]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const load = () => {
      const all = window.speechSynthesis.getVoices();
      const en = all.filter((v) => v.lang?.toLowerCase().startsWith("en"));
      const list = en.length ? en : all;
      setVoices(list);
      if (list.length && !voiceURI) {
        setVoiceURI(list[0].voiceURI);
      }
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => stopSpeech();
  }, []);

  const allLines = useMemo(() => {
    const out: ScriptLine[] = [];
    (script.stages || []).forEach((st) => (st.lines || []).forEach((l) => out.push(l)));
    return out;
  }, [script]);

  const masteredSet = useMemo(
    () => new Set(script.mastered_line_ids || []),
    [script.mastered_line_ids]
  );

  const masteryPct = allLines.length
    ? Math.round((allLines.filter((l) => masteredSet.has(l.id)).length / allLines.length) * 100)
    : 0;

  function stopSpeech() {
    if (playRef.current.timer) clearTimeout(playRef.current.timer);
    playRef.current.active = false;
    playRef.current.loopId = null;
    setIsPlaying(false);
    setCurrentLineId(null);
    setLoopLineId(null);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }

  function speakTextOnce(text: string, onEnd?: () => void) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      onNotify("Trình duyệt không hỗ trợ đọc giọng nói.");
      onEnd?.();
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.rate = rate;
    const chosen = voices.find((v) => v.voiceURI === voiceURI);
    if (chosen) {
      utter.voice = chosen;
      utter.lang = chosen.lang;
    }
    utter.onend = () => onEnd?.();
    utter.onerror = () => onEnd?.();
    window.speechSynthesis.speak(utter);
  }

  function playLine(line: ScriptLine, loop: boolean) {
    stopSpeech();
    playRef.current.active = true;
    playRef.current.loopId = loop ? line.id : null;
    setIsPlaying(true);
    setCurrentLineId(line.id);
    setLoopLineId(loop ? line.id : null);

    const run = () => {
      if (!playRef.current.active) return;
      speakTextOnce(line.spoken_en || line.display_en, () => {
        if (!playRef.current.active) return;
        if (playRef.current.loopId === line.id) {
          playRef.current.timer = setTimeout(run, Math.max(800, pauseMs));
        } else {
          stopSpeech();
        }
      });
    };
    run();
  }

  function playAll() {
    stopSpeech();
    const stages = (script.stages || []).filter(
      (st) => selectedStageId === "all" || st.id === selectedStageId
    );
    const lines: ScriptLine[] = [];
    stages.forEach((st) => {
      (st.lines || []).forEach((l) => {
        if (!teacherOnly || l.role === "Teacher" || l.role === "Board") {
          for (let i = 0; i < repeatCount; i++) lines.push(l);
        }
      });
    });
    if (!lines.length) {
      onNotify("Không có câu nào trong bộ lọc hiện tại.");
      return;
    }

    playRef.current.active = true;
    setIsPlaying(true);
    let idx = 0;

    const next = () => {
      if (!playRef.current.active || idx >= lines.length) {
        stopSpeech();
        return;
      }
      const line = lines[idx++];
      setCurrentLineId(line.id);
      speakTextOnce(line.spoken_en || line.display_en, () => {
        if (!playRef.current.active) return;
        playRef.current.timer = setTimeout(next, pauseMs);
      });
    };
    next();
  }

  async function toggleRecord(line: ScriptLine) {
    if (recordingLineId === line.id && recorderRef.current) {
      recorderRef.current.stop();
      return;
    }
    if (recorderRef.current && recorderRef.current.state === "recording") {
      recorderRef.current.stop();
    }
    stopSpeech();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: BlobPart[] = [];
      const rec = new MediaRecorder(stream);
      recorderRef.current = rec;
      setRecordingLineId(line.id);

      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const mime = (rec.mimeType || "audio/webm").split(";")[0].trim() || "audio/webm";
        const blob = new Blob(chunks, { type: mime });
        const url = URL.createObjectURL(blob);
        setRecordings((prev) => ({ ...prev, [line.id]: { url, blob, mime } }));
        setRecordingLineId(null);
        recorderRef.current = null;
        evaluateAudio(line, blob, mime);
      };
      rec.start();
    } catch {
      setRecordingLineId(null);
      onNotify("Không truy cập được micro. Vui lòng cấp quyền Micro cho trình duyệt.");
    }
  }

  async function evaluateAudio(line: ScriptLine, blob: Blob, mime: string) {
    setEvaluations((prev) => ({ ...prev, [line.id]: { loading: true } }));
    try {
      const form = new FormData();
      form.append("audio", new File([blob], "recording.webm", { type: mime }));
      form.append("targetText", line.spoken_en || line.display_en);
      form.append("lessonId", script.id);
      form.append("lineId", line.id);

      const resp = await fetch("/api/evaluate-audio", { method: "POST", body: form });
      const payload = await resp.json();
      if (!resp.ok) throw new Error(payload.error || "Không thể chấm phát âm.");

      setEvaluations((prev) => ({ ...prev, [line.id]: { loading: false, data: payload.result } }));
      onNotify(`Đã chấm xong: ${payload.result.score}/100 (${payload.result.verdict})`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Lỗi chấm phát âm.";
      setEvaluations((prev) => ({ ...prev, [line.id]: { loading: false, error: msg } }));
      onNotify(msg);
    }
  }

  const visibleStages = (script.stages || []).filter(
    (st) => selectedStageId === "all" || st.id === selectedStageId
  );

  return (
    <div className="space-y-4">
      {/* Header & Mastery */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
              {script.grade}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
              {script.duration}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
              {script.source}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">{script.title_en}</h2>
          <p className="text-sm text-slate-500">{script.title_vi}</p>
        </div>

        <div className="min-w-[235px] bg-slate-50 rounded-xl p-3 border border-slate-200">
          <div className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-700 mb-1.5">
            <span>Tiến độ luyện thuộc</span>
            <span className="text-emerald-700">
              {allLines.filter((l) => masteredSet.has(l.id)).length} / {allLines.length} câu ({masteryPct}%)
            </span>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${masteryPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Sticky Audio Bar */}
      <div className="sticky top-14 z-20 bg-white/95 backdrop-blur rounded-2xl border border-slate-200 shadow-sm p-3 sm:p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <button
              onClick={playAll}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition"
            >
              <Play className="w-4 h-4" /> Đọc cả bài
            </button>
            <button
              onClick={stopSpeech}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-rose-100 hover:text-rose-700 text-slate-700 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition"
            >
              <Square className="w-4 h-4" /> Dừng
            </button>
            {isPlaying && (
              <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium">
                Đang đọc...
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={voiceURI}
              onChange={(e) => setVoiceURI(e.target.value)}
              className="max-w-[200px] rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs outline-none"
            >
              {voices.length ? (
                voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))
              ) : (
                <option value="">Giọng tiếng Anh mặc định</option>
              )}
            </select>

            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-xs font-medium">
              {[0.7, 0.85, 1, 1.15].map((r) => (
                <button
                  key={r}
                  onClick={() => setRate(r)}
                  className={`px-2 py-1 rounded-md transition ${
                    rate === r ? "bg-white text-indigo-700 shadow-sm font-semibold" : "text-slate-600"
                  }`}
                >
                  {r}x
                </button>
              ))}
            </div>

            <select
              value={repeatCount}
              onChange={(e) => setRepeatCount(Number(e.target.value))}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs outline-none"
            >
              <option value={1}>Lặp 1 lần/câu</option>
              <option value={2}>Lặp 2 lần/câu</option>
              <option value={3}>Lặp 3 lần/câu</option>
            </select>

            <select
              value={pauseMs}
              onChange={(e) => setPauseMs(Number(e.target.value))}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs outline-none"
            >
              <option value={0}>Nghỉ 0 giây</option>
              <option value={2000}>Nghỉ 2s nhại theo</option>
              <option value={4000}>Nghỉ 4s nhại theo</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSelectedStageId("all")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                selectedStageId === "all"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Tất cả ({script.stages.length} HĐ)
            </button>
            {script.stages.map((st, idx) => (
              <button
                key={st.id}
                onClick={() => setSelectedStageId(st.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                  selectedStageId === st.id
                    ? "bg-slate-900 text-white font-semibold"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                HĐ {idx + 1}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={showVi} onChange={(e) => setShowVi(e.target.checked)} />
              <span>Hiện nghĩa Việt</span>
            </label>
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showSpoken}
                onChange={(e) => setShowSpoken(e.target.checked)}
              />
              <span>Hiện cách đọc công thức</span>
            </label>
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={teacherOnly}
                onChange={(e) => setTeacherOnly(e.target.checked)}
              />
              <span>Chỉ đọc lời GV</span>
            </label>
          </div>
        </div>
      </div>

      {/* Sentence Cards */}
      <div className="space-y-4">
        {visibleStages.map((st) => (
          <div key={st.id} className="space-y-2.5">
            <div className="px-1 pt-1 flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-800">{st.name_en}</h3>
                <p className="text-xs text-slate-500">{st.name_vi}</p>
              </div>
              <span className="text-xs text-slate-500">{st.lines.length} câu</span>
            </div>

            {st.lines.map((line, idx) => {
              const mastered = masteredSet.has(line.id);
              const isRec = recordingLineId === line.id;
              const rec = recordings[line.id];
              const ev = evaluations[line.id];
              const roleBadge =
                line.role === "Board"
                  ? "bg-amber-100 text-amber-800 border-amber-200"
                  : line.role === "Expected Student"
                  ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                  : "bg-indigo-100 text-indigo-800 border-indigo-200";

              return (
                <article
                  key={line.id}
                  className={`bg-white rounded-2xl border p-4 shadow-sm transition ${
                    mastered ? "border-emerald-300 bg-emerald-50/20" : "border-slate-200"
                  } ${currentLineId === line.id ? "line-card-speaking" : ""}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${roleBadge}`}>
                        {line.role === "Board"
                          ? "Ghi bảng (Board)"
                          : line.role === "Expected Student"
                          ? "HS phản hồi"
                          : "Lời GV giảng (Teacher)"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => playLine(line, false)}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center gap-1"
                      >
                        <Volume2 className="w-3.5 h-3.5" /> Nghe
                      </button>
                      <button
                        onClick={() =>
                          loopLineId === line.id ? stopSpeech() : playLine(line, true)
                        }
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                          loopLineId === line.id
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                        }`}
                      >
                        <Repeat className="w-3.5 h-3.5" /> Lặp
                      </button>
                      <button
                        onClick={() => toggleRecord(line)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                          isRec
                            ? "bg-rose-600 text-white animate-pulse"
                            : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {isRec ? <Square className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                        {isRec ? "Dừng ghi" : "Đọc theo"}
                      </button>
                      <button
                        onClick={() => onToggleMastered(line.id)}
                        className={`p-1.5 rounded-lg border transition ${
                          mastered
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : "bg-white border-slate-200 text-slate-400 hover:text-emerald-600"
                        }`}
                        title="Đánh dấu đã thuộc"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p
                    className="text-sm sm:text-base font-medium text-slate-900 leading-relaxed mb-2"
                    dangerouslySetInnerHTML={{ __html: renderMathInText(line.display_en) }}
                  />

                  {showSpoken && line.spoken_en && (
                    <div className="mb-2 px-3 py-2 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-950">
                      <span className="font-semibold text-amber-800">Cách đọc thành lời:</span>{" "}
                      {line.spoken_en}
                    </div>
                  )}

                  {showVi && line.vi && (
                    <p className="text-xs sm:text-sm text-slate-600 mb-1.5">
                      <span className="font-semibold text-slate-500">VI:</span> {line.vi}
                    </p>
                  )}

                  {line.ipa_tip && (
                    <p className="text-xs text-indigo-700 bg-indigo-50/60 inline-block px-2.5 py-1 rounded-lg">
                      <span className="font-semibold">Phát âm chú ý:</span> {line.ipa_tip}
                    </p>
                  )}

                  {rec && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                            <Mic className="w-3.5 h-3.5" /> Giọng đọc của thầy:
                          </span>
                          <audio controls src={rec.url} className="h-8 max-w-full" />
                        </div>
                        <button
                          onClick={() => evaluateAudio(line, rec.blob, rec.mime)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5" /> AI Chấm phát âm
                        </button>
                      </div>

                      {ev?.loading && (
                        <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900">
                          AI đang nghe bản ghi âm và phân tích lỗi phát âm...
                        </div>
                      )}

                      {ev?.error && (
                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                          {ev.error}
                        </div>
                      )}

                      {ev?.data && (
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span
                              className={`px-2.5 py-1 rounded-lg border font-bold ${
                                ev.data.score >= 85
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                  : ev.data.score >= 65
                                  ? "bg-amber-100 text-amber-800 border-amber-300"
                                  : "bg-rose-100 text-rose-800 border-rose-300"
                              }`}
                            >
                              {ev.data.score}/100 • {ev.data.verdict}
                            </span>
                            <button
                              onClick={() => evaluateAudio(line, rec.blob, rec.mime)}
                              className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                            >
                              <RefreshCw className="w-3 h-3" /> Chấm lại
                            </button>
                          </div>

                          {ev.data.heard_text && (
                            <p className="text-slate-700">
                              <span className="font-semibold text-slate-900">AI nghe được:</span>{" "}
                              <em>&ldquo;{ev.data.heard_text}&rdquo;</em>
                            </p>
                          )}

                          {ev.data.word_feedback?.length > 0 && (
                            <div className="space-y-1">
                              <p className="font-semibold text-slate-700">
                                Chi tiết từ khóa (bấm vào từ để nghe mẫu):
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {ev.data.word_feedback.map((w, wi) => (
                                  <button
                                    key={wi}
                                    type="button"
                                    onClick={() => speakTextOnce(w.word)}
                                    className={`px-2 py-0.5 rounded-md border text-xs ${
                                      w.status === "ok"
                                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                        : w.status === "missing"
                                        ? "bg-slate-100 text-slate-600 border-slate-300 line-through"
                                        : "bg-rose-50 text-rose-800 border-rose-300 font-semibold"
                                    }`}
                                  >
                                    {w.status === "ok" ? "✓" : w.status === "missing" ? "⊘" : "!"}{" "}
                                    {w.word}
                                    {w.status !== "ok" && w.tip_vi ? ` (${w.tip_vi})` : ""}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {ev.data.fixes_vi?.length > 0 && (
                            <div className="p-2.5 rounded-lg bg-rose-50/70 border border-rose-200 text-rose-950">
                              <p className="font-semibold text-rose-800 mb-1">Cần sửa cụ thể:</p>
                              <ul className="list-disc list-inside space-y-1">
                                {ev.data.fixes_vi.map((fix, fi) => (
                                  <li key={fi}>{fix}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {ev.data.praise_vi && (
                            <p className="text-emerald-800 bg-emerald-50/70 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                              <span className="font-semibold">Điểm tốt:</span> {ev.data.praise_vi}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
