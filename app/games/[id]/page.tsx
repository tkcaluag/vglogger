import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getIgdbCoverImageUrl } from "@/lib/igdb-image";
import { queryIgdb } from "@/lib/igdb";

type IgdbGame = {
  name: string;
  summary?: string | null;
  first_release_date?: number | null;
  cover?: { url?: string | null } | null;
  platforms?: { name: string }[] | null;
  genres?: { name: string }[] | null;
};

function GameLoading() {
  return (
    <main className="catalog-shell">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="VGLogger home">
          <span className="brand-mark">VG</span>
          <span className="brand-name">vglogger</span>
        </Link>
        <span className="catalog-label">GAME DETAILS</span>
      </header>
      <p className="game-loading" role="status">
        Loading game details...
      </p>
    </main>
  );
}

async function GameDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id))) notFound();

  const games = await queryIgdb<IgdbGame>(
    "games",
    `where id = ${id}; fields name, summary, first_release_date, cover.url, platforms.name, genres.name; limit 1;`,
  );
  const game = games[0];
  if (!game) notFound();

  const coverImage = getIgdbCoverImageUrl(game.cover?.url);
  const releaseDate = game.first_release_date
    ? new Intl.DateTimeFormat("en", { dateStyle: "long", timeZone: "UTC" }).format(
        new Date(game.first_release_date * 1000),
      )
    : "Unknown";

  return (
    <main className="catalog-shell">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="VGLogger home">
          <span className="brand-mark">VG</span>
          <span className="brand-name">vglogger</span>
        </Link>
        <Link className="catalog-label back-link" href="/">
          BACK TO CATALOG
        </Link>
      </header>

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