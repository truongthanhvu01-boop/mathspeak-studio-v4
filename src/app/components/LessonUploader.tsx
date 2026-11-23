"use client";

import { useRef, useState } from "react";
import { UploadCloud, Sparkles, PlayCircle, KeyRound } from "lucide-react";
import { SAMPLE_INPUT_12 } from "@/lib/demo-data";
import type { LessonScript } from "@/types/mathspeak";

interface LessonUploaderProps {
  hasPersonalKey: boolean;
  trialUsed: number;
  trialLimit: number;
  onScriptCreated: (script: LessonScript) => void;
  onOpenDemo: () => void;
  onNeedApiKey: () => void;
  onNotify: (msg: string) => void;
}

export function LessonUploader({
  hasPersonalKey,
  trialUsed,
  trialLimit,
  onScriptCreated,
  onOpenDemo,
  onNeedApiKey,
  onNotify,
}: LessonUploaderProps) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [lessonText, setLessonText] = useState("");
  const [grade, setGrade] = useState("Lớp 12");
  const [level, setLevel] = useState("friendly");
  const [style, setStyle] = useState("interactive");
  const [fileStatus, setFileStatus] = useState(
    "Hỗ trợ .docx, .txt, .md — trích xuất văn bản trực tiếp trên máy chủ."
  );
  const [loading, setLoading] = useState(false);

  const remaining = Math.max(0, trialLimit - trialUsed);

  async function handleFile(file: File) {
    setFileStatus(`Đang trích xuất nội dung từ "${file.name}"...`);
    try {
      const form = new FormData();
      form.append("file", file);
      const resp = await fetch("/api/parse-docx", { method: "POST", body: form });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Lỗi đọc file.");
      setLessonText(data.text || "");
      setFileStatus(`Đã đọc xong "${file.name}" (${data.length} ký tự).`);
      onNotify(`Đã trích xuất nội dung từ ${file.name}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Không thể đọc file.";
      setFileStatus(msg);
      onNotify(msg);
    }
  }

  async function handleGenerate() {
    if (!lessonText.trim()) {
      onNotify("Thầy/Cô hãy tải file giáo án hoặc dán nội dung KHBD trước nhé.");
      return;
    }
    if (!hasPersonalKey && remaining <= 0) {
      onNeedApiKey();
      onNotify("Đã hết lượt dùng thử miễn phí. Vui lòng nhập Gemini API Key cá nhân để tiếp tục.");
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch("/api/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonText, grade, level, style }),
      });
      const data = await resp.json();
      if (resp.status === 402 || data.code === "TRIAL_EXHAUSTED") {
        onNeedApiKey();
        onNotify(data.error || "Đã hết lượt dùng thử, vui lòng nhập API Key cá nhân.");
        return;
      }
      if (!resp.ok) throw new Error(data.error || "Không thể tạo kịch bản.");
      onScriptCreated(data.script);
      onNotify(`Đã tạo kịch bản thành công (${data.usedModel}) và lưu vào kho riêng!`);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : "Lỗi gọi Gemini AI.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Tải Kế hoạch bài dạy (KHBD) để AI biên soạn kịch bản Tiếng Anh
          </h2>
          <p className="text-sm text-slate-600">
            {hasPersonalKey ? (
              <span className="text-emerald-700 font-medium">
                Đang dùng Gemini API Key cá nhân (Không giới hạn lượt).
              </span>
            ) : (
              <span>
                Lượt dùng thử miễn phí còn lại:{" "}
                <strong className={remaining > 0 ? "text-indigo-700" : "text-rose-600"}>
                  {remaining}/{trialLimit} lượt
                </strong>
                .{" "}
                <button
                  type="button"
                  onClick={onNeedApiKey}
                  className="text-indigo-600 hover:underline font-semibold"
                >
                  Nhập API Key cá nhân
                </button>
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setLessonText(SAMPLE_INPUT_12);
            setGrade("Lớp 12");
            onNotify("Đã nạp giáo án mẫu Toán 12.");
          }}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 shrink-0 transition"
        >
          Nạp mẫu Toán 12
        </button>
      </div>

      {/* Dropzone */}
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f) handleFile(f);
        }}
        className="border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-xl p-5 text-center bg-slate-50/70 transition cursor-pointer"
      >
        <input
          ref={fileRef}
          type="file"
          accept=".docx,.txt,.md"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
            <UploadCloud className="w-5 h-5" />
          </div>
          <p className="text-sm font-semibold text-slate-700">
            Bấm chọn file Giáo án (.docx, .txt, .md) hoặc kéo thả vào đây
          </p>
          <p className="text-xs text-slate-500">{fileStatus}</p>
        </div>
      </div>

      {/* Textarea */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            Nội dung Kế hoạch bài dạy
          </label>
          <button
            type="button"
            onClick={() => setLessonText("")}
            className="text-xs text-slate-500 hover:text-rose-600"
          >
            Xóa nội dung
          </button>
        </div>
        <textarea
          rows={8}
          value={lessonText}
          onChange={(e) => setLessonText(e.target.value)}
          className="w-full rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 p-3.5 text-sm leading-relaxed outline-none"
          placeholder="Dán nội dung Kế hoạch bài dạy Toán THPT vào đây (nên dán từng tiết 45 phút để kịch bản ra nhanh và sát nhất)..."
        />
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Khối lớp</label>
          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none"
          >
            <option value="Lớp 12">Toán Lớp 12</option>
            <option value="Lớp 11">Toán Lớp 11</option>
            <option value="Lớp 10">Toán Lớp 10</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Mức độ Tiếng Anh
          </label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none"
          >
            <option value="friendly">Dễ hiểu cho HS Việt Nam (B1–B2)</option>
            <option value="academic">Chuẩn học thuật song ngữ (B2–C1)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Phong cách đứng lớp
          </label>
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none"
          >
            <option value="interactive">Tương tác hỏi – đáp nhiều</option>
            <option value="concise">Giảng giải ngắn gọn, mạch lạc</option>
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
        {!hasPersonalKey && remaining <= 0 ? (
          <button
            type="button"
            onClick={onNeedApiKey}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 flex items-center gap-1.5"
          >
            <KeyRound className="w-4 h-4" /> Nhập Gemini API Key cá nhân để tiếp tục
          </button>
        ) : (
          <span />
        )}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenDemo}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 flex items-center gap-2 transition"
          >
            <PlayCircle className="w-4 h-4" /> Xem kịch bản mẫu
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleGenerate}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2 shadow-sm transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? "Gemini AI đang biên soạn..." : "Tạo kịch bản bằng Gemini AI"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
