import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { getIgdbCoverImageUrl } from "@/lib/igdb-image";
import { createClient } from "@/lib/supabase/server";

type Profile = {
  id: string;
  username: string;
  created_at: string;
};

type LoggedGame = {
  igdb_id: number;
  name: string;
  cover_url: string | null;
};

type ProfileLog = {
  status: string;
  rating: number | string | null;
  games: LoggedGame | LoggedGame[] | null;
};

const PROFILE_STATUSES = [
  { value: "all", label: "All" },
  { value: "played", label: "Played" },
  { value: "playing", label: "Playing" },
  { value: "backlog", label: "Backlog" },
  { value: "wishlist", label: "Wishlist" },
  { value: "dropped", label: "Dropped" },
] as const;

function ProfileLoading() {
  return (
    <main className="catalog-shell">
      <p className="game-loading" role="status">Loading profile...</p>
    </main>
  );
}

async function ProfileDetails({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ status?: string | string[] }>;
}) {
  await connection();

  const [{ username }, query] = await Promise.all([params, searchParams]);
  const requestedStatus = Array.isArray(query.status) ? "" : query.status;
  const selectedStatus =
    PROFILE_STATUSES.find((status) => status.value === requestedStatus)?.value ??
    "all";
  const supabase = await createClient();
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("id, username, created_at")
    .eq("username", username)
    .maybeSingle();

  if (profileError) throw profileError;
  if (!profileData) notFound();

  const profile = profileData as Profile;
  const { data: logData, error: logsError } = await supabase
    .from("logs")
    .select("status, rating, games(igdb_id, name, cover_url)")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  if (logsError) throw logsError;

  const logs = (logData ?? []) as ProfileLog[];
  const visibleLogs =
    selectedStatus === "all"
      ? logs
      : logs.filter((log) => log.status === selectedStatus);
  const playedCount = logs.filter((log) => log.status === "played").length;
  const playingCount = logs.filter((log) => log.status === "playing").length;
  const backlogCount = logs.filter((log) => log.status === "backlog").length;
  const wishlistCount = logs.filter((log) => log.status === "wishlist").length;
  const droppedCount = logs.filter((log) => log.status === "dropped").length;
  const joinedDate = new Intl.DateTimeFormat("en", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(profile.created_at));

  return (
    <main className="catalog-shell profile-shell">
      <section className="profile-header" aria-labelledby="profile-username">
        <div className="profile-avatar" aria-hidden="true">
          {profile.username.slice(0, 1).toUpperCase()}
        </div>
        <div className="profile-intro">
          <p className="eyebrow">Player profile</p>
          <h1 id="profile-username">{profile.username}</h1>
          <p className="profile-joined">Joined {joinedDate}</p>
        </div>
      </section>

      <dl className="profile-stats" aria-label="Game library counts">
        <div>
          <dt>Played</dt>
          <dd>{playedCount}</dd>
        </div>
        <div>
          <dt>Playing</dt>
          <dd>{playingCount}</dd>
        </div>
        <div>
          <dt>Backlogged</dt>
          <dd>{backlogCount}</dd>
        </div>
        <div>
          <dt>Wishlist</dt>
          <dd>{wishlistCount}</dd>
        </div>
        <div>
          <dt>Dropped</dt>
          <dd>{droppedCount}</dd>
        </div>
      </dl>

      <section className="profile-games" aria-labelledby="profile-games-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Game Log</p>
          </div>
          <span className="result-count">
            {visibleLogs.length} {visibleLogs.length === 1 ? "GAME" : "GAMES"}
          </span>
        </div>
        <nav className="profile-status-tabs" aria-label="Filter games by status">
          {PROFILE_STATUSES.map((status) => {
            const href =
              status.value === "all"
                ? `/u/${encodeURIComponent(profile.username)}`
                : `/u/${encodeURIComponent(profile.username)}?status=${status.value}`;

            return (
              <Link
                key={status.value}
                href={href}
                aria-current={selectedStatus === status.value ? "page" : undefined}
              >
                {status.label}
              </Link>
            );
          })}
        </nav>
        {visibleLogs.length ? (
          <div className="game-grid">
            {visibleLogs.map((log, index) => {
              const game = Array.isArray(log.games) ? log.games[0] : log.games;
              if (!game) return null;

              const coverImage = getIgdbCoverImageUrl(game.cover_url);
              return (
                <Link
                  className="game-card"
                  href={`/games/${game.igdb_id}`}
                  key={`${game.igdb_id}-${index}`}
                >
                  <div className="cover-frame">
                    <span className={`profile-game-status profile-game-status--${log.status}`}>
                      {log.status === "backlog"
                        ? "Backlog"
                        : log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                    </span>
                    {coverImage ? (
                      <Image
                        src={coverImage}
                        alt={`${game.name} cover art`}
                        fill
                        unoptimized
                        sizes="(max-width: 600px) 45vw, (max-width: 900px) 30vw, 23vw"
                      />
                    ) : (
                      <div className="cover-fallback" aria-label="No cover art available">
                        <span>{game.name.slice(0, 1).toUpperCase()}</span>
                      </div>
                    )}
                  </div>
                  <h3>{game.name}</h3>
                  {log.rating !== null ? (
                    <p className="profile-game-rating">
                      {Number(log.rating).toFixed(1)} / 5
                    </p>
                  ) : null}
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="no-reviews">
            {selectedStatus === "all"
              ? "No games logged yet."
              : `No ${selectedStatus} games yet.`}
          </p>
        )}
      </section>
    </main>
  );
}

export default function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ status?: string | string[] }>;
}) {
  return (
    <Suspense fallback={<ProfileLoading />}>
      <ProfileDetails params={params} searchParams={searchParams} />
    </Suspense>
  );
}
