import { supabase } from "./supabase";

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
  window.location.href = "/";
}
