"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const checkInitialSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        console.log("Initial session check:", session ? "Found" : "Not found");

        if (session && isMounted) {
          setIsAuthenticated(true);
          await handleUserRedirect(session.user.id);
        }
      } catch (error) {
        console.error("Error checking initial session:", error);
      } finally {
        if (isMounted) {
          setInitialLoad(false);
        }
      }
    };

    checkInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(
        "Auth state change:",
        event,
        session ? "Session found" : "No session"
      );

      if (!isMounted) return;

      if (event === "SIGNED_IN" && session) {
        setIsAuthenticated(true);
        await handleUserRedirect(session.user.id);
      } else if (event === "SIGNED_OUT") {
        setIsAuthenticated(false);
        setEmail("");
        setPassword("");
        setShowPassword(false);
        setError("");
        setMessage("");
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleUserRedirect = async (userId: string) => {
    try {
      const { data: userData, error } = await supabase
        .from("auth_users")
        .select("role, is_active, last_password_change")
        .eq("id", userId)
        .single();

      if (error || !userData || !userData.is_active) {
        console.error("User data error:", error);
        await supabase.auth.signOut();
        return;
      }

      const role = userData.role.toLowerCase();
      const redirectPath = !userData.last_password_change
        ? "/change-password"
        : role.includes("admin")
        ? "/admin"
        : role.includes("manager")
        ? "/manager"
        : "/employee";

      console.log("Redirecting to:", redirectPath);
      router.push(redirectPath);
    } catch (error) {
      console.error("Error handling user redirect:", error);
      setError("Error loading user data");
    }
  };

  const handleEmailCheck = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const trimmedEmail = email.trim().toLowerCase();

      const { data: userData, error: fetchError } = await supabase
        .from("auth_users")
        .select("id, role, is_active, failed_attempts")
        .eq("email", trimmedEmail)
        .single();

      if (fetchError || !userData) {
        setError("Email not found or account inactive");

        // Track failed attempts
        const { data: user } = await supabase
          .from("auth_users")
          .select("id, failed_attempts")
          .eq("email", trimmedEmail)
          .single();

        if (user) {
          const newAttempts = (user.failed_attempts ?? 0) + 1;
          await supabase
            .from("auth_users")
            .update({ failed_attempts: newAttempts })
            .eq("id", user.id);

          if (newAttempts >= 3) {
            await supabase
              .from("auth_users")
              .update({ is_active: false })
              .eq("id", user.id);
            setError(
              "Account blocked due to multiple failed attempts. Please reset your password."
            );
          }
        }
        return;
      }

      if (!userData.is_active) {
        setError("Account inactive. Please reset your password.");
        return;
      }

      if ((userData.failed_attempts ?? 0) >= 3) {
        setError(
          "Account blocked due to multiple failed attempts. Please reset your password."
        );
        return;
      }

      setShowPassword(true);
    } catch (error) {
      console.error("Email check error:", error);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const trimmedEmail = email.trim().toLowerCase();

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (authError) {
        setError("Invalid credentials");

        // Track failed login attempts
        const { data: user } = await supabase
          .from("auth_users")
          .select("id, failed_attempts")
          .eq("email", trimmedEmail)
          .single();

        if (user) {
          const newAttempts = (user.failed_attempts ?? 0) + 1;
          await supabase
            .from("auth_users")
            .update({ failed_attempts: newAttempts })
            .eq("id", user.id);

          if (newAttempts >= 3) {
            await supabase
              .from("auth_users")
              .update({ is_active: false })
              .eq("id", user.id);
            setError(
              "Account blocked due to multiple failed attempts. Please reset your password."
            );
          }
        }
        return;
      }

      // Reset failed attempts on successful login
      await supabase
        .from("auth_users")
        .update({ failed_attempts: 0 })
        .eq("email", trimmedEmail);

      setMessage("Login successful! Redirecting...");
      // The auth state change handler will handle the redirect
    } catch (error) {
      console.error("Login error:", error);
      setError("An error occurred during login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setError("Error signing out: " + error.message);
      } else {
        setMessage("Signed out successfully");
      }
    } catch (error) {
      console.error("Logout error:", error);
      setError("An error occurred during logout");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError("Please enter your email address first");
      return;
    }

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const trimmedEmail = email.trim().toLowerCase();

      const { data: userData } = await supabase
        .from("auth_users")
        .select("id, is_active")
        .eq("email", trimmedEmail)
        .single();

      if (!userData) {
        setError("Email not found");
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(
        trimmedEmail,
        {
          redirectTo: `${window.location.origin}/change-password`,
        }
      );

      if (error) {
        setError("Error sending reset email: " + error.message);
      } else {
        // Reactivate account and clear password change flag
        await supabase
          .from("auth_users")
          .update({
            is_active: true,
            failed_attempts: 0,
            last_password_change: null,
          })
          .eq("email", trimmedEmail);

        setMessage("Password reset email sent. Please check your inbox.");
      }
    } catch (error) {
      console.error("Password reset error:", error);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoad) {
    return (
      <Card className="mx-auto max-w-md mt-4">
        <CardContent className="pt-6">
          <div className="text-center">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-md mt-4">
      <CardHeader>
        <CardTitle>Leave Management System</CardTitle>
      </CardHeader>
      <CardContent>
        {isAuthenticated ? (
          <div>
            <p className="mb-4">You are already logged in.</p>
            <Button onClick={handleLogout} disabled={loading}>
              {loading ? "Logging out..." : "Logout"}
            </Button>
          </div>
        ) : (
          <form onSubmit={showPassword ? handleLogin : handleEmailCheck}>
            <div className="mb-4">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={showPassword || loading}
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
                  disabled={loading}
                  required
                />
              </div>
            )}
            {error && <p className="text-red-500 mb-4">{error}</p>}
            {message && (
              <p className="text-green-600 font-semibold mb-4">{message}</p>
            )}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Loading..." : showPassword ? "Login" : "Check Email"}
            </Button>
            {showPassword && (
              <div className="mt-2 space-y-2">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setShowPassword(false)}
                  className="w-full"
                  disabled={loading}
                >
                  Back to Email
                </Button>
                <Button
                  type="button"
                  variant="link"
                  onClick={handleForgotPassword}
                  className="w-full"
                  disabled={loading}
                >
                  Forgot Password?
                </Button>
              </div>
            )}
          </form>
        )}
      </CardContent>
    </Card>
  );
}
