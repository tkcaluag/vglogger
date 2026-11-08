"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";

export type Game = {
  id: number;
  name: string;
  coverImage: string | null;
};

export type GameSection = {
  title: string;
  games: Game[];
  error?: string;
};

export default function GameSearch({
  initialSections,
  initialLoading = false,
}: {
  initialSections: GameSection[];
  initialLoading?: boolean;
}) {
  const [searchResults, setSearchResults] = useState<Game[] | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchedQuery, setSearchedQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = searchTerm.trim();

    if (!query) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error("Search request failed");

      const results = (await response.json()) as Game[];
      setSearchResults(results);
      setSearchedQuery(query);
    } catch {
      setError("The game catalog could not be reached. Try again shortly.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="catalog-shell">
      <section className="intro" aria-labelledby="page-title">
        <p className="eyebrow">Log all your games in one place</p>
        <h1 id="page-title">
          Find your
          <br />
          <span>favorite games.</span>
        </h1>
        <form className="search-form" role="search" onSubmit={handleSearch}>
          <label className="visually-hidden" htmlFor="game-search">
            Search games
          </label>
          <span className="search-mark" aria-hidden="true" />
          <input
            id="game-search"
            type="search"
            placeholder="Search games, series, worlds..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <button type="submit" disabled={isLoading || !searchTerm.trim()}>
            {isLoading ? <span className="button-spinner" /> : "Search"}
          </button>
        </form>
      </section>

      {error ? (
        <p className="feedback-message" role="alert">
          {error}
        </p>
      ) : null}

      {searchResults !== null ? (
        <section className="games-section" aria-labelledby="search-results-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">The Collection</p>
              <h2 id="search-results-title">Results for “{searchedQuery}”</h2>
            </div>
            <span className="result-count">
              {isLoading
                ? "SEARCHING"
                : `${searchResults.length} ${searchResults.length === 1 ? "GAME" : "GAMES"}`}
            </span>
          </div>

          {searchResults.length ? (
            <div className="game-grid" aria-live="polite">
              {searchResults.map((game, index) => (
                <GameCard game={game} index={index} key={game.id} />
              ))}
            </div>
          ) : (
            <div className="empty-state" aria-live="polite">
              <span className="empty-mark">VG</span>
              <p>No games found for “{searchedQuery}”.</p>
            </div>
          )}
        </section>
      ) : (
        initialSections.map((section, sectionIndex) => (
          <section
            className="games-section"
            aria-labelledby={`games-title-${sectionIndex}`}
            key={section.title}
          >
            <div className="section-heading">
              <div>
                <p className="eyebrow">The Collection</p>
                <h2 id={`games-title-${sectionIndex}`}>{section.title}</h2>
              </div>
              <span className="result-count">
                {initialLoading
                  ? "LOADING"
                  : section.error
                    ? "UNAVAILABLE"
                    : `${section.games.length} ${section.games.length === 1 ? "GAME" : "GAMES"}`}
              </span>
            </div>

            {section.error ? (
              <p className="feedback-message" role="alert">
                {section.error}
              </p>
            ) : section.games.length ? (
              <div className="game-grid">
                {section.games.map((game, index) => (
                  <GameCard game={game} index={index} key={game.id} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <span className="empty-mark">VG</span>
                <p>{initialLoading ? "Loading games..." : "No games to show."}</p>
              </div>
            )}
          </section>
        ))
      )}

      <footer className="page-footer">
        <span>VGLOGGER</span>
        <span>BUILT FOR YOUR BACKLOG</span>
      </footer>
    </main>
  );
}

function GameCard({ game, index }: { game: Game; index: number }) {
  return (
    <Link className="game-card" href={`/games/${game.id}`}>
      <div className="cover-frame">
        {game.coverImage ? (
          <Image
            src={game.coverImage}
            alt={`${game.name} cover art`}
            fill
            unoptimized
            priority={index < 4}
            sizes="(max-width: 560px) 45vw, (max-width: 900px) 30vw, 22vw"
          />
        ) : (
          <div className="cover-fallback" aria-label="No cover art available">
            <span>{game.name.slice(0, 1).toUpperCase()}</span>
          </div>
        )}
        <span className="cover-index">{String(index + 1).padStart(2, "0")}</span>
      </div>
      <h3 title={game.name}>{game.name}</h3>
    </Link>
  );
}