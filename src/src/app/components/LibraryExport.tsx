"use client";

import { FileText, Copy, Download, Trash2, Cloud } from "lucide-react";
import type { LessonScript } from "@/types/mathspeak";

interface LibraryExportProps {
  currentScript: LessonScript;
  lessons: LessonScript[];
  isAuthenticated: boolean;
  onSelectLesson: (lesson: LessonScript) => void;
  onDeleteLesson: (id: string) => void;
  onNotify: (msg: string) => void;
}

export function LibraryExport({
  currentScript,
  lessons,
  isAuthenticated,
  onSelectLesson,
  onDeleteLesson,
  onNotify,
}: LibraryExportProps) {
  function exportDoc() {
    let body = `<h1 style="font-family:'Times New Roman',serif;color:#1e3a8a;">${currentScript.title_en}</h1>
      <p style="font-family:'Times New Roman',serif;"><strong>${currentScript.title_vi}</strong> (${currentScript.grade} - ${currentScript.duration})</p><hr/>`;
    currentScript.stages.forEach((st) => {
      body += `<h2 style="font-family:'Times New Roman',serif;">${st.name_en} — ${st.name_vi}</h2>
        <table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;width:100%;font-family:'Times New Roman',serif;font-size:12pt;">
        <tr style="background:#eef2ff;"><th>Vai trò</th><th>Kịch bản Tiếng Anh</th><th>Tiếng Việt &amp; IPA</th></tr>`;
      st.lines.forEach((l) => {
        body += `<tr><td><strong>${l.role}</strong></td><td><div>${l.display_en}</div><div style="color:#b45309;"><em>Read: ${l.spoken_en}</em></div></td><td><div>${l.vi}</div><div style="color:#4338ca;">${l.ipa_tip || ""}</div></td></tr>`;
      });
      body += `</table><br/>`;
    });
    const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'></head><body>${body}</body></html>`;
    const blob = new Blob(["\ufeff", html], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `MathSpeak_${currentScript.id}.doc`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify("Đã tải file Word song ngữ (.doc)!");
  }

  function copyScript() {
    let text = `${currentScript.title_en}\n${currentScript.title_vi}\n\n`;
    currentScript.stages.forEach((st) => {
      text += `=== ${st.name_en} ===\n`;
      st.lines.forEach((l, i) => {
        text += `${i + 1}. [${l.role}] ${l.display_en}\n   (Read: ${l.spoken_en})\n   (VI: ${l.vi})\n`;
      });
      text += "\n";
    });
    navigator.clipboard.writeText(text).then(() => onNotify("Đã sao chép toàn bộ kịch bản!"));
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(currentScript, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mathspeak_${currentScript.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify("Đã tải file dự phòng .json!");
  }

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
          Xuất kịch bản đang mở
        </h2>
        <p className="text-sm text-slate-600 mb-4">
          Tải file Word song ngữ để in lên lớp hoặc lưu dự phòng JSON.
        </p>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={exportDoc}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold flex items-center gap-2"
          >
            <FileText className="w-4 h-4" /> Tải Word song ngữ (.doc)
          </button>
          <button
            onClick={copyScript}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold flex items-center gap-2"
          >
            <Copy className="w-4 h-4" /> Sao chép kịch bản
          </button>
          <button
            onClick={exportJson}
            className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-sm font-semibold flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Xuất JSON
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Kho Kịch bản {isAuthenticated ? "Đám mây (Supabase)" : "Tạm trên trình duyệt"}
            </h2>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
            {lessons.length} bài
          </span>
        </div>

        <div className="space-y-2.5">
          {lessons.map((item) => {
            const active = item.id === currentScript.id;
            return (
              <div
                key={item.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border ${
                  active ? "border-indigo-400 bg-indigo-50/40" : "border-slate-200 bg-slate-50/40"
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-100 text-indigo-800">
                      {item.grade}
                    </span>
                    <span className="text-xs text-slate-500">{item.source}</span>
                    {active && (
                      <span className="text-[11px] font-semibold text-emerald-700">● Đang mở</span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-slate-900 truncate">{item.title_en}</p>
                  <p className="text-xs text-slate-500 truncate">{item.title_vi}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onSelectLesson(item)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Mở luyện đọc
                  </button>
                  {!item.is_demo && (
                    <button
                      onClick={() => onDeleteLesson(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      title="Xóa bài"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
