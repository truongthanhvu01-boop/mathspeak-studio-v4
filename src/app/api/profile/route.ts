import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase chưa cấu hình." }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ authenticated: false, profile: null });
  }

  let { data: profile } = await supabase
    .from("user_profiles")
    .select("id, email, full_name, school_name, trial_used, trial_limit, personal_api_key, last_active_at")
    .eq("id", user.id)
    .single();

  if (!profile) {
    const meta = (user.user_metadata || {}) as { full_name?: string; school_name?: string };
    const { data: created } = await supabase
      .from("user_profiles")
      .insert({
        id: user.id,
        email: user.email || "",
        full_name: meta.full_name || "",
        school_name: meta.school_name || "",
      })
      .select("id, email, full_name, school_name, trial_used, trial_limit, personal_api_key, last_active_at")
      .single();
    profile = created;
  }

  return NextResponse.json({
    authenticated: true,
    profile: profile
      ? {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          school_name: profile.school_name,
          trial_used: profile.trial_used ?? 0,
          trial_limit: profile.trial_limit ?? 2,
          has_personal_key: !!(profile.personal_api_key && profile.personal_api_key.trim()),
        }
      : null,
  });
}

export async function PATCH(request: Request) {
  const supabase = await createServerSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase chưa cấu hình." }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  }

  const body = (await request.json()) as {
    personal_api_key?: string;
    full_name?: string;
    school_name?: string;
  };

  const updateFields: Record<string, unknown> = {
    last_active_at: new Date().toISOString(),
  };
  if (typeof body.personal_api_key === "string") {
    updateFields.personal_api_key = body.personal_api_key.trim();
  }
  if (typeof body.full_name === "string") {
    updateFields.full_name = body.full_name.trim();
  }
  if (typeof body.school_name === "string") {
    updateFields.school_name = body.school_name.trim();
  }

  const { data, error } = await supabase
    .from("user_profiles")
    .update(updateFields)
    .eq("id", user.id)
    .select("id, email, full_name, school_name, trial_used, trial_limit, personal_api_key")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    profile: {
      id: data.id,
      email: data.email,
      full_name: data.full_name,
      school_name: data.school_name,
      trial_used: data.trial_used ?? 0,
      trial_limit: data.trial_limit ?? 2,
      has_personal_key: !!(data.personal_api_key && data.personal_api_key.trim()),
    },
  });
}
