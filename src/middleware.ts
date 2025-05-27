import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function middleware(request: NextRequest) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const { data: userData, error } = await supabase
    .from("auth_users")
    .select("role, is_active")
    .eq("id", session.user.id)
    .single();

  if (error || !userData || !userData.is_active) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/", request.url));
  }

  const role = userData.role;
  const path = request.nextUrl.pathname;

  if (path.startsWith("/admin") && !role.includes("admin")) {
    return NextResponse.redirect(new URL("/employee", request.url));
  }
  if (path.startsWith("/manager") && !role.includes("manager")) {
    return NextResponse.redirect(new URL("/employee", request.url));
  }
  if (
    path.startsWith("/employee") &&
    role !== "employee" &&
    !role.includes("admin") &&
    !role.includes("manager")
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/employee/:path*", "/manager/:path*", "/admin/:path*"],
};
