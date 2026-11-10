import { queryIgdb } from "@/lib/igdb";
import { getIgdbCoverImageUrl } from "@/lib/igdb-image";

type IgdbGame = {
  id: number;
  name: string;
  cover?: { url?: string } | null;
};

type IgdbNamedEntity = {
  id: number;
};

function escapeIgdbString(value: string) {
  return value
    .replace(/[\r\n]/g, " ")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"');
}

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const searchTerm = searchParams.get("q")?.trim();
  const genre = searchParams.get("genre")?.trim();
  const platform = searchParams.get("platform")?.trim();
  const releaseYear = searchParams.get("year")?.trim();

  if (!searchTerm && !genre && !platform && !releaseYear) {
    return Response.json(
      { error: "Enter a game name or choose at least one search filter." },
      { status: 400 },
    );
  }

  if (genre && genre.length > 100) {
    return Response.json({ error: "Genre must be 100 characters or fewer." }, { status: 400 });
  }

  if (platform && !/^\d+$/.test(platform)) {
    return Response.json({ error: "Select a valid platform." }, { status: 400 });
  }

  if (releaseYear && (!/^\d{4}$/.test(releaseYear) || Number(releaseYear) < 1000)) {
    return Response.json({ error: "The year filter must be a four-digit year." }, { status: 400 });
  }

  try {
    const genres = genre
      ? await queryIgdb<IgdbNamedEntity>(
          "genres",
          `where name = "${escapeIgdbString(genre)}"; fields id; limit 1;`,
        )
      : [];

    if (genre && !genres.length) {
      return Response.json({ error: "The selected genre was not found." }, { status: 400 });
    }

    const conditions = [];
    if (genres[0]) conditions.push(`genres = (${genres[0].id})`);
    if (platform) conditions.push(`platforms = (${Number(platform)})`);
    if (releaseYear) {
      const startOfYear = Date.UTC(Number(releaseYear), 0, 1) / 1000;
      const startOfNextYear = Date.UTC(Number(releaseYear) + 1, 0, 1) / 1000;
      conditions.push(
        `first_release_date >= ${startOfYear} & first_release_date < ${startOfNextYear}`,
      );
    }
    const whereClause = conditions.length ? `where ${conditions.join(" & ")}; ` : "";

    const games = await queryIgdb<IgdbGame>(
      "games",
      `${searchTerm ? `search "${escapeIgdbString(searchTerm)}"; ` : ""}${whereClause}fields id, name, cover.url; limit 10;`,
    );

    return Response.json(
      games.map((game) => ({
        id: game.id,
        name: game.name,
        coverImage: getIgdbCoverImageUrl(game.cover?.url),
      })),
    );
  } catch (error) {
    console.error("Game search failed.", error);
    return Response.json({ error: "Game search failed." }, { status: 500 });
  }
}