import Link from "next/link";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logOut } from "./login/actions";

export function SiteHeaderFallback() {
  return (
    <header className="catalog-shell topbar">
      <Link className="brand" href="/" aria-label="VGLogger home">
        <span className="brand-mark">VG</span>
        <span className="brand-name">vglogger</span>
      </Link>
      <span className="catalog-label" aria-hidden="true" />
    </header>
  );
}

export default async function SiteHeader() {
  await connection();

  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error && error.name !== "AuthSessionMissingError") throw error;

  const username =
    typeof user?.user_metadata.username === "string" && user.user_metadata.username.trim()
      ? user.user_metadata.username
      : "Account";

  return (
    <header className="catalog-shell topbar">
      <Link className="brand" href="/" aria-label="VGLogger home">
        <span className="brand-mark">VG</span>
        <span className="brand-name">vglogger</span>
      </Link>
      {user ? (
        <div className="auth-header-actions">
          <span className="catalog-label">{username}</span>
          <form action={logOut}>
            <button className="logout-button" type="submit">Log out</button>
          </form>
        </div>
      ) : (
        <Link className="catalog-label login-link" href="/login">Log in</Link>
      )}
    </header>
  );
}
