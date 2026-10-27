import { queryIgdb } from "@/lib/igdb";

export async function GET() {
  const games = await queryIgdb<{ id: number; name: string }>(
    "games",
    'search "zelda"; fields name; limit 5;'
  );
  return Response.json(games);
}