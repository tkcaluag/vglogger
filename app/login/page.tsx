import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { logIn, signUp } from "./actions";

type LoginSearchParams = {
  error?: string;
  message?: string;
};

async function LoginContent({
  searchParams,
}: {
  searchParams: Promise<LoginSearchParams>;
}) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error && error.name !== "AuthSessionMissingError") throw error;
  if (user) redirect("/");

  const { error: errorMessage, message } = await searchParams;

  return (
    <main className="catalog-shell login-shell">
      <section className="login-intro">
        <p className="eyebrow">Your library starts here</p>
        <h1>Welcome to your<br /><span>game library.</span></h1>
        <p className="login-copy">
          Sign in to keep track of the games you love.
        </p>
        <Link className="login-back-link" href="/">
          Browse the catalog
        </Link>
      </section>

      {errorMessage || message ? (
        <p
          className={errorMessage ? "auth-message auth-error" : "auth-message"}
          role={errorMessage ? "alert" : "status"}
        >
          {errorMessage || message}
        </p>
      ) : null}

      <div className="auth-forms">
        <section className="auth-card" aria-labelledby="login-heading">
          <h2 id="login-heading">Log in</h2>
          <form action={logIn} className="auth-form">
            <label htmlFor="login-email">Email</label>
            <input id="login-email" name="email" type="email" autoComplete="email" required />
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
            <button type="submit">Log in</button>
          </form>
        </section>

        <section className="auth-card" aria-labelledby="signup-heading">
          <h2 id="signup-heading">Create an account</h2>
          <form action={signUp} className="auth-form">
            <label htmlFor="signup-username">Username</label>
            <input
              id="signup-username"
              name="username"
              type="text"
              autoComplete="username"
              maxLength={32}
              required
            />
            <label htmlFor="signup-email">Email</label>
            <input id="signup-email" name="email" type="email" autoComplete="email" required />
            <label htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={6}
              required
            />
            <button type="submit">Sign up</button>
          </form>
        </section>
      </div>
    </main>
  );
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<LoginSearchParams>;
}) {
  return (
    <Suspense fallback={<main className="catalog-shell login-shell">Loading...</main>}>
      <LoginContent searchParams={searchParams} />
    </Suspense>
  );
}
