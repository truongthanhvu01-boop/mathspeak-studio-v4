"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FilePlus2,
  Headphones,
  Sigma,
  FolderOpen,
  ExternalLink,
  KeyRound,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { DEMO_LESSON } from "@/lib/demo-data";
import { AuthGate } from "./components/AuthGate";
import { ApiKeyModal } from "./components/ApiKeyModal";
import { LessonUploader } from "./components/LessonUploader";
import { ShadowingStudio } from "./components/ShadowingStudio";
import { MathGlossary } from "./components/MathGlossary";
import { LibraryExport } from "./components/LibraryExport";
import type { LessonScript } from "@/types/mathspeak";

type TabId = "input" | "studio" | "glossary" | "library";

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  school_name: string;
  trial_used: number;
  trial_limit: number;
  has_personal_key: boolean;
  key_hint?: string;
}

export default function MathSpeakHomePage() {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tab, setTab] = useState<TabId>("input");
  const [lessons, setLessons] = useState<LessonScript[]>([DEMO_LESSON]);
  const [currentScript, setCurrentScript] = useState<LessonScript>(DEMO_LESSON);
  const [apiModalOpen, setApiModalOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gemini-3.8-flash");
  const [toast, setToast] = useState<string | null>(null);

  const notify = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((prev) => (prev === msg ? null : prev));
    }, 3800);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  const syncUserAndLessons = useCallback(async () => {
    setCheckingAuth(true);
    try {
      const profResp = await fetch("/api/profile");
      const profData = await profResp.json();
      if (!profData.authenticated || !profData.profile) {
        setProfile(null);
        setLessons([DEMO_LESSON]);
        return;
      }
      setProfile(profData.profile);

      const lesResp = await fetch("/api/lessons");
      const lesData = await lesResp.json();
      if (Array.isArray(lesData.lessons) && lesData.lessons.length > 0) {
        setLessons(lesData.lessons);
        setCurrentScript((prev) => (prev.is_demo ? lesData.lessons[0] : prev));
      } else {
        setLessons([DEMO_LESSON]);
      }
    } catch {
      setProfile(null);
    } finally {
      setCheckingAuth(false);
    }
  }, []);

  useEffect(() => {
    syncUserAndLessons();
  }, [syncUserAndLessons]);

  async function handleSignOut() {
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    setProfile(null);
    setLessons([DEMO_LESSON]);
    setCurrentScript(DEMO_LESSON);
    notify("Đã đăng xuất.");
  }

  function handleScriptCreated(script: LessonScript) {
    setCurrentScript(script);
    setLessons((prev) => [script, ...prev.filter((x) => x.id !== script.id && !x.is_demo)]);
    setTab("studio");
    syncUserAndLessons();
  }

  async function handleToggleMastered(lineId: string) {
    const existing = new Set(currentScript.mastered_line_ids || []);
    if (existing.has(lineId)) existing.delete(lineId);
    else existing.add(lineId);
    const updatedIds = Array.from(existing);

    const updatedScript = { ...currentScript, mastered_line_ids: updatedIds };
    setCurrentScript(updatedScript);
    setLessons((prev) => prev.map((l) => (l.id === updatedScript.id ? updatedScript : l)));

    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(updatedScript.id);
    if (profile && isUuid) {
      await fetch(`/api/lessons/${updatedScript.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mastered_line_ids: updatedIds }),
      }).catch(() => {});
    }
  }

  async function handleDeleteLesson(id: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (profile && isUuid) {
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
    notify("Đã xóa kịch bản khỏi kho của thầy/cô.");
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white text-sm">
        Đang tải MathSpeak Studio V4...
      </div>
    );
  }

  if (!profile) {
    return (
      <>
        <AuthGate onAuthenticated={syncUserAndLessons} onNotify={notify} />
        {toast && (
          <div className="fixed bottom-4 right-4 z-50 max-w-sm px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white bg-slate-900 border border-slate-700">
            {toast}
          </div>
        )}
      </>
    );
  }

  const remaining = Math.max(0, profile.trial_limit - profile.trial_used);
  const navItems: Array<{ id: TabId; label: string; Icon: typeof FilePlus2 }> = [
    { id: "input", label: "Nhập KHBD", Icon: FilePlus2 },
    { id: "studio", label: "Luyện đọc", Icon: Headphones },
    { id: "glossary", label: "Ký hiệu", Icon: Sigma },
    { id: "library", label: "Kho riêng", Icon: FolderOpen },
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

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setApiModalOpen(true)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition ${
                profile.has_personal_key
                  ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/30"
                  : remaining > 0
                  ? "bg-amber-500/20 border-amber-400/40 text-amber-200 hover:bg-amber-500/30"
                  : "bg-rose-500/20 border-rose-400/40 text-rose-200 hover:bg-rose-500/30"
              }`}
              title="Cài đặt Gemini API Key cá nhân"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>
                {profile.has_personal_key ? "Đổi Key ✓" : `Key (${remaining}/${profile.trial_limit})`}
              </span>
            </button>

            <button
              onClick={handleSignOut}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 flex items-center gap-1.5 transition"
              title={`Đăng xuất (${profile.email})`}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden lg:inline max-w-[110px] truncate">
                {profile.full_name || profile.email}
              </span>
            </button>
          </div>
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
            hasPersonalKey={profile.has_personal_key}
            trialUsed={profile.trial_used}
            trialLimit={profile.trial_limit}
            selectedModel={selectedModel}
            onScriptCreated={handleScriptCreated}
            onOpenDemo={() => {
              setCurrentScript(DEMO_LESSON);
              setTab("studio");
            }}
            onNeedApiKey={() => setApiModalOpen(true)}
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
            isAuthenticated={true}
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

      <ApiKeyModal
        open={apiModalOpen}
        hasPersonalKey={profile.has_personal_key}
        keyHint={profile.key_hint || ""}
        trialUsed={profile.trial_used}
        trialLimit={profile.trial_limit}
        selectedModel={selectedModel}
        onModelChange={(m) => setSelectedModel(m)}
        onClose={() => setApiModalOpen(false)}
        onSaved={syncUserAndLessons}
        onNotify={notify}
      />

      {toast && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white bg-slate-900 border border-slate-700">
          {toast}
        </div>
      )}
    </div>
  );
}
