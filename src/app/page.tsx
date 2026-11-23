"use client";

import { useCallback, useEffect, useState } from "react";
import { FilePlus2, Headphones, Sigma, FolderOpen, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { DEMO_LESSON } from "@/lib/demo-data";
import { AuthBar } from "./components/AuthBar";
import { LessonUploader } from "./components/LessonUploader";
import { ShadowingStudio } from "./components/ShadowingStudio";
import { MathGlossary } from "./components/MathGlossary";
import { LibraryExport } from "./components/LibraryExport";
import type { LessonScript } from "@/types/mathspeak";

type TabId = "input" | "studio" | "glossary" | "library";

export default function MathSpeakHomePage() {
  const [tab, setTab] = useState<TabId>("input");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [lessons, setLessons] = useState<LessonScript[]>([DEMO_LESSON]);
  const [currentScript, setCurrentScript] = useState<LessonScript>(DEMO_LESSON);
  const [toast, setToast] = useState<string | null>(null);

  const notify = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((prev) => (prev === msg ? null : prev));
    }, 3600);
  }, []);

  // Register PWA Service Worker
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  const syncUserAndLessons = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUserEmail(user?.email || null);

    if (user) {
      try {
        const resp = await fetch("/api/lessons");
        const data = await resp.json();
        if (Array.isArray(data.lessons) && data.lessons.length > 0) {
          setLessons(data.lessons);
          setCurrentScript((prev) => (prev.is_demo ? data.lessons[0] : prev));
        } else {
          setLessons([DEMO_LESSON]);
        }
      } catch {
        // Keep current state
      }
    } else {
      setLessons([DEMO_LESSON]);
    }
  }, []);

  useEffect(() => {
    syncUserAndLessons();
  }, [syncUserAndLessons]);

  function handleScriptCreated(script: LessonScript) {
    setCurrentScript(script);
    setLessons((prev) => [script, ...prev.filter((x) => x.id !== script.id)]);
    setTab("studio");
  }

  async function handleToggleMastered(lineId: string) {
    const existing = new Set(currentScript.mastered_line_ids || []);
    if (existing.has(lineId)) existing.delete(lineId);
    else existing.add(lineId);
    const updatedIds = Array.from(existing);

    const updatedScript = { ...currentScript, mastered_line_ids: updatedIds };
    setCurrentScript(updatedScript);
    setLessons((prev) => prev.map((l) => (l.id === updatedScript.id ? updatedScript : l)));

    // Sync to Supabase if authenticated and real UUID
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(updatedScript.id);
    if (userEmail && isUuid) {
      await fetch(`/api/lessons/${updatedScript.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mastered_line_ids: updatedIds }),
      }).catch(() => {});
    }
  }

  async function handleDeleteLesson(id: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (userEmail && isUuid) {
      const resp = await fetch(`/api/lessons/${id}`, { method: "DELETE" });
      if (!resp.ok) {
        notify("Không thể xóa bài trên đám mây.");
        return;
      }
    }
    const next = lessons.filter((l) => l.id !== id);
    const safeList = next.length ? next : [DEMO_LESSON];
    setLessons(safeList);
    if (currentScript.id === id) setCurrentScript(safeList[0]);
    notify("Đã xóa kịch bản.");
  }

  const navItems: Array<{ id: TabId; label: string; Icon: typeof FilePlus2 }> = [
    { id: "input", label: "Nhập KHBD", Icon: FilePlus2 },
    { id: "studio", label: "Luyện đọc", Icon: Headphones },
    { id: "glossary", label: "Ký hiệu", Icon: Sigma },
    { id: "library", label: "Thư viện", Icon: FolderOpen },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 bg-slate-900 text-white shadow-md">
        <div className="max-w-6xl mx-auto px-3 sm:px-5 h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="/author-avatar.png"
              alt="Thầy Vũ AI"
              className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-400/80 shrink-0 bg-slate-800"
            />
            <div className="truncate">
              <h1 className="text-sm sm:text-base font-bold leading-tight truncate">
                MathSpeak Studio V4
              </h1>
              <p className="text-[11px] text-slate-300 leading-tight truncate">
                Người tạo: Thầy Vũ AI-Trường THPT số 2 Nguyễn Du-Xã Uar
              </p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg">
            {navItems.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition ${
                  tab === id
                    ? "bg-indigo-600 text-white font-semibold"
                    : "text-slate-300 hover:text-white hover:bg-slate-700/70"
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </nav>

          <AuthBar
            userEmail={userEmail}
            onAuthChange={syncUserAndLessons}
            onNotify={notify}
          />
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden border-t border-slate-800 px-2 py-1.5 grid grid-cols-4 gap-1 bg-slate-900">
          {navItems.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`py-1.5 rounded-md text-[11px] font-medium flex flex-col items-center gap-0.5 ${
                tab === id ? "bg-indigo-600 text-white font-semibold" : "text-slate-400"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-5 py-5">
        {tab === "input" && (
          <LessonUploader
            onScriptCreated={handleScriptCreated}
            onOpenDemo={() => {
              setCurrentScript(DEMO_LESSON);
              setTab("studio");
            }}
            onNotify={notify}
          />
        )}

        {tab === "studio" && (
          <ShadowingStudio
            script={currentScript}
            onToggleMastered={handleToggleMastered}
            onNotify={notify}
          />
        )}

        {tab === "glossary" && <MathGlossary vocab={currentScript.vocab || []} />}

        {tab === "library" && (
          <LibraryExport
            currentScript={currentScript}
            lessons={lessons}
            isAuthenticated={!!userEmail}
            onSelectLesson={(l) => {
              setCurrentScript(l);
              setTab("studio");
            }}
            onDeleteLesson={handleDeleteLesson}
            onNotify={notify}
          />
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white/90 py-3.5 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-slate-600">
          <div className="flex items-center gap-2.5">
            <img
              src="/author-avatar.png"
              alt="Thầy Vũ AI"
              className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-200 shrink-0"
            />
            <span className="font-semibold text-slate-800">
              Người tạo: Thầy Vũ AI-Trường THPT số 2 Nguyễn Du-Xã Uar
            </span>
          </div>
          <a
            href="https://www.facebook.com/truong.thanhvu.90813236/?locale=vi_VN"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold border border-blue-200 transition"
          >
            <span>Liên hệ Facebook</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </footer>

      {toast && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white bg-slate-900 border border-slate-700">
          {toast}
        </div>
      )}
    </div>
  );
}
