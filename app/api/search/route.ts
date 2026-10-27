import { queryIgdb } from "@/lib/igdb";
import { getIgdbCoverImageUrl } from "@/lib/igdb-image";

type IgdbGame = {
  name: string;
  cover?: { url?: string } | null;
};

export async function GET(request: Request) {
  const searchTerm = new URL(request.url).searchParams.get("q")?.trim();

  if (!searchTerm) {
    return Response.json({ error: "A non-empty q parameter is required." }, { status: 400 });
  }

  const escapedSearchTerm = searchTerm
    .replace(/[\r\n]/g, " ")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"');

  try {
    const games = await queryIgdb<IgdbGame>(
      "games",
      `search "${escapedSearchTerm}"; fields name, cover.url; limit 10;`,
    );

    return Response.json(
      games.map((game) => ({
        name: game.name,
        coverImage: getIgdbCoverImageUrl(game.cover?.url),
      })),
    );
  } catch {
    return Response.json({ error: "Game search failed." }, { status: 500 });
  }
}