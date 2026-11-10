"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

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

type PlatformOption = {
  id: number;
  name: string;
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
  const [searchedWithFilters, setSearchedWithFilters] = useState(false);
  const [genre, setGenre] = useState("");
  const [platform, setPlatform] = useState("");
  const [year, setYear] = useState("");
  const [platformOptions, setPlatformOptions] = useState<PlatformOption[]>([]);
  const [platformLoadError, setPlatformLoadError] = useState("");
  const [isLoadingPlatforms, setIsLoadingPlatforms] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const abortController = new AbortController();

    async function loadPlatforms() {
      try {
        const response = await fetch("/api/search/platforms", {
          signal: abortController.signal,
        });
        if (!response.ok) throw new Error("Platform list request failed");
        const platforms = (await response.json()) as PlatformOption[];
        setPlatformOptions(platforms);
      } catch {
        if (!abortController.signal.aborted) {
          setPlatformLoadError("Platform options could not be loaded.");
        }
      } finally {
        if (!abortController.signal.aborted) setIsLoadingPlatforms(false);
      }
    }

    void loadPlatforms();
    return () => abortController.abort();
  }, []);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = searchTerm.trim();

    const selectedGenre = genre.trim();
    const selectedPlatform = platform;
    const selectedYear = year.trim();
    if (!query && !selectedGenre && !selectedPlatform && !selectedYear) {
      setError("Enter a game name or choose at least one search filter.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const searchParams = new URLSearchParams();
      if (query) searchParams.set("q", query);
      if (selectedGenre) searchParams.set("genre", selectedGenre);
      if (selectedPlatform) searchParams.set("platform", selectedPlatform);
      if (selectedYear) searchParams.set("year", selectedYear);

      const response = await fetch(`/api/search?${searchParams.toString()}`);
      if (!response.ok) {
        const body = (await response.json()) as { error?: unknown };
        setError(
          typeof body.error === "string"
            ? body.error
            : "The game catalog could not be reached. Try again shortly.",
        );
        return;
      }

      const results = (await response.json()) as Game[];
      setSearchResults(results);
      setSearchedQuery(query);
      setSearchedWithFilters(Boolean(selectedGenre || selectedPlatform || selectedYear));
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
        <form className="search-panel" role="search" onSubmit={handleSearch}>
          <div className="search-form">
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
            <button
              type="submit"
              disabled={
                isLoading ||
                (!searchTerm.trim() && !genre.trim() && !platform && !year.trim())
              }
            >
              {isLoading ? <span className="button-spinner" /> : "Search"}
            </button>
          </div>
          <div className="search-filters" role="group" aria-label="Search filters">
            <label>
              Genre
              <input
                type="text"
                placeholder="e.g. Action"
                value={genre}
                onChange={(event) => setGenre(event.target.value)}
              />
            </label>
            <label>
              Platform
              <select
                value={platform}
                onChange={(event) => setPlatform(event.target.value)}
                disabled={isLoadingPlatforms || Boolean(platformLoadError)}
              >
                <option value="">
                  {isLoadingPlatforms ? "Loading platforms..." : "Any platform"}
                </option>
                {platformOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Release year
              <input
                type="number"
                min="1000"
                max="9999"
                step="1"
                placeholder="e.g. 2020"
                value={year}
                onChange={(event) => setYear(event.target.value)}
              />
            </label>
          </div>
          {platformLoadError ? (
            <p className="filter-error" role="alert">
              {platformLoadError}
            </p>
          ) : null}
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
              <h2 id="search-results-title">
                {searchedQuery
                  ? `Results for “${searchedQuery}”`
                  : searchedWithFilters
                    ? "Filtered games"
                    : "Game results"}
              </h2>
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
              <p>
                {searchedQuery
                  ? `No games found for “${searchedQuery}”.`
                  : "No games match the selected filters."}
              </p>
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