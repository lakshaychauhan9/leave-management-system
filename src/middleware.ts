import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/database.types";

export async function middleware(request: NextRequest) {
  try {
    console.log("Middleware: Running for path:", request.nextUrl.pathname);

    const res = NextResponse.next();
    const supabase = createMiddlewareClient<Database>({ req: request, res });

    // Refresh session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    console.log(
      "Middleware: Session:",
      session ? "Found" : "Not found",
      "Error:",
      sessionError
    );

    const path = request.nextUrl.pathname;

    // Allow access to login and reset password pages
    if (path === "/" || path === "/reset-password") {
      console.log("Middleware: Allowing access to:", path);
      return res;
    }

    // Redirect to login if no session
    if (sessionError || !session) {
      console.log("Middleware: Redirecting to / due to no session");
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Get user data
    const { data: userData, error: queryError } = await supabase
      .from("auth_users")
      .select("role, is_active, last_password_change")
      .eq("id", session.user.id)
      .single();

    console.log("Middleware: User data:", userData, "Query Error:", queryError);

    if (queryError || !userData || !userData.is_active) {
      console.log("Middleware: Redirecting due to error or inactive user");
      return NextResponse.redirect(new URL("/", request.url));
    }

    const role = userData.role.toLowerCase();

    // Force password change on first login
    if (!userData.last_password_change && path !== "/change-password") {
      console.log(
        "Middleware: Redirecting to /change-password for first login"
      );
      return NextResponse.redirect(new URL("/change-password", request.url));
    }

    // Allow access to change password page
    if (path === "/change-password") {
      return res;
    }

    // Role-based access control
    if (path.startsWith("/admin") && !role.includes("admin")) {
      console.log("Middleware: Admin access denied, redirecting to employee");
      return NextResponse.redirect(new URL("/employee", request.url));
    }

    if (
      path.startsWith("/manager") &&
      !role.includes("manager") &&
      !role.includes("admin")
    ) {
      console.log("Middleware: Manager access denied, redirecting to employee");
      return NextResponse.redirect(new URL("/employee", request.url));
    }

    if (
      path.startsWith("/employee") &&
      !["employee", "manager", "admin"].some((r) => role.includes(r))
    ) {
      console.log("Middleware: Employee access denied, redirecting to login");
      return NextResponse.redirect(new URL("/", request.url));
    }

    console.log("Middleware: Allowing access to:", path);
    return res;
  } catch (error) {
    console.error("Middleware: Unexpected error:", error);
    return NextResponse.redirect(new URL("/", request.url));
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
