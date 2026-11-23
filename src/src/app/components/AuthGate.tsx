"use client";

import { useState } from "react";
import { LogIn, UserPlus, ExternalLink, ShieldCheck, BookOpen, Mic } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface AuthGateProps {
  onAuthenticated: () => void;
  onNotify: (msg: string) => void;
}

export function AuthGate({ onAuthenticated, onNotify }: AuthGateProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [fullName, setFullName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    if (!supabase) {
      onNotify("Chưa cấu hình biến môi trường Supabase.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              school_name: schoolName.trim(),
            },
          },
        });
        if (error) throw error;
        onNotify("Đăng ký thành công! Đang vào không gian làm việc của thầy/cô...");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onNotify("Đăng nhập thành công!");
      }
      onAuthenticated();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : "Đăng nhập thất bại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white px-4 py-8">
      <div className="max-w-4xl w-full mx-auto my-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left: Intro & Author */}
        <div className="space-y-5">
          <div className="flex items-center gap-3.5">
            <img
              src="/author-avatar.png"
              alt="Thầy Vũ AI"
              className="w-16 h-16 rounded-full object-cover ring-2 ring-indigo-400 shadow-lg"
            />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">MathSpeak Studio V4</h1>
              <p className="text-xs text-indigo-200 mt-0.5">
                Người tạo: Thầy Vũ AI-Trường THPT số 2 Nguyễn Du-Xã Uar
              </p>
            </div>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            Trợ lý chuyển đổi Kế hoạch bài dạy Toán THPT sang kịch bản giảng dạy hoàn toàn bằng tiếng Anh, tích hợp trình luyện đọc theo câu và AI chấm phát âm.
          </p>

          <div className="space-y-2.5 text-xs text-slate-200">
            <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-xl p-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Tặng ngay <strong>2 lượt tạo giáo án dùng thử miễn phí</strong> cho mỗi tài khoản mới; sau đó nhập Gemini API Key cá nhân để dùng không giới hạn.</span>
            </div>
            <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-xl p-3">
              <BookOpen className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Mỗi giáo viên có <strong>kho thư viện bài giảng riêng</strong> đồng bộ đám mây trên cả máy tính và điện thoại.</span>
            </div>
            <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-xl p-3">
              <Mic className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Ghi âm giọng đọc và nhận đánh giá chi tiết từng thuật ngữ Toán học bằng AI.</span>
            </div>
          </div>

          <a
            href="https://www.facebook.com/truong.thanhvu.90813236/?locale=vi_VN"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-300 hover:text-white transition"
          >
            <span>Liên hệ Facebook Thầy Vũ AI</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Right: Login / Signup Card */}
        <div className="bg-white text-slate-900 rounded-2xl shadow-2xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`py-2 rounded-lg transition ${
                mode === "login" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600"
              }`}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`py-2 rounded-lg transition ${
                mode === "signup" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600"
              }`}
            >
              Đăng ký mới
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === "signup" && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Họ và tên Giáo viên
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500"
                    placeholder="Ví dụ: Nguyễn Văn A"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Trường / Đơn vị công tác
                  </label>
                  <input
                    type="text"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500"
                    placeholder="Ví dụ: THPT Số 2 Nguyễn Du"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500"
                placeholder="giaovien@gmail.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mật khẩu</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500"
                placeholder="Tối thiểu 6 ký tự"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2 transition"
            >
              {mode === "login" ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              <span>
                {loading
                  ? "Đang xử lý..."
                  : mode === "login"
                  ? "Đăng nhập vào ứng dụng"
                  : "Đăng ký & Nhận 2 lượt dùng thử"}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
