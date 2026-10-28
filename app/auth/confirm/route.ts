import { createClient } from "@/lib/supabase/server";

function getLocalRedirect(path: string | null, origin: string) {
  if (!path || !path.startsWith("/") || path.startsWith("//") || path.includes("\\")) {
    return new URL("/", origin);
  }

  const destination = new URL(path, origin);
  return destination.origin === origin ? destination : new URL("/", origin);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const destination = getLocalRedirect(requestUrl.searchParams.get("next"), requestUrl.origin);
  const supabase = await createClient();
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");

  let error: Error | null = null;
  if (code) {
    ({ error } = await supabase.auth.exchangeCodeForSession(code));
  } else if (tokenHash && (type === "signup" || type === "email")) {
    ({ error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    }));
  } else {
    return Response.redirect(new URL("/login?error=Invalid%20confirmation%20link", requestUrl.origin));
  }

  if (error) {
    return Response.redirect(
      new URL("/login?error=Email%20confirmation%20failed.%20Request%20a%20new%20link.", requestUrl.origin),
    );
  }

  return Response.redirect(destination);
}
