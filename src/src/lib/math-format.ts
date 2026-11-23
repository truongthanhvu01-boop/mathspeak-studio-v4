import katex from "katex";

function fallbackMathUnicode(expr: string): string {
  return expr
    .replace(/\\mathbb\{R\}/g, "ℝ")
    .replace(/\\mathbb\{Z\}/g, "ℤ")
    .replace(/\\forall/g, "∀")
    .replace(/\\in/g, "∈")
    .replace(/\\ge/g, "≥")
    .replace(/\\le/g, "≤")
    .replace(/\\infty/g, "∞")
    .replace(/\\Leftrightarrow/g, "⇔")
    .replace(/\\cup/g, "∪")
    .replace(/\\pi/g, "π")
    .replace(/\\text\{([^}]+)\}/g, "$1")
    .replace(/\^2/g, "²")
    .replace(/\^3/g, "³");
}

export function renderMathInText(text: string): string {
  if (!text) return "";
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return escaped.replace(/\$([^$]+)\$/g, (_m, expr: string) => {
    const raw = expr
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&");
    try {
      return katex.renderToString(raw, { throwOnError: false, displayMode: false });
    } catch {
      return `<span class="font-serif italic bg-slate-100 px-1 rounded text-indigo-800">${fallbackMathUnicode(
        expr
      )}</span>`;
    }
  });
}

export function renderPureLatex(latex: string): string {
  if (!latex) return "";
  try {
    return katex.renderToString(latex, { throwOnError: false, displayMode: false });
  } catch {
    return `<span class="font-serif italic">${fallbackMathUnicode(latex)}</span>`;
  }
}
