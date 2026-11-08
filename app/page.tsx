import { Suspense } from "react";
import { connection } from "next/server";
import { queryIgdb } from "@/lib/igdb";
import { getIgdbCoverImageUrl } from "@/lib/igdb-image";
import GameSearch, { type GameSection } from "./game-search";

type IgdbGame = {
  id: number;
  name: string;
  cover?: { url?: string } | null;
};

const catalogSections = [
  {
    title: "Popular",
    query: "fields id, name, cover.url; sort rating_count desc; where rating_count > 100; limit 8;",
  },
  {
    title: "New releases",
    query:
      "fields id, name, cover.url; sort first_release_date desc; where first_release_date != null; limit 8;",
  },
  {
    title: "Highly rated",
    query:
      "fields id, name, cover.url; sort total_rating desc; where total_rating > 80 & rating_count > 50; limit 8;",
  },
] as const;

async function loadSection(
  title: string,
  query: string,
): Promise<GameSection> {
  try {
    const games = await queryIgdb<IgdbGame>("games", query);
    return {
      title,
      games: games.map((game) => ({
        id: game.id,
        name: game.name,
        coverImage: getIgdbCoverImageUrl(game.cover?.url),
      })),
    };
  } catch {
    return { title, games: [], error: "This list could not be loaded. Try again later." };
  }
}

async function HomeCatalog() {
  await connection();

  const sections = await Promise.all(
    catalogSections.map(({ title, query }) => loadSection(title, query)),
  );
  return <GameSearch initialSections={sections} />;
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <GameSearch
          initialSections={catalogSections.map(({ title }) => ({ title, games: [] }))}
          initialLoading
        />
      }
    >
      <HomeCatalog />
    </Suspense>
  );
}
