import { NextResponse } from "next/server";
import mammoth from "mammoth";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Vui lòng chọn file giáo án (.docx, .txt, .md)." },
        { status: 400 }
      );
    }

    const filename = file.name || "lesson";
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    const arrayBuffer = await file.arrayBuffer();

    let text = "";
    if (ext === "docx") {
      const buffer = Buffer.from(arrayBuffer);
      const result = await mammoth.extractRawText({ buffer });
      text = (result.value || "").trim();
    } else if (ext === "txt" || ext === "md") {
      text = Buffer.from(arrayBuffer).toString("utf-8").trim();
    } else {
      return NextResponse.json(
        { error: "Chỉ hỗ trợ file .docx, .txt hoặc .md." },
        { status: 400 }
      );
    }

    return NextResponse.json({ text, filename, length: text.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Không thể đọc file giáo án.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
