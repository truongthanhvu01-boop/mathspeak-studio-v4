import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerSupabase();
  if (!supabase) {
    return NextResponse.json({ lessons: [], configured: false });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ lessons: [], configured: true, authenticated: false });
  }

  const { data, error } = await supabase
    .from("lessons")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    lessons: data || [],
    configured: true,
    authenticated: true,
  });
}

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "Chưa cấu hình Supabase trên máy chủ." },
      { status: 503 }
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Vui lòng đăng nhập để lưu kịch bản lên đám mây." },
      { status: 401 }
    );
  }

  const body = await request.json();
  const { data, error } = await supabase
    .from("lessons")
    .insert({
      user_id: user.id,
      grade: body.grade || "Lớp 12",
      duration: body.duration || "45 phút",
      title_en: body.title_en || "Untitled Math Lesson",
      title_vi: body.title_vi || "",
      source: body.source || "Imported JSON",
      stages: body.stages || [],
      vocab: body.vocab || [],
      mastered_line_ids: body.mastered_line_ids || [],
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ lesson: data });
}
