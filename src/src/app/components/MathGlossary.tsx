"use client";

import { useState } from "react";
import { Layers, Volume2 } from "lucide-react";
import { renderPureLatex } from "@/lib/math-format";
import type { VocabItem } from "@/types/mathspeak";

interface MathGlossaryProps {
  vocab: VocabItem[];
}

export function MathGlossary({ vocab }: MathGlossaryProps) {
  const [flashcard, setFlashcard] = useState(false);
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  function speak(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Bảng Thuật ngữ &amp; Cách đọc Ký hiệu Toán học
          </h2>
          <p className="text-sm text-slate-600">
            Bấm loa để nghe phát âm chuẩn hoặc bật chế độ Thẻ nhớ để tự kiểm tra.
          </p>
        </div>
        <button
          onClick={() => {
            setFlashcard(!flashcard);
            setRevealed({});
          }}
          className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 flex items-center gap-1.5"
        >
          <Layers className="w-4 h-4" />
          {flashcard ? "Tắt chế độ Thẻ nhớ" : "Bật chế độ Thẻ nhớ"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {vocab.map((item, idx) => {
          const isHidden = flashcard && !revealed[idx];
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col justify-between gap-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div
                    className="inline-block px-3 py-1.5 rounded-xl bg-slate-100 text-slate-900 font-semibold text-base mb-1.5"
                    dangerouslySetInnerHTML={{ __html: renderPureLatex(item.symbol_latex) }}
                  />
                  <p className="text-sm font-semibold text-slate-700">{item.meaning_vi}</p>
                </div>
                <button
                  onClick={() => speak(item.spoken_how || item.term_en)}
                  className="p-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 shrink-0"
                  title="Nghe phát âm"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              {isHidden ? (
                <button
                  onClick={() => setRevealed((p) => ({ ...p, [idx]: true }))}
                  className="w-full py-2.5 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100"
                >
                  Bấm để xem cách đọc tiếng Anh &amp; phiên âm
                </button>
              ) : (
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <p className="text-sm font-bold text-indigo-900">{item.term_en}</p>
                  <p className="text-xs text-amber-900 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200">
                    <span className="font-semibold">Đọc là:</span> &ldquo;{item.spoken_how}&rdquo;
                  </p>
                  {item.ipa && <p className="text-xs text-slate-500 font-mono">{item.ipa}</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
