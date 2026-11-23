"use client";

import { useState } from "react";
import { KeyRound, X, Eye, EyeOff, CheckCircle2, Zap } from "lucide-react";

interface ApiKeyModalProps {
  open: boolean;
  hasPersonalKey: boolean;
  keyHint: string;
  trialUsed: number;
  trialLimit: number;
  selectedModel: string;
  onModelChange: (model: string) => void;
  onClose: () => void;
  onSaved: () => void;
  onNotify: (msg: string) => void;
}

export function ApiKeyModal({
  open,
  hasPersonalKey,
  keyHint,
  trialUsed,
  trialLimit,
  selectedModel,
  onModelChange,
  onClose,
  onSaved,
  onNotify,
}: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [customModel, setCustomModel] = useState(selectedModel || "gemini-3.8-flash");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  if (!open) return null;

  async function handleTestKey() {
    if (!apiKey.trim()) {
      setTestStatus({ ok: false, msg: "Vui lòng dán API Key vào ô trước khi kiểm tra." });
      return;
    }
    setTesting(true);
    setTestStatus(null);
    try {
      const resp = await fetch("/api/test-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim(), model: customModel.trim() }),
      });
      const data = await resp.json();
      if (data.ok) {
        setTestStatus({ ok: true, msg: `Kết nối thành công với ${data.model}! Key hoạt động tốt.` });
      } else {
        setTestStatus({ ok: false, msg: data.error || "Key không hợp lệ hoặc hết hạn mức." });
      }
    } catch {
      setTestStatus({ ok: false, msg: "Lỗi mạng khi kiểm tra Key." });
    } finally {
      setTesting(false);
    }
  }

  async function saveKey(newKey: string) {
    setSaving(true);
    try {
      onModelChange(customModel.trim() || "gemini-3.8-flash");
      const resp = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personal_api_key: newKey }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Không lưu được API Key.");
      setApiKey("");
      setTestStatus(null);
      onSaved();
      onClose();
      onNotify(
        newKey
          ? "Đã lưu & chuyển sang Gemini API Key mới! Thầy/Cô có thể dùng ngay."
          : "Đã xóa Key cá nhân (chuyển về chế độ mặc định)."
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
            <h3 className="font-bold text-base">Quản lý &amp; Đổi Gemini API Key</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Current Status */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold text-slate-700">Trạng thái hiện tại:</span>
              {hasPersonalKey ? (
                <span className="text-emerald-700 font-semibold inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Đang dùng Key cá nhân ({keyHint || "Đã lưu"})
                </span>
              ) : (
                <span className="text-amber-700 font-semibold">
                  Dùng thử miễn phí ({trialUsed}/{trialLimit} lượt)
                </span>
              )}
            </div>
            <p className="text-slate-500">
              Thầy/Cô có thể dán Key mới bất cứ lúc nào để đổi ngay khi Key cũ hết hạn mức.
            </p>
          </div>

          {/* Guide */}
          <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-xs text-indigo-900 space-y-1">
            <p className="font-semibold">Cách lấy Gemini API Key miễn phí:</p>
            <p className="text-indigo-800">
              Vào <strong>aistudio.google.com/apikey</strong> -&gt; đăng nhập Gmail -&gt; bấm{" "}
              <strong>Create API key</strong> -&gt; sao chép chuỗi <code>AIza...</code> dán vào ô dưới.
            </p>
          </div>

          {/* New Key Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {hasPersonalKey ? "Nhập API Key mới để thay thế" : "Dán Gemini API Key cá nhân"}
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={show ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setTestStatus(null);
                  }}
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
              <button
                type="button"
                disabled={testing || !apiKey.trim()}
                onClick={handleTestKey}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-800 text-xs font-semibold flex items-center gap-1 shrink-0 transition"
              >
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                {testing ? "Đang thử..." : "Kiểm tra"}
              </button>
            </div>
            {testStatus && (
              <p
                className={`mt-1.5 text-xs font-medium ${
                  testStatus.ok ? "text-emerald-700" : "text-rose-600"
                }`}
              >
                {testStatus.ok ? "✓ " : "✕ "}
                {testStatus.msg}
              </p>
            )}
          </div>

          {/* Flexible Model Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mô hình Gemini (linh động đổi khi Google ra bản mới)
            </label>
            <input
              type="text"
              value={customModel}
              onChange={(e) => setCustomModel(e.target.value)}
              list="gemini-model-presets"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm outline-none focus:border-indigo-500"
              placeholder="gemini-3.8-flash"
            />
            <datalist id="gemini-model-presets">
              <option value="gemini-3.8-flash" />
              <option value="gemini-2.5-flash-lite" />
              <option value="gemini-2.5-pro" />
            </datalist>
          </div>

          {/* Footer Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
            {hasPersonalKey ? (
              <button
                type="button"
                disabled={saving}
                onClick={() => saveKey("")}
                className="text-xs font-medium text-rose-600 hover:text-rose-700"
              >
                Xóa Key cá nhân
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
                {saving ? "Đang lưu..." : hasPersonalKey ? "Cập nhật Key mới" : "Lưu API Key"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
