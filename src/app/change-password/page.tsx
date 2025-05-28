"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ChangePasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      console.log("Change-Password: Session:", session ? "Found" : "Not found");
      if (!session) {
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

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setError("Failed to update password: " + updateError.message);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.email) {
      const currentTimestamp = new Date().toISOString();
      await supabase
        .from("auth_users")
        .update({ last_password_change: currentTimestamp })
        .eq("email", user.email);
      console.log("Updated last_password_change for:", user.email);
    }

    setMessage("Password updated successfully! Redirecting...");
    setTimeout(async () => {
      const { data: userData } = await supabase
        .from("auth_users")
        .select("role")
        .eq("email", user?.email)
        .single();
      const role = userData?.role?.toLowerCase() || "employee";
      const path = role.includes("admin")
        ? "/admin"
        : role.includes("manager")
        ? "/manager"
        : "/employee";
      console.log("Redirecting to:", path);
      try {
        router.push(path);
        console.log("Success using router.push to:", path);
      } catch (e) {
        console.error("router.push failed:", e);
        window.location.href = path;
      }
    }, 2000);
  };

  return (
    <Card className="mx-auto max-w-md mt-4">
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleChangePassword}>
          <div className="mb-4">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          {message && (
            <p className="text-green-600 font-semibold mb-4">{message}</p>
          )}
          <Button type="submit">Update Password</Button>
        </form>
      </CardContent>
    </Card>
  );
}
