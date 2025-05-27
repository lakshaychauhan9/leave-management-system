import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const {
      email,
      password,
      role,
      join_date,
      gender,
      nationality,
      department,
    } = await request.json();

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: "Email, password, and role are required" },
        { status: 400 }
      );
    }

    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: "Failed to create user: " + authError?.message },
        { status: 400 }
      );
    }

    const { error: authUsersError } = await supabase.from("auth_users").insert({
      id: authData.user.id,
      email,
      role,
      is_active: true,
      failed_attempts: 0,
    });

    if (authUsersError) {
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: "Failed to save user data: " + authUsersError.message },
        { status: 400 }
      );
    }

    const { error: userDetailsError } = await supabase
      .from("user_details")
      .insert({
        id: authData.user.id,
        join_date: join_date || new Date().toISOString().split("T")[0],
        gender: gender || "",
        nationality: nationality || "",
        department: department || "TeamA",
      });

    if (userDetailsError) {
      await supabase.auth.admin.deleteUser(authData.user.id);
      await supabase.from("auth_users").delete().eq("id", authData.user.id);
      return NextResponse.json(
        { error: "Failed to save user details: " + userDetailsError.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "User created successfully", user_id: authData.user.id },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Server error: " + (error as Error).message },
      { status: 500 }
    );
  }
}
