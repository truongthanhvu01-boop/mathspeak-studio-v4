"use client";

import { useState } from "react";
import { LogIn, LogOut, UserCheck, X, Cloud } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface AuthBarProps {
  userEmail: string | null;
  onAuthChange: () => void;
  onNotify: (msg: string) => void;
}

export function AuthBar({ userEmail, onAuthChange, onNotify }: AuthBarProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    if (!supabase) {
      onNotify("Chưa cấu hình biến môi trường Supabase (.env.local / Vercel).");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        onNotify("Đăng ký thành công! Kiểm tra email xác nhận hoặc đăng nhập ngay.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onNotify("Đăng nhập thành công! Đã đồng bộ kho giáo án đám mây.");
      }
      setOpen(false);
      setPassword("");
      onAuthChange();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : "Đăng nhập thất bại.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    onNotify("Đã đăng xuất.");
    onAuthChange();
  }

  if (userEmail) {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-medium">
          <UserCheck className="w-3.5 h-3.5" />
          <span className="max-w-[150px] truncate">{userEmail}</span>
        </span>
        <button
          onClick={handleSignOut}
          className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 flex items-center gap-1.5 transition"
          title="Đăng xuất"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Thoát</span>
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition"
      >
        <LogIn className="w-3.5 h-3.5" />
        <span>Đăng nhập Cloud</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-200 overflow-hidden text-slate-900">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cloud className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base">
                  {mode === "login" ? "Đăng nhập tài khoản Giáo viên" : "Tạo tài khoản mới"}
                </h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <p className="text-xs text-slate-600">
                Đăng nhập để lưu kho giáo án Toán 10–11–12, tiến độ luyện thuộc và lịch sử chấm phát âm đồng bộ giữa máy tính và điện thoại.
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500"
                  placeholder="giaovien@truongthpt.edu.vn"
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
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold transition"
              >
                {loading
                  ? "Đang xử lý..."
                  : mode === "login"
                  ? "Đăng nhập"
                  : "Đăng ký tài khoản"}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setMode(mode === "login" ? "signup" : "login")}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  {mode === "login"
                    ? "Chưa có tài khoản? Đăng ký miễn phí"
                    : "Đã có tài khoản? Quay lại đăng nhập"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
