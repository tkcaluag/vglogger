"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";

export type Game = {
  id: number;
  name: string;
  coverImage: string | null;
};

export default function GameSearch({
  initialGames,
  initialLoading = false,
}: {
  initialGames: Game[];
  initialLoading?: boolean;
}) {
  const [games, setGames] = useState(initialGames);
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
      setGames(results);
      setSearchedQuery(query);
    } catch {
      setError("The game catalog could not be reached. Try again shortly.");
    } finally {
      setIsLoading(false);
    }
  }

  const sectionTitle = searchedQuery
    ? `Results for “${searchedQuery}”`
    : "Most Popular";

  return (
    <main className="catalog-shell">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="VGLogger home">
          <span className="brand-mark">VG</span>
          <span className="brand-name">vglogger</span>
        </Link>
        <span className="catalog-label">
          <span className="status-dot" />
          GAME CATALOG
        </span>
      </header>

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

      <section className="games-section" aria-labelledby="games-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">The Collection</p>
            <h2 id="games-title">{sectionTitle}</h2>
          </div>
          <span className="result-count">
            {isLoading ? "SEARCHING" : initialLoading ? "LOADING" : `${games.length} GAMES`}
          </span>
        </div>

        {error ? (
          <p className="feedback-message" role="alert">
            {error}
          </p>
        ) : games.length ? (
          <div className="game-grid" aria-live="polite">
            {games.map((game, index) => (
              <Link className="game-card" href={`/games/${game.id}`} key={game.id}>
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
            ))}
          </div>
        ) : (
          <div className="empty-state" aria-live="polite">
            <span className="empty-mark">VG</span>
            <p>
              {initialLoading
                ? "Loading games..."
                : searchedQuery
                ? `No games found for “${searchedQuery}”.`
                : "Search the catalog to find a game."}
            </p>
          </div>
        )}
      </section>

      <footer className="page-footer">
        <span>VGLOGGER</span>
        <span>BUILT FOR YOUR BACKLOG</span>
      </footer>
    </main>
  );
}