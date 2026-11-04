import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { getIgdbCoverImageUrl } from "@/lib/igdb-image";
import { queryIgdb } from "@/lib/igdb";
import { createClient } from "@/lib/supabase/server";
import DeleteGameLogButton from "./delete-game-log-button";
import GameCommunity, { CommunityLoading } from "./community-section";
import LogGameForm from "./log-game-form";

type IgdbGame = {
  id: number;
  name: string;
  summary?: string | null;
  first_release_date?: number | null;
  cover?: { url?: string | null } | null;
  platforms?: { name: string }[] | null;
  genres?: { name: string }[] | null;
};

type GameLog = {
  status: string;
  rating: number | string | null;
  review: string | null;
  played_on: string | null;
};

function GameLoading() {
  return (
    <main className="catalog-shell">
      <p className="game-loading" role="status">
        Loading game details...
      </p>
    </main>
  );
}

async function GameDetails({ params }: { params: Promise<{ id: string }> }) {
  await connection();

  const { id } = await params;
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id))) notFound();

  const games = await queryIgdb<IgdbGame>(
    "games",
    `where id = ${id}; fields name, summary, first_release_date, cover.url, platforms.name, genres.name; limit 1;`,
  );
  const game = games[0];
  if (!game) notFound();

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError && authError.name !== "AuthSessionMissingError") throw authError;

  const ownLogQuery = user
    ? supabase
        .from("logs")
        .select("status, rating, review, played_on")
        .eq("user_id", user.id)
        .eq("game_id", game.id)
        .maybeSingle()
    : Promise.resolve({ data: null, error: null });
  const ownLogResult = await ownLogQuery;
  if (ownLogResult.error) throw ownLogResult.error;

  const ownLog = ownLogResult.data as GameLog | null;
  const coverImage = getIgdbCoverImageUrl(game.cover?.url);
  const releaseDate = game.first_release_date
    ? new Intl.DateTimeFormat("en", { dateStyle: "long", timeZone: "UTC" }).format(
        new Date(game.first_release_date * 1000),
      )
    : "Unknown";

  return (
    <main className="catalog-shell">
      <Link className="catalog-label back-link" href="/">BACK TO CATALOG</Link>
      <article className="game-details">
        <div className="detail-cover">
          {coverImage ? (
            <Image
              src={coverImage}
              alt={`${game.name} cover art`}
              fill
              unoptimized
              sizes="(max-width: 700px) 100vw, 36vw"
              priority
            />
          ) : (
            <div className="cover-fallback" aria-label="No cover art available">
              <span>{game.name.slice(0, 1).toUpperCase()}</span>
            </div>
          )}
        </div>

        <div className="detail-content">
          <p className="eyebrow">Game details</p>
          <h1>{game.name}</h1>
          <section className="detail-section" aria-labelledby="summary-heading">
            <h2 id="summary-heading">Summary</h2>
            <p>{game.summary || "No summary available."}</p>
          </section>
          <dl className="detail-facts">
            <div>
              <dt>Release date</dt>
              <dd>{releaseDate}</dd>
            </div>
            <div>
              <dt>Platforms</dt>
              <dd>
                {game.platforms?.length
                  ? game.platforms.map((platform) => platform.name).join(", ")
                  : "Unknown"}
              </dd>
            </div>
            <div>
              <dt>Genres</dt>
              <dd>
                {game.genres?.length
                  ? game.genres.map((genre) => genre.name).join(", ")
                  : "Unknown"}
              </dd>
            </div>
          </dl>
        </div>
      </article>
      <section className="community-section" aria-labelledby="log-game-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Your library</p>
            <h2 id="log-game-heading">Log this game</h2>
          </div>
        </div>
        {user ? (
          <>
            <LogGameForm
              gameId={id}
              initialStatus={ownLog?.status}
              initialRating={
                ownLog?.rating === null || ownLog?.rating === undefined
                  ? ""
                  : Number(ownLog.rating).toFixed(1)
              }
              initialReview={ownLog?.review ?? ""}
              initialPlayedOn={ownLog?.played_on ?? ""}
            />
            {ownLog ? <DeleteGameLogButton gameId={id} /> : null}
          </>
        ) : (
          <p className="login-prompt">
            <Link href="/login">Log in</Link> to add this game to your library.
          </p>
        )}
      </section>
      <Suspense fallback={<CommunityLoading />}>
        <GameCommunity gameId={game.id} />
      </Suspense>
    </main>
  );
}

export default function GamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<GameLoading />}>
      <GameDetails params={params} />
    </Suspense>
  );
}