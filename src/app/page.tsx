"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// interface AuthUser {
//   id: string;
//   role: string;
//   is_active: boolean;
//   failed_attempts: number;
// }

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      console.log("Supabase session:", session);
      if (session) {
        const { data: userData, error } = await supabase
          .from("auth_users")
          .select("role")
          .eq("id", session.user.id)
          .single();
        console.log("Session user data:", userData, "Error:", error);
        if (userData && !error) {
          const role = userData.role;
          if (role.includes("admin")) router.push("/admin");
          else if (role.includes("manager")) router.push("/manager");
          else router.push("/employee");
        }
      }
    };
    checkSession();
  }, [router]);

  const handleEmailCheck = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const trimmedEmail = email.trim().toLowerCase();
    console.log("Checking email:", trimmedEmail);

    const { data, error: fetchError } = await supabase
      .from("auth_users")
      .select("id, role, is_active, failed_attempts")
      .eq("email", trimmedEmail)
      .single();

    console.log("Query result:", { data, error: fetchError });

    if (fetchError || !data) {
      setError("Email not found or account inactive");
      const { data: user, error: userError } = await supabase
        .from("auth_users")
        .select("id, failed_attempts")
        .eq("email", trimmedEmail)
        .single();

      if (user && !userError) {
        const newAttempts = (user.failed_attempts || 0) + 1;
        const { data: updated } = await supabase
          .from("auth_users")
          .update({ failed_attempts: newAttempts })
          .eq("id", user.id)
          .select("failed_attempts")
          .single();

        if (updated?.failed_attempts >= 3) {
          await supabase
            .from("auth_users")
            .update({ is_active: false })
            .eq("id", user.id);
          setError("Account blocked. Please reset your password.");
        }
      }
      return;
    }

    if (!data.is_active) {
      setError("Account inactive. Please reset your password.");
      return;
    }

    setShowPassword(true);
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const trimmedEmail = email.trim().toLowerCase();
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

    console.log("Login result:", { data, error: authError });

    if (authError) {
      setError("Invalid credentials");
      const { data: user, error: userError } = await supabase
        .from("auth_users")
        .select("id, failed_attempts")
        .eq("email", trimmedEmail)
        .single();

      if (user && !userError) {
        const newAttempts = (user.failed_attempts || 0) + 1;
        await supabase
          .from("auth_users")
          .update({ failed_attempts: newAttempts })
          .eq("id", user.id);
        if (newAttempts >= 3) {
          await supabase
            .from("auth_users")
            .update({ is_active: false })
            .eq("id", user.id);
          setError("Account blocked. Please reset your password.");
        }
      }
      return;
    }

    await supabase
      .from("auth_users")
      .update({ failed_attempts: 0 })
      .eq("email", trimmedEmail);

    const { data: userData, error: roleError } = await supabase
      .from("auth_users")
      .select("role")
      .eq("email", trimmedEmail)
      .single();

    if (roleError || !userData) {
      setError("Failed to fetch user role");
      return;
    }

    const role = userData.role || "employee";
    if (role.includes("admin")) router.push("/admin");
    else if (role.includes("manager")) router.push("/manager");
    else router.push("/employee");
  };

  const handleForgotPassword = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
      redirectTo: "http://localhost:3000/reset-password",
    });
    if (error) setError("Error sending reset email");
    else setError("Password reset email sent");
  };

  return (
    <Card className="mx-auto max-w-md mt-20">
      <CardHeader>
        <CardTitle>Leave Management System</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={showPassword ? handleLogin : handleEmailCheck}>
          <div className="mb-4">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {showPassword && (
            <div className="mb-4">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          )}
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <Button type="submit">
            {showPassword ? "Login" : "Check Email"}
          </Button>
          {showPassword && (
            <Button
              variant="link"
              onClick={handleForgotPassword}
              className="mt-2"
            >
              Forgot Password
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
