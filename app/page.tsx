import { Suspense } from "react";
import { connection } from "next/server";
import { queryIgdb } from "@/lib/igdb";
import { getIgdbCoverImageUrl } from "@/lib/igdb-image";
import GameSearch, { type Game } from "./game-search";

async function PopularGames() {
  await connection();

  let initialGames: Game[] = [];

  try {
    const popularGames = await queryIgdb<{
      name: string;
      cover?: { url?: string } | null;
    }>(
      "games",
      "fields name, cover.url; sort rating_count desc; where rating_count > 100; limit 12;",
    );

    initialGames = popularGames.map((game) => ({
      name: game.name,
      coverImage: getIgdbCoverImageUrl(game.cover?.url),
    }));
  } catch {
    initialGames = [];
  }

  return <GameSearch initialGames={initialGames} />;
}

export default function Home() {
  return (
    <Suspense fallback={<GameSearch initialGames={[]} initialLoading />}>
      <PopularGames />
    </Suspense>
  );
}
