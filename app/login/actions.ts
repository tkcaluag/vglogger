"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function loginUrl(messageType: "error" | "message", message: string) {
  const params = new URLSearchParams({ [messageType]: message });
  return `/login?${params}`;
}

export async function signUp(formData: FormData) {
  const username = String(formData.get("username") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || username.length > 32 || !email || !password) {
    redirect(loginUrl("error", "Enter a username, email, and password."));
  }

  const origin = (await headers()).get("origin");
  if (!origin) {
    redirect(loginUrl("error", "Unable to determine the confirmation link origin."));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
      emailRedirectTo: new URL("/auth/confirm", origin).toString(),
    },
  });

  if (error) redirect(loginUrl("error", error.message));
  if (!data.session) {
    redirect(loginUrl("message", "Check your email to confirm your account."));
  }

  redirect("/");
}

export async function logIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect(loginUrl("error", "Enter your email and password."));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) redirect(loginUrl("error", error.message));
  redirect("/");
}

export async function logOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) throw error;
  redirect("/");
}
