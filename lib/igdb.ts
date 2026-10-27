import "server-only";

const TWITCH_TOKEN_URL = "https://id.twitch.tv/oauth2/token";
const IGDB_API_URL = "https://api.igdb.com/v4";

type TwitchTokenResponse = {
  access_token: string;
  expires_in: number;
};

let cachedToken: { value: string; expiresAt: number } | undefined;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }

  const clientId = process.env.IGDB_CLIENT_ID;
  const clientSecret = process.env.IGDB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing IGDB_CLIENT_ID or IGDB_CLIENT_SECRET environment variable.",
    );
  }

  const tokenUrl = new URL(TWITCH_TOKEN_URL);
  tokenUrl.search = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "client_credentials",
  }).toString();

  const response = await fetch(tokenUrl, { method: "POST", cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Twitch token request failed with status ${response.status}.`);
  }

  const token = (await response.json()) as TwitchTokenResponse;
  cachedToken = {
    value: token.access_token,
    expiresAt: Date.now() + token.expires_in * 1000,
  };

  return cachedToken.value;
}

export async function queryIgdb<T>(endpoint: string, query: string): Promise<T[]> {
  if (!/^[a-z][a-z0-9_]*$/i.test(endpoint)) {
    throw new Error("IGDB endpoint must be a valid API resource name.");
  }

  const clientId = process.env.IGDB_CLIENT_ID;
  if (!clientId) {
    throw new Error("Missing IGDB_CLIENT_ID environment variable.");
  }

  const accessToken = await getAccessToken();
  const response = await fetch(`${IGDB_API_URL}/${endpoint}`, {
    method: "POST",
    headers: {
      "Client-ID": clientId,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "text/plain",
    },
    body: query,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`IGDB ${endpoint} request failed with status ${response.status}.`);
  }

  return (await response.json()) as T[];
}