"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ResetPasswordPage() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      console.log("Reset-Password: Session:", session ? "Found" : "Not found");
      if (session) {
        // Redirect to change-password for consistency
        try {
          router.push("/change-password");
          console.log("Success using router.push to /change-password");
        } catch (e) {
          console.error("router.push failed:", e);
          window.location.href = "/change-password";
        }
      } else {
        // If no session, stay on page or redirect to login
        try {
          router.push("/");
          console.log("Success using router.push to /");
        } catch (e) {
          console.error("router.push failed:", e);
          window.location.href = "/";
        }
      }
    };
    checkSession();
  }, [router]);

  return (
    <Card className="mx-auto max-w-md mt-4">
      <CardHeader>
        <CardTitle>Reset Password</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Redirecting to change password page...</p>
      </CardContent>
    </Card>
  );
}
