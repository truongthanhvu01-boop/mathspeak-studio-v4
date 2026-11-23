"use client";

import { useState } from "react";
import { KeyRound, X, Eye, EyeOff, CheckCircle2 } from "lucide-react";

interface ApiKeyModalProps {
  open: boolean;
  hasPersonalKey: boolean;
  trialUsed: number;
  trialLimit: number;
  onClose: () => void;
  onSaved: () => void;
  onNotify: (msg: string) => void;
}

export function ApiKeyModal({
  open,
  hasPersonalKey,
  trialUsed,
  trialLimit,
  onClose,
  onSaved,
  onNotify,
}: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  async function saveKey(newKey: string) {
    setSaving(true);
    try {
      const resp = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personal_api_key: newKey }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Không lưu được API Key.");
      setApiKey("");
      onSaved();
      onClose();
      onNotify(
        newKey
          ? "Đã lưu Gemini API Key cá nhân! Thầy/Cô có thể dùng không giới hạn."
          : "Đã xóa API Key cá nhân."
      );
    } catch (err) {
      onNotify(err instanceof Error ? err.message : "Lỗi lưu API Key.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-slate-200 overflow-hidden text-slate-900">
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-base">Cài đặt Gemini API Key cá nhân</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
            <span>
              Trạng thái hiện tại:{" "}
              {hasPersonalKey ? (
                <strong className="text-emerald-700 inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Đang dùng API Key cá nhân (Không giới hạn)
                </strong>
              ) : (
                <strong className="text-amber-700">
                  Dùng thử miễn phí: đã dùng {trialUsed}/{trialLimit} lượt
                </strong>
              )}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-100 text-xs text-indigo-900 space-y-1.5">
            <p className="font-semibold">Cách lấy Gemini API Key miễn phí trong 1 phút:</p>
            <ol className="list-decimal list-inside space-y-1 text-indigo-800">
              <li>
                Truy cập <strong>aistudio.google.com/apikey</strong> và đăng nhập Gmail.
              </li>
              <li>
                Bấm <strong>Create API key</strong> rồi sao chép chuỗi bắt đầu bằng{" "}
                <code>AIza...</code>
              </li>
              <li>Dán vào ô bên dưới và bấm <strong>Lưu API Key</strong> (chỉ tài khoản của thầy/cô mới dùng được khóa này).</li>
            </ol>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Gemini API Key cá nhân
            </label>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 pr-10 text-sm outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            {hasPersonalKey ? (
              <button
                type="button"
                disabled={saving}
                onClick={() => saveKey("")}
                className="text-xs font-medium text-rose-600 hover:text-rose-700"
              >
                Xóa API Key cá nhân
              </button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Đóng
              </button>
              <button
                type="button"
                disabled={saving || !apiKey.trim()}
                onClick={() => saveKey(apiKey.trim())}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? "Đang lưu..." : "Lưu API Key"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
